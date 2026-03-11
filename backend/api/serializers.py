from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import *
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role']

class PharmacieSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    photo_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = Pharmacie
        fields = ['id', 'user', 'nom', 'email', 'localisation', 'telephone', 'photo_profile', 'is_open', 'username']
        read_only_fields = ['id', 'user']
    
    def get_photo_profile(self, obj):
        if obj.photo_profile:
            request = self.context.get('request')
            if request:
                # Use build_absolute_uri to get full URL
                url = request.build_absolute_uri(obj.photo_profile.url)
                # Ensure we don't have double slashes
                return url.replace('//media/', '/media/')
            # Fallback: construct URL manually
            photo_url = obj.photo_profile.url
            if photo_url.startswith('/'):
                return f"http://localhost:8000{photo_url}"
            return f"http://localhost:8000/{settings.MEDIA_URL.rstrip('/')}/{photo_url}"
        return None

class MedicamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicament
        fields = '__all__'


class StockSerializer(serializers.ModelSerializer):
    medicament_nom = serializers.CharField(source='medicament.nom', read_only=True)
    medicament_categorie = serializers.CharField(source='medicament.categorie', read_only=True)
    pharmacie_nom = serializers.CharField(source='pharmacie.nom', read_only=True)
    pharmacie_telephone = serializers.CharField(source='pharmacie.telephone', read_only=True)
    pharmacie_localisation = serializers.CharField(source='pharmacie.localisation', read_only=True)
    pharmacie_is_open = serializers.BooleanField(source='pharmacie.is_open', read_only=True)
    medicament = MedicamentSerializer(read_only=True)
    
    class Meta:
        model = Stock
        fields = [
            'id',
            'pharmacie',
            'medicament',
            'quantite',
            'prix',
            'medicament_nom',
            'medicament_categorie',
            'pharmacie_nom',
            'pharmacie_telephone',
            'pharmacie_localisation',
            'pharmacie_is_open',
        ]

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class CommandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commande
        fields = '__all__'

## Registration Serializer

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'client')
        )
        return user

## Pharmacy Registration Serializer

class PharmacyRegisterSerializer(serializers.Serializer):
    nom = serializers.CharField(max_length=100)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    telephone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=6)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        if Pharmacie.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return value
    
    def create(self, validated_data):
        # Create User with hashed password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role='pharmacien'
        )
        
        # Create Pharmacie
        pharmacie = Pharmacie.objects.create(
            user=user,
            nom=validated_data['nom'],
            email=validated_data['email'],
            telephone=validated_data['telephone'],
            localisation='',  # Will be set later via location endpoint
        )
        
        return pharmacie

## Client Registration Serializer

class ClientRegisterSerializer(serializers.Serializer):
    nom = serializers.CharField(max_length=100)
    prenom = serializers.CharField(max_length=100)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        if Client.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return value
    
    def create(self, validated_data):
        # Create User with hashed password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role='client'
        )
        
        # Create Client
        client = Client.objects.create(
            user=user,
            nom=validated_data['nom'],
            prenom=validated_data['prenom'],
            email=validated_data['email'],
        )
        
        return client

## Medicine Notification Serializers

class MedicineNotificationRequestSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    client_prenom = serializers.CharField(source='client.prenom', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    
    class Meta:
        model = MedicineNotificationRequest
        fields = ['id', 'client', 'client_nom', 'client_prenom', 'client_email', 'medicine_name', 'created_at', 'is_active']
        read_only_fields = ['id', 'client', 'created_at']

class MedicineNotificationSerializer(serializers.ModelSerializer):
    pharmacie_nom = serializers.CharField(source='pharmacie.nom', read_only=True)
    pharmacie_telephone = serializers.CharField(source='pharmacie.telephone', read_only=True)
    pharmacie_localisation = serializers.CharField(source='pharmacie.localisation', read_only=True)
    medicament_nom = serializers.CharField(source='medicament.nom', read_only=True)
    prix = serializers.FloatField(source='stock.prix', read_only=True)
    quantite = serializers.IntegerField(source='stock.quantite', read_only=True)
    
    class Meta:
        model = MedicineNotification
        fields = [
            'id',
            'medicine_name',
            'pharmacie_nom',
            'pharmacie_telephone',
            'pharmacie_localisation',
            'medicament_nom',
            'prix',
            'quantite',
            'created_at',
            'is_read',
        ]
        read_only_fields = ['id', 'created_at']