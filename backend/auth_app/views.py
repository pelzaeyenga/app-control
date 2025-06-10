from rest_framework import status,generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import CustomUser, Planification, Document, SummaryReport
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, PlanificationSerializer, CustomUserSerializer, DocumentSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from .permissions import IsSuperviseur
from django.shortcuts import get_object_or_404
import boto3
import logging
import os
from .utils import extract_text_from_s3_url, analyze_documents_with_openai, generate_summary_report, upload_report_to_s3
from django.http import FileResponse
import requests


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("Données reçues:", request.data)
        serializer = RegisterSerializer(data=request.data)

        email = request.data.get('email')

        try:
            user = CustomUser.objects.get(email=email)
            print(f"Utilisateur trouvé: {user}, has_usable_password: {user.has_usable_password()}")
        except CustomUser.DoesNotExist:
         print(f"ERREUR: Aucun utilisateur avec l'email {email}")
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Mot de passe défini avec succès."}, status=status.HTTP_200_OK)
        print("Erreurs:", serializer.errors)
    
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


# Connexion
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
       
        user = authenticate(username=email, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            redirect_url = '/calendar' if user.role == 'superviseur' else '/planning'
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'is_superuser': user.is_superuser,
                    'role': getattr(user, 'role', None),
                },
                'redirect_url': redirect_url
            })
        return Response({"detail": "Identifiants invalides"}, status=status.HTTP_401_UNAUTHORIZED)




# Informations de l'utilisateur connecté
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
             "is_superuser": user.is_superuser,  
            "role": getattr(user, 'role', None), 
        })
    
#planification
class PlanificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != 'controleur':
            return Response({"detail": "Vous n'êtes pas un contrôleur."}, status=403)

        planifications = Planification.objects.filter(controleur=user)
        serializer = PlanificationSerializer(planifications, many=True)
        return Response(serializer.data)

logger = logging.getLogger(__name__)



class DocumentUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        planification_id = request.data.get('planification_id')
        if not planification_id:
            return Response({'error': 'Planification ID requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            planification = Planification.objects.get(id=planification_id)
        except Planification.DoesNotExist:
            return Response({'error': 'Planification introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # Configurer le client S3
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )

        uploaded_urls = []
        
        try:
            for key, file in request.FILES.items():
                # Générer un nom de fichier unique
                file_name = f"documents/planification-{planification_id}/{file.name}"
                try:
                    # Uploader le fichier dans S3
                    s3_client.upload_fileobj(
                        file,
                        settings.AWS_STORAGE_BUCKET_NAME,
                        file_name,
                        ExtraArgs={'ContentType': file.content_type}
                    )
                    # Générer l'URL du fichier
                    file_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{file_name}"
                    # Sauvegarder l'URL dans la base de données
                    Document.objects.create(planification=planification, url=file_url)
                    uploaded_urls.append(file_url)
                except Exception as e:
                    logger.error(f"Erreur lors de l'upload du fichier {file.name}: {str(e)}")
                    return Response({'error': f"Erreur lors de l'upload: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Récupérer les URLs des documents pour analyse
            document_urls = Document.objects.filter(planification_id=planification_id).values_list('url', flat=True)
            texts = [extract_text_from_s3_url(url) for url in document_urls if extract_text_from_s3_url(url)]
            
            if not texts or len(texts) < 2:
                return Response({
                    'message': 'Documents téléchargés avec succès, mais moins de 2 textes extraits pour comparaison.',
                    'urls': uploaded_urls
                }, status=status.HTTP_201_CREATED)

            # Analyse avec OpenAI
            print("Début de l'analyse avec OpenAI...")
            analysis = analyze_documents_with_openai(texts)
            print(f"Résultat de l'analyse : {analysis}")

            # Créer le dictionnaire comparisons
            comparisons = {
                "between": "tous les documents",
                "summaries": analysis.get("summaries", []),
                "convergences": analysis.get("convergences", []),
                "divergences": analysis.get("divergences", [])
            }

            # Générer et uploader le rapport
            temp_report_path = f"temp_summary_{planification_id}.pdf"
            generate_summary_report(comparisons, temp_report_path)
            summary_url = upload_report_to_s3(temp_report_path, planification_id)
            os.remove(temp_report_path)

            # Enregistrer l'URL dans la base de données avec vérification
            if planification:
                SummaryReport.objects.update_or_create(
                    planification=planification,
                    defaults={'report_url': summary_url}
                )
                print(f"URL du rapport enregistrée pour la planification {planification.id}: {summary_url}")
            else:
                logger.warning("Planification non définie lors de l'enregistrement du rapport.")

            return Response({
                'message': 'Documents téléchargés, analysés et rapport généré avec succès.',
                'urls': uploaded_urls,
                'summary_report_url': summary_url
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Erreur dans DocumentUploadView: {str(e)}", exc_info=True)
            return Response({'error': f"Erreur serveur: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class PlanificationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        print(f"Vue PlanificationDetailView appelée pour pk={pk}")
        planification = get_object_or_404(Planification, pk=pk, controleur=request.user)
        serializer = PlanificationSerializer(planification)
        print(f"Planification trouvée: {serializer.data}")
        return Response(serializer.data)
    
class ControleurListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperviseur]

    def get(self, request):
        user = request.user
        # Liste des contrôleurs du même centre que le superviseur
        controleurs = CustomUser.objects.filter(role='controleur', centre=user.centre)
        serializer = CustomUserSerializer(controleurs, many=True)
        return Response(serializer.data)

class PlanningListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperviseur]

    def get(self, request, controleur_id):
        user = request.user
        # Vérifier que le contrôleur appartient au même centre que le superviseur
        controleur = get_object_or_404(CustomUser, id=controleur_id, role='controleur', centre=user.centre)
        planifications = Planification.objects.filter(controleur=controleur)
        serializer = PlanificationSerializer(planifications, many=True)
        return Response(serializer.data)    
    

class DocumentListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperviseur]

    def get(self, request, controleur_id):
        user = request.user
        date = request.query_params.get('date')
        if not date:
            return Response({"detail": "Date parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que le contrôleur appartient au même centre
        controleur = get_object_or_404(CustomUser, id=controleur_id, role='controleur', centre=user.centre)

        # Récupérer directement les documents pour le contrôleur et la date via la relation planification
        documents = Document.objects.filter(
            planification__controleur=controleur,
            planification__date=date
        )

        if not documents.exists():
            return Response({"detail": "No documents found for this date"}, status=status.HTTP_404_NOT_FOUND)

        planification = documents.first().planification  # Tous les documents partagent la même planification
        summary_report = getattr(planification, 'summary_report', None)

        # Récupérer le nom de l'employeur (au lieu de "entreprise")
        employeur_name = planification.employeur.nom if planification.employeur else "Employeur inconnu"

        # Sérialiser les documents
        serializer = DocumentSerializer(documents, many=True, context={'request': request})

        # Ajouter les informations du rapport final
        report_data = None
        if summary_report:
            report_data = {
                'id': summary_report.id,
                'report_url': summary_report.report_url,
                'created_at': summary_report.created_at
            }

        return Response({
            'entreprise_name': employeur_name,  # On garde la clé "entreprise_name" pour le frontend
            'documents': serializer.data,
            'summary_report': report_data
        })  

class DocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsSuperviseur]

    def get(self, request, document_id):
        user = request.user
        document = get_object_or_404(Document, id=document_id)

        # Vérifier que le document appartient à une planification d'un contrôleur du même centre
        controleur = document.planification.controleur
        if controleur.centre != user.centre or controleur.role != 'controleur':
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        # Télécharger le fichier depuis l'URL cloud
        try:
            response = requests.get(document.url, stream=True)
            response.raise_for_status()
        except requests.RequestException as e:
            return Response({"detail": f"Failed to download document: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Retourner le contenu du fichier en streaming
        file_name = document.url.split('/')[-1]
        return FileResponse(
            response.raw,
            as_attachment=True,
            filename=file_name,
            content_type=response.headers.get('content-type', 'application/octet-stream')
        )


class SummaryReportDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsSuperviseur]

    def get(self, request, report_id):
        user = request.user
        report = get_object_or_404(SummaryReport, id=report_id)

        # Vérifier que le rapport appartient à une planification d'un contrôleur du même centre
        controleur = report.planification.controleur
        if controleur.centre != user.centre or controleur.role != 'controleur':
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        # Télécharger le rapport depuis l'URL cloud
        try:
            response = requests.get(report.report_url, stream=True)
            response.raise_for_status()
        except requests.RequestException as e:
            return Response({"detail": f"Failed to download report: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Retourner le contenu du fichier en streaming
        file_name = report.report_url.split('/')[-1]
        return FileResponse(
            response.raw,
            as_attachment=True,
            filename=file_name,
            content_type=response.headers.get('content-type', 'application/octet-stream')
        )        