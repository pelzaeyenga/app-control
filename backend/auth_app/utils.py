# auth_app/utils.py

import boto3
from django.conf import settings
from io import BytesIO
import PyPDF2
import openai
import logging
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import json

logger = logging.getLogger(__name__)
def extract_text_from_s3_url(file_url):
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
        url_parts = file_url.replace(f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/", "").split("/")
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        file_key = "/".join(url_parts)

        file_object = BytesIO()
        s3_client.download_fileobj(bucket_name, file_key, file_object)
        file_object.seek(0)

        pdf_reader = PyPDF2.PdfReader(file_object)
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        # Validation du texte extrait
        extracted_text = text.strip()
        if not extracted_text:
            logger.warning(f"Aucun texte extrait du fichier {file_url}")
        else:
            logger.info(f"Texte extrait avec succès: {len(extracted_text)} caractères")
        
        return extracted_text
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction du texte depuis {file_url}: {str(e)}", exc_info=True)
        return ""

def segment_text(text, max_tokens=2500):  # Réduit pour laisser de la place au prompt
    if not text or not text.strip():
        return []
    
    words = text.split()
    if not words:
        return []
    
    segments = []
    current_segment = []
    current_length = 0

    for word in words:
        word_length = len(word) + 1
        if current_length + word_length > max_tokens and current_segment:
            segments.append(" ".join(current_segment))
            current_segment = [word]
            current_length = word_length
        else:
            current_segment.append(word)
            current_length += word_length
    
    if current_segment:
        segments.append(" ".join(current_segment))
    
    logger.info(f"Texte segmenté en {len(segments)} segments")
    return segments

def analyze_documents_with_openai(texts):
    try:
        # Validation des textes d'entrée
        if not texts or all(not text.strip() for text in texts):
            logger.error("Aucun texte valide fourni pour l'analyse")
            return {"summaries": [], "convergences": [], "divergences": [], "error": "Aucun texte à analyser"}
        
        # Filtrer les textes vides
        valid_texts = [text for text in texts if text and text.strip()]
        logger.info(f"Analyse de {len(valid_texts)} documents valides")
        
        # Segmentation des textes
        segmented_texts = []
        for i, text in enumerate(valid_texts):
            segments = segment_text(text)
            if segments:
                segmented_texts.extend(segments)
                logger.info(f"Document {i+1}: {len(segments)} segments créés")
            else:
                logger.warning(f"Document {i+1}: aucun segment créé")
        
        if not segmented_texts:
            logger.error("Aucun segment de texte créé")
            return {"summaries": [], "convergences": [], "divergences": [], "error": "Aucun segment de texte à analyser"}

        # Construction du prompt amélioré
        prompt = (
            "Tu es un expert comptable qui analyse des documents financiers. "
            "Analyse les textes suivants extraits de documents financiers et produis une analyse structurée.\n\n"
            "IMPORTANT: Ta réponse doit être un JSON valide avec cette structure exacte:\n"
            "{\n"
            '  "summaries": ["résumé 1", "résumé 2", ...],\n'
            '  "convergences": ["point commun 1", "point commun 2", ...],\n'
            '  "divergences": ["différence 1", "différence 2", ...]\n'
            "}\n\n"
            "Pour chaque segment, identifie:\n"
            "- Les chiffres clés (CA, bénéfices, pertes, ratios)\n"
            "- Les anomalies ou points d'attention\n"
            "- Les tendances financières\n\n"
            "Puis compare tous les segments pour identifier convergences et divergences.\n\n"
            "Textes à analyser:\n"
        )
        
        for idx, text in enumerate(segmented_texts, 1):
            # Limiter la taille de chaque segment dans le prompt
            text_preview = text[:1000] if len(text) > 1000 else text
            prompt += f"=== SEGMENT {idx} ===\n{text_preview}\n\n"

        logger.info(f"Envoi de la requête à OpenAI avec {len(segmented_texts)} segments")
        
        # Configuration OpenAI mise à jour
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-1106",  # Version plus récente
            messages=[
                {
                    "role": "system", 
                    "content": "Tu es un expert comptable. Réponds uniquement en JSON valide selon le format demandé."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            max_tokens=2000,
            temperature=0.2,  # Plus déterministe
            response_format={"type": "json_object"}  # Force la réponse JSON
        )
        
        analysis_text = response.choices[0].message.content
        logger.info(f"Réponse reçue d'OpenAI: {len(analysis_text)} caractères")
        
        # Debug: afficher la réponse brute
        logger.debug(f"Réponse OpenAI brute: {analysis_text}")
        
        try:
            analysis = json.loads(analysis_text)
            
            # Validation de la structure
            required_keys = ['summaries', 'convergences', 'divergences']
            for key in required_keys:
                if key not in analysis:
                    analysis[key] = []
                elif not isinstance(analysis[key], list):
                    analysis[key] = [str(analysis[key])]
            
            logger.info(f"Analyse réussie: {len(analysis['summaries'])} résumés, "
                       f"{len(analysis['convergences'])} convergences, "
                       f"{len(analysis['divergences'])} divergences")
            
            return analysis
            
        except json.JSONDecodeError as je:
            logger.error(f"Erreur de parsing JSON: {str(je)}")
            logger.error(f"Contenu reçu: {analysis_text}")
            return {
                "summaries": [f"Erreur d'analyse: réponse invalide"],
                "convergences": [], 
                "divergences": [],
                "error": f"Erreur JSON: {str(je)}"
            }
            
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse avec OpenAI : {str(e)}", exc_info=True)
        return {
            "summaries": [f"Erreur d'analyse: {str(e)}"], 
            "convergences": [], 
            "divergences": [],
            "error": str(e)
        }

def generate_summary_report(comparisons, output_path):
    try:
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        # Titre
        title = Paragraph("Rapport de Synthèse des Documents Financiers", styles['Heading1'])
        elements.append(title)
        elements.append(Spacer(1, 20))
        
        # Debug: afficher le contenu reçu
        logger.info(f"Génération du rapport avec: {comparisons}")
        
        # Vérification si des erreurs sont présentes
        if comparisons.get("error"):
            elements.append(Paragraph(f"Erreur d'analyse: {comparisons['error']}", styles['Heading2']))
            elements.append(Spacer(1, 12))

        # Section Résumés
        summaries = comparisons.get("summaries", [])
        elements.append(Paragraph("1. RÉSUMÉS DES DOCUMENTS", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        if summaries and any(summary.strip() for summary in summaries):
            for idx, summary in enumerate(summaries, 1):
                if summary and summary.strip():
                    elements.append(Paragraph(f"Document {idx}:", styles['Heading3']))
                    elements.append(Paragraph(summary, styles['BodyText']))
                    elements.append(Spacer(1, 12))
        else:
            elements.append(Paragraph("Aucun résumé disponible.", styles['BodyText']))
        
        elements.append(Spacer(1, 20))

        # Section Convergences
        convergences = comparisons.get("convergences", [])
        elements.append(Paragraph("2. POINTS DE CONVERGENCE", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        if convergences and any(conv.strip() for conv in convergences):
            for conv in convergences:
                if conv and conv.strip():
                    elements.append(Paragraph(f"• {conv}", styles['BodyText']))
                    elements.append(Spacer(1, 6))
        else:
            elements.append(Paragraph("Aucune convergence identifiée.", styles['BodyText']))
        
        elements.append(Spacer(1, 20))

        # Section Divergences
        divergences = comparisons.get("divergences", [])
        elements.append(Paragraph("3. POINTS DE DIVERGENCE", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        if divergences and any(div.strip() for div in divergences):
            for div in divergences:
                if div and div.strip():
                    elements.append(Paragraph(f"• {div}", styles['BodyText']))
                    elements.append(Spacer(1, 6))
        else:
            elements.append(Paragraph("Aucune divergence identifiée.", styles['BodyText']))

        # Construction du document
        doc.build(elements)
        logger.info(f"Rapport généré avec succès: {output_path}")
        return output_path
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération du rapport: {str(e)}", exc_info=True)
        raise

# Fonction utilitaire pour débugger
def debug_document_analysis(file_urls):
    """Fonction pour débugger l'analyse étape par étape"""
    logger.info(f"=== DÉBUT DU DEBUG ===")
    
    # Étape 1: Extraction des textes
    texts = []
    for i, url in enumerate(file_urls):
        logger.info(f"Extraction du document {i+1}: {url}")
        text = extract_text_from_s3_url(url)
        texts.append(text)
        logger.info(f"Texte extrait: {len(text)} caractères")
        if text:
            logger.debug(f"Aperçu: {text[:200]}...")
    
    # Étape 2: Analyse
    logger.info(f"Analyse de {len(texts)} documents")
    result = analyze_documents_with_openai(texts)
    logger.info(f"Résultat de l'analyse: {result}")
    
    return result


def upload_report_to_s3(file_path, planification_id):
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )
    report_name = f"reports/planification-{planification_id}/summary_report.pdf"
    with open(file_path, 'rb') as f:
        s3_client.upload_fileobj(f, settings.AWS_STORAGE_BUCKET_NAME, report_name, ExtraArgs={'ContentType': 'application/pdf'})
    return f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{report_name}"