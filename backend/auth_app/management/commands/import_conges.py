import csv
from datetime import datetime
from django.core.management.base import BaseCommand
from auth_app.models import JourConge, CustomUser  

class Command(BaseCommand):
    help = "Importe les jours de congés des contrôleurs depuis un fichier CSV"

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help="Chemin vers le fichier CSV des jours de congés")

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        count = 0

        with open(csv_file, newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    customuser_id = CustomUser.objects.get(id=row['customuser_id'], role='controleur')
                    date_conge = datetime.strptime(row['date_conge'], "%Y-%m-%d").date()
                    _, created = JourConge.objects.get_or_create(controleur=customuser_id, date=date_conge)
                    if created:
                        count += 1
                except CustomUser.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Contrôleur avec ID {row['id']} introuvable."))

        self.stdout.write(self.style.SUCCESS(f"{count} jour(s) de congés importé(s) avec succès."))
