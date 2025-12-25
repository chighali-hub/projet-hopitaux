from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('pharmacien', 'Pharmacien'),
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='pharmacien'
    )

    def __str__(self):
        return self.username



# =========================
# Pharmacie
# =========================
class Pharmacie(models.Model):
    nom = models.CharField(max_length=100)
    localisation = models.CharField(max_length=150)
    is_open = models.BooleanField(default=True)

    def __str__(self):
        return self.nom


# =========================
# Medicament
# =========================
class Medicament(models.Model):
    nom = models.CharField(max_length=100)
    categorie = models.CharField(max_length=100)

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
    nom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.nom


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
        return f"Commande #{self.id} - {self.client.nom}"


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
