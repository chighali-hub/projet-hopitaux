from django.contrib import admin
from .models import (
    User,
    Pharmacie,
    Medicament,
    Stock,
    Client,
    Commande,
    CommandeMedicament
)

# =========================
# User
# =========================
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff')
    search_fields = ('username', 'email')


# =========================
# Pharmacie
# =========================
@admin.register(Pharmacie)
class PharmacieAdmin(admin.ModelAdmin):
    list_display = ('nom', 'localisation', 'is_open')
    list_filter = ('is_open',)
    search_fields = ('nom',)


# =========================
# Medicament
# =========================
@admin.register(Medicament)
class MedicamentAdmin(admin.ModelAdmin):
    list_display = ('nom', 'categorie')
    search_fields = ('nom', 'categorie')


# =========================
# Stock
# =========================
@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('pharmacie', 'medicament', 'quantite', 'prix')
    list_filter = ('pharmacie',)
    search_fields = ('medicament__nom',)


# =========================
# Client
# =========================
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('nom', 'email')
    search_fields = ('nom', 'email')


# =========================
# Commande
# =========================
@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'date_commande')
    list_filter = ('date_commande',)


# =========================
# CommandeMedicament
# =========================
@admin.register(CommandeMedicament)
class CommandeMedicamentAdmin(admin.ModelAdmin):
    list_display = ('commande', 'medicament', 'quantite')

