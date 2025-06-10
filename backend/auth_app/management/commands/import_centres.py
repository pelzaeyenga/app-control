import csv
from django.core.management.base import BaseCommand
from auth_app.models import Centre

class Command(BaseCommand):
    help = "Importe les centres depuis un fichier CSV"

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help="Chemin vers le fichier csv")

    def handle(self, *args, **options):
        csv_file = options['csv_file']

        try:
            with open(csv_file, newline='', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    nom = row['nom'].strip()
                    if not Centre.objects.filter(nom=nom).exists():
                        Centre.objects.create(nom=nom)
                        count += 1
                self.stdout.write(self.style.SUCCESS(f"{count} centre(s) importé(s) avec succès."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur : {str(e)}"))
