import csv
from django.core.management.base import BaseCommand
from auth_app.models import JourFerie
from datetime import datetime

class Command(BaseCommand):
    help = "Importe les jours fériés depuis un fichier CSV"

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help="Chemin vers le fichier CSV des jours fériés")

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        count = 0

        with open(csv_file, newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try: 
                    nom = row.get('nom', '').strip()
                    date = datetime.strptime(row['date'].strip(), '%Y-%m-%d').date()
                   
                    if not JourFerie.objects.filter(date=date).exists():
                        JourFerie.objects.create(date=date, nom=nom)
                        count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Erreur avec la ligne {row}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"{count} jour(s) férié(s) importé(s) avec succès."))
