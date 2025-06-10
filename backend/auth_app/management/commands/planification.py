from datetime import date, timedelta
from collections import defaultdict
import random  # Ajout de random pour la répartition aléatoire
from django.core.management.base import BaseCommand
from django.db import transaction
from auth_app.models import CustomUser, Employeur, JourFerie, JourConge, Planification


class Command(BaseCommand):
    help = "Effectue la planification équilibrée des contrôles (répartis de façon aléatoire sur l'année)"

    @transaction.atomic
    def handle(self, *args, **kwargs):
        today = date.today()
        end_date = date(today.year, 12, 31)
        self.stdout.write(f"Planification des contrôles du {today} au {end_date}")

        jours_feries = set(JourFerie.objects.filter(date__range=(today, end_date)).values_list('date', flat=True))

        # Liste des semaines entre today et end_date avec mélange aléatoire
        semaines = []
        d = today
        while d <= end_date:
            iso_year, iso_week, _ = d.isocalendar()
            semaines.append((iso_year, iso_week))
            d += timedelta(days=7)
        semaines = list(dict.fromkeys(semaines))  # Supprime les doublons
        random.shuffle(semaines)  # Mélange aléatoire des semaines

        # Congés par contrôleur
        conges_map = defaultdict(set)
        for cid, d in JourConge.objects.filter(date__range=(today, end_date)).values_list('controleur_id', 'date'):
            conges_map[cid].add(d)

        jours_valides = {
            d for d in (today + timedelta(days=i) for i in range((end_date - today).days + 1))
            if d.weekday() < 5 and d not in jours_feries
        }

        # Contrôleurs par centre
        controleurs = list(CustomUser.objects.filter(role='controleur'))
        controleurs_par_centre = defaultdict(list)
        for c in controleurs:
            controleurs_par_centre[c.centre].append(c)

        # Contrôles déjà planifiés
        employeurs_deja_planifies = set(Planification.objects.values_list('employeur_id', flat=True))
        planifs_par_controleur = defaultdict(int)
        semaines_occupees = defaultdict(set)  # (controleur_id) -> set((year, week))
        
        # Pour équilibrer les jours de la semaine
        jours_attribution = defaultdict(int)  # Compteur pour chaque jour de la semaine (0-4 pour lun-ven)

        # Préremplir planifs existantes si script relancé
        for controleur_id, date_planif in Planification.objects.values_list('controleur_id', 'date'):
            iso = date_planif.isocalendar()
            semaines_occupees[controleur_id].add((iso[0], iso[1]))
            planifs_par_controleur[controleur_id] += 1
            jours_attribution[date_planif.weekday()] += 1

        # Mélanger les employeurs mais garder en premier ceux avec le score le plus élevé
        employeurs = list(Employeur.objects.order_by('-score'))  # Score décroissant
        
        # Division en groupes pour permettre une répartition sur l'année
        groupes_employeurs = []
        chunk_size = max(1, len(employeurs) // len(semaines))
        for i in range(0, len(employeurs), chunk_size):
            groupe = employeurs[i:i+chunk_size]
            random.shuffle(groupe)  # Mélange dans chaque groupe
            groupes_employeurs.append(groupe)
        
        # Mélanger l'ordre des groupes pour éviter des regroupements systématiques
        random.shuffle(groupes_employeurs)
        
        # Aplatir la liste de groupes
        employeurs_reordonnes = [emp for groupe in groupes_employeurs for emp in groupe]
        
        planifications_creees = 0

        for employeur in employeurs_reordonnes:
            if employeur.id in employeurs_deja_planifies:
                continue

            controleurs_du_centre = controleurs_par_centre.get(employeur.centre, [])
            if not controleurs_du_centre:
                continue

            # Trier par ceux qui ont le moins de contrôles
            controleurs_du_centre = sorted(
                controleurs_du_centre,
                key=lambda c: planifs_par_controleur[c.id]
            )

            planifie = False

            # Mélanger l'ordre des semaines pour chaque employeur
            semaines_melangees = semaines.copy()
            random.shuffle(semaines_melangees)

            for year, week in semaines_melangees:
                if planifie:
                    break

                # Récupérer les jours valides de cette semaine
                jours_de_la_semaine = [
                    d for d in jours_valides
                    if d.isocalendar()[:2] == (year, week)
                ]

                if not jours_de_la_semaine:
                    continue
                
                # Classer les jours par fréquence d'utilisation (préférer les jours moins utilisés)
                jours_de_la_semaine.sort(key=lambda d: jours_attribution[d.weekday()])

                for controleur in controleurs_du_centre:
                    if (year, week) in semaines_occupees[controleur.id]:
                        continue

                    # Trouver un jour disponible cette semaine
                    for jour in jours_de_la_semaine:
                        if jour in conges_map[controleur.id]:
                            continue

                        # Attribuer
                        Planification.objects.create(
                            controleur=controleur,
                            employeur=employeur,
                            date=jour
                        )
                        employeurs_deja_planifies.add(employeur.id)
                        semaines_occupees[controleur.id].add((year, week))
                        planifs_par_controleur[controleur.id] += 1
                        jours_attribution[jour.weekday()] += 1  # Incrémenter le compteur pour ce jour
                        planifications_creees += 1
                        planifie = True
                        
                        # Log pour voir la répartition
                        self.stdout.write(f"Contrôle planifié: {employeur.id} le {jour} ({['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'][jour.weekday()]})")
                        break

                    if planifie:
                        break  # Ne pas chercher d'autre contrôleur

       
       

        self.stdout.write(self.style.SUCCESS(f"{planifications_creees} planifications créées avec répartition aléatoire."))