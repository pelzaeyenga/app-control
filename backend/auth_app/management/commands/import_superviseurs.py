import csv
from django.core.management.base import BaseCommand
from auth_app.models import CustomUser, Centre

class Command(BaseCommand):
    help = "Importe les superviseurs depuis un fichier CSV"

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help="Chemin vers le fichier csv des contrôleurs")

    def handle(self, *args, **options):
        csv_file = options['csv_file']

        with open(csv_file, newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                prenom = row['prenom'].strip()
                nom = row['nom'].strip()
                centre_nom = row['centre'].strip()
                email = row['email'].strip()

                centre = Centre.objects.filter(nom=centre_nom).first()
                if centre:
                    if not CustomUser.objects.filter(email=email).exists():
                        CustomUser.objects.create(
                            prenom=prenom,
                            email=email,
                            nom=nom,
                            role='superviseur',
                            centre=centre,
                            is_active=True  # ou False si tu veux qu’ils activent leur compte plus tard
                        )
                        count += 1
            self.stdout.write(self.style.SUCCESS(f"{count} superviseur(s) importé(s) avec succès.")) 
