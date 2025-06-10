from django.db import models
from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager

class Centre (models.Model):
    nom = models.CharField(max_length=200)
    superviseur = models.ForeignKey( 'CustomUser', on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'role': 'superviseur'}, related_name='centres_supervises')

    def __str__(self):
        return self.nom
    

class CustomUserManager(BaseUserManager):
  def create_user (self, email, password = None,**extra_fields):
     if not email: 
        raise ValueError( 'Email is a required field')
     email = self.normalize_email(email) 
     user= self.model(email=email, **extra_fields)
     user.set_password(password)
     user.save(using=self._db)
     return user
  
  def create_superuser(self, email, password=None, **extra_fields):
     extra_fields.setdefault('is_staff', True)
     extra_fields.setdefault('is_superuser', True)
     return self.create_user(email, password, **extra_fields)
  




class CustomUser(AbstractUser, PermissionsMixin):
    ROLE_CHOICES= [
        ('controleur', 'Contrôleur'),
        ('superviseur', 'Superviseur'),
    ]
    username = None

    email= models.EmailField(max_length=200, unique=True)
    nom= models.CharField(max_length=100, null=True, blank=True)
    prenom= models.CharField(max_length=100, null=True, blank=True)
    role= models.CharField(max_length=50, choices =ROLE_CHOICES,  null=True, blank=True)
    centre= models.ForeignKey(Centre, on_delete= models.SET_NULL, null=True, related_name='utilisateurs')

    is_active= models.BooleanField(default=True)

    objects= CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS =[]
def __str__(self):
    return self.email



class Employeur(models.Model):
    nom = models.CharField(max_length=100)
    adresse = models.CharField(max_length=255)
    ville = models.CharField(max_length=100)
    centre = models.ForeignKey(Centre, on_delete=models.SET_NULL, null=True)
    telephone = models.CharField(max_length=20)
    score = models.IntegerField(default=0)


    def __str__(self):
        return f"{self.nom} - {self.ville}"




class JourFerie(models.Model):
    
    nom = models.CharField(max_length=255, blank=True, null=True)  # Description du jour férié (ex : "Fête nationale")
    date = models.DateField()  # Date du jour férié
    def __str__(self):
        return f"{self.date} - {self.nom if self.nom else 'Jour férié'}"



class JourConge(models.Model):
    controleur = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'controleur'},
        related_name='jours_conges'
    )
    date = models.DateField()

    def __str__(self):
        return f"{self.controleur} - {self.date}"


class Planification(models.Model):
    controleur = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'controleur'})
    employeur = models.ForeignKey(Employeur, on_delete=models.CASCADE)
    date = models.DateField()

    def __str__(self):
        return f"{self.date} - {self.controleur.email} -> {self.employeur.nom}"



class Document(models.Model):
    planification = models.ForeignKey(Planification, on_delete=models.CASCADE, related_name='documents')
    url = models.URLField(max_length=500)  # URL du fichier dans le cloud
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Document for Planification {self.planification.id} - {self.url}"
    

class SummaryReport(models.Model):
    planification = models.OneToOneField(Planification, on_delete=models.CASCADE, related_name='summary_report')
    report_url = models.URLField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rapport pour Planification {self.planification.id}"

    class Meta:
        verbose_name = "Rapport de synthèse"
        verbose_name_plural = "Rapports de synthèse"    