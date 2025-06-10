import csv
from django.core.management.base import BaseCommand
from auth_app.models import Employeur, Centre

class Command(BaseCommand):
    help = "Importe les employeurs depuis un fichier CSV"

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help="Chemin vers le fichier csv des employeurs")

    def handle(self, *args, **options):
        csv_file = options['csv_file']

        with open(csv_file, newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                nom = row['nom'].strip()
                adresse = row['adresse'].strip()
                ville = row['ville'].strip()
                telephone = row['telephone'].strip()
                centre_nom = row['centre'].strip()
                score = int(row['score']) 
                # Récupérer le centre en fonction du nom
                centre = Centre.objects.filter(nom=centre_nom).first()
                if centre:
                    # Créer un employeur si ce centre existe
                    if not Employeur.objects.filter(nom=nom, centre=centre).exists():
                        Employeur.objects.create(
                            nom=nom,
                            adresse=adresse,
                            ville=ville,
                            centre=centre,
                            telephone=telephone,
                            score=score
                        )
                        count += 1
            self.stdout.write(self.style.SUCCESS(f"{count} employeur(s) importé(s) avec succès."))

