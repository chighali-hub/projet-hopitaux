from django.contrib.auth.models import AbstractUser , User
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('pharmacien', 'Pharmacien'),
        ('client', 'Client'),
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='client'
    )

    def __str__(self):
        return self.username



# =========================
# Pharmacie
# =========================
class Pharmacie(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'pharmacien'}
    )
    nom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    localisation = models.CharField(max_length=150, blank=True, default='')
    telephone = models.CharField(max_length=20)
    photo_profile = models.ImageField(upload_to='pharmacy_profiles/', null=True, blank=True) 
    is_open = models.BooleanField(default=True)


    def __str__(self):
        return self.nom


# =========================
# Medicament
# =========================
class Medicament(models.Model):
    id = models.AutoField(primary_key=True)  
    nom = models.CharField(max_length=100)
    categorie = models.CharField(max_length=100)
    forme = models.CharField(max_length=50)
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    quantite_stock = models.IntegerField()
    date_expiration = models.DateField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.nom


# =========================
# Stock (relation Pharmacie - Medicament)
# =========================
class Stock(models.Model):
    pharmacie = models.ForeignKey(
        Pharmacie,
        on_delete=models.CASCADE,
        related_name="stocks"
    )
    medicament = models.ForeignKey(
        Medicament,
        on_delete=models.CASCADE,
        related_name="stocks"
    )
    quantite = models.IntegerField()
    prix = models.FloatField()

    class Meta:
        unique_together = ('pharmacie', 'medicament')

    def __str__(self):
        return f"{self.medicament.nom} - {self.pharmacie.nom}"


# =========================
# Client
# =========================
class Client(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'client'},
        null=True,
        blank=True
    )
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100, default='Inconnu')
    email = models.EmailField(unique=True)

    def __str__(self):
        return f"{self.prenom} {self.nom}"


# =========================
# Commande
# =========================
class Commande(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="commandes"
    )
    date_commande = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Commande #{self.id} - {self.client}"

# =========================
# CommandeMedicament (détails commande)
# =========================
class CommandeMedicament(models.Model):
    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name="medicaments"
    )
    medicament = models.ForeignKey(
        Medicament,
        on_delete=models.CASCADE
    )
    quantite = models.IntegerField()

    def __str__(self):
        return f"{self.medicament.nom} x {self.quantite}"

# =========================
# Medicine Notification Request (client requests to be notified)
# =========================
class MedicineNotificationRequest(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="notification_requests"
    )
    medicine_name = models.CharField(max_length=200)  # Name searched by client
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)  # Can be deactivated if client unsubscribes
    
    class Meta:
        unique_together = ('client', 'medicine_name')
    
    def __str__(self):
        return f"{self.client.user.username} - {self.medicine_name}"

# =========================
# Medicine Notification (created when medicine becomes available)
# =========================
class MedicineNotification(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    medicine_name = models.CharField(max_length=200)
    pharmacie = models.ForeignKey(
        Pharmacie,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    medicament = models.ForeignKey(
        Medicament,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Notification: {self.medicine_name} disponible à {self.pharmacie.nom}"