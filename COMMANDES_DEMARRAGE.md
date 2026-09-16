# 🚀 Commandes pour Démarrer le Projet

## 📋 Prérequis
- Python 3.8+ installé
- Node.js 16+ installé
- pip installé (gestionnaire de paquets Python)

---

## 🔧 ÉTAPE 1 : Installation Backend (Django)

### 1.1 Aller dans le dossier backend
```bash
cd backend
```

### 1.2 Installer les dépendances Python
```bash
pip install -r requirements.txt
```

**OU** si vous utilisez un environnement virtuel (recommandé) :
```bash
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows:
venv\Scripts\activate
# Sur Mac/Linux:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### 1.3 Créer les migrations de base de données
```bash
python manage.py makemigrations
```

### 1.4 Appliquer les migrations
```bash
python manage.py migrate
```

### 1.5 (Optionnel) Créer un superutilisateur pour l'admin Django
```bash
python manage.py createsuperuser
```

### 1.6 Démarrer le serveur Django
```bash
python manage.py runserver
```

✅ **Le backend sera accessible sur :** `http://localhost:8000`

---

## 🎨 ÉTAPE 2 : Installation Frontend (React)

### 2.1 Ouvrir un NOUVEAU terminal (garder le backend en cours)

### 2.2 Aller dans le dossier frontend
```bash
cd frontend
```

### 2.3 Installer les dépendances Node.js
```bash
npm install
```

### 2.4 Démarrer le serveur de développement
```bash
npm run dev
```

✅ **Le frontend sera accessible sur :** `http://localhost:5173`

---

## 📝 RÉSUMÉ DES COMMANDES (Copier-Coller Rapide)

### Terminal 1 - Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## ⚠️ NOTES IMPORTANTES

1. **Google Maps API Key** : 
   - Dans `frontend/index.html`, remplacez `AIzaSyDummyKey` par votre vraie clé API Google Maps
   - Obtenez une clé sur : https://console.cloud.google.com/

2. **CORS** : 
   - Les origines autorisées sont configurées dans `backend/gestion_pharmacie/settings.py`
   - Par défaut : `http://localhost:5173` et `http://localhost:3000`

3. **Base de données** : 
   - SQLite est utilisé par défaut (fichier `db.sqlite3` dans le dossier backend)
   - Pour changer de base de données, modifiez `settings.py`

4. **Médias (Photos de profil)** :
   - Les photos sont stockées dans `backend/media/pharmacy_profiles/`
   - Ce dossier sera créé automatiquement lors du premier upload

---

## 🐛 Dépannage

### Erreur "Module not found"
```bash
# Réinstaller les dépendances
pip install -r requirements.txt
# ou
npm install
```

### Erreur de migration
```bash
# Supprimer le fichier db.sqlite3 et refaire les migrations
rm db.sqlite3  # Sur Windows: del db.sqlite3
python manage.py makemigrations
python manage.py migrate
```

### Erreur CORS
- Vérifier que `django-cors-headers` est installé
- Vérifier que le frontend tourne sur le port configuré dans `settings.py`

### Port déjà utilisé
```bash
# Backend - utiliser un autre port
python manage.py runserver 8001

# Frontend - modifier vite.config.js ou utiliser
npm run dev -- --port 3000
```

---

## ✅ Vérification que tout fonctionne

1. **Backend** : Ouvrir `http://localhost:8000` → Devrait afficher "API is running ✅"
2. **Frontend** : Ouvrir `http://localhost:5173` → Devrait afficher la page d'accueil
3. **Admin Django** : `http://localhost:8000/admin` → Se connecter avec le superutilisateur

---

## 🎯 Prochaines Étapes

1. Créer un compte Pharmacie via le formulaire d'inscription
2. Se connecter avec username + email
3. Choisir la localisation sur la carte
4. Gérer les médicaments dans la page Pharmacie

---

**Bon développement ! 🚀**














