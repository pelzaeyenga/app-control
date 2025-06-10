
from rest_framework import serializers
from .models import CustomUser
from .models import Planification, Employeur, Document

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    reset_password = serializers.BooleanField(default=False, required=False)

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        reset_password = validated_data.get('reset_password', False)

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Aucun utilisateur avec cet email.")

        if user.has_usable_password() and not reset_password:
            raise serializers.ValidationError("Un mot de passe est déjà défini pour cet utilisateur.")

        user.set_password(password)
        user.save()
        return user




class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'nom', 'prenom']



class EmployeurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employeur
        fields = ['id', 'nom', 'adresse']  # Inclure nom et adresse



class PlanificationSerializer(serializers.ModelSerializer):
    controleur = CustomUserSerializer()  
    employeur = EmployeurSerializer()
    class Meta:
        model = Planification
        fields = ['id', 'date', 'controleur', 'employeur']
         

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'url', 'uploaded_at']