# 🔴 DEBUG : Erreur 403 "Accès refusé" - Solutions Appliquées

## 📋 Problème Identifié

Après l'inscription d'un pharmacien, lors de la confirmation de localisation, l'API `/api/location/update/` retourne **403 Forbidden** avec le message "Accès refusé".

## 🔍 Causes Possibles

1. **Session Django non créée après inscription** : Même si `login(request, user)` est appelé, les cookies ne sont peut-être pas correctement envoyés/reçus.
2. **Cookies non persistés** : Le frontend ne reçoit peut-être pas les cookies de session après l'inscription.
3. **Serveur Django non redémarré** : Les modifications du code ne sont pas actives.
4. **CORS/Cookies** : Problème de configuration CORS empêchant l'envoi des cookies.

## ✅ Corrections Appliquées

### 1. Backend - Configuration CSRF et Session (`settings.py`)

```python
# CSRF Cookie Configuration
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False

# Session Configuration
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = True
SESSION_SAVE_EVERY_REQUEST = True
SESSION_COOKIE_AGE = 86400
SESSION_COOKIE_NAME = 'sessionid'
```

### 2. Backend - PharmacyRegisterView (`views.py`)

- ✅ Appel explicite à `login(request, user)` pour créer la session Django
- ✅ `request.session.save()` pour forcer la sauvegarde de la session
- ✅ Vérification de `request.user.is_authenticated` après login
- ✅ Retour de `session_key` dans la réponse pour debug

### 3. Backend - LocationUpdateView (`views.py`)

- ✅ Messages d'erreur détaillés avec informations de debug
- ✅ Vérification explicite de `request.user.is_authenticated`
- ✅ Vérification du rôle `pharmacien`
- ✅ Retour 401 si non authentifié, 403 si rôle incorrect

### 4. Frontend - App.jsx

- ✅ Vérification de la session avec backend après inscription
- ✅ Délai de 100ms pour permettre la propagation des cookies
- ✅ Utilisation des données de session du backend (source de vérité)

### 5. Frontend - LocationPage.jsx

- ✅ Vérification de session AVANT l'appel à `updateLocation`
- ✅ Logs de débogage dans la console
- ✅ Messages d'erreur clairs

### 6. Frontend - api.js

- ✅ Logs de débogage pour `updateLocation`
- ✅ Gestion d'erreurs améliorée

## 🚀 Actions à Effectuer

### ⚠️ CRITIQUE : Redémarrer le Serveur Django

**Le serveur Django DOIT être redémarré pour que les modifications prennent effet !**

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer :
cd backend
python manage.py runserver
```

### Vérification dans la Console du Navigateur

1. Ouvrir les **Developer Tools** (F12)
2. Aller dans l'onglet **Console**
3. Après l'inscription, vérifier les logs :
   - `✅ Inscription réussie, vérification de la session...`
   - `✅ Session vérifiée avec succès:`
4. Lors de la confirmation de localisation, vérifier :
   - `🔍 Vérification de la session avant mise à jour...`
   - `✅ Session valide:`
   - `📍 Mise à jour de la localisation...`
   - `✅ Localisation mise à jour avec succès`

### Vérification des Cookies

1. Dans les **Developer Tools**, aller dans l'onglet **Application** (ou **Storage**)
2. Vérifier **Cookies** → `http://localhost:8000`
3. Vérifier la présence de :
   - `sessionid` (cookie de session Django)
   - `csrftoken` (cookie CSRF)

### Test de Session

1. Après l'inscription, ouvrir la console
2. Taper : `fetch('http://localhost:8000/api/session/', { credentials: 'include' }).then(r => r.json()).then(console.log)`
3. Vérifier que la réponse contient les données de session

## 🔧 Si le Problème Persiste

### 1. Vérifier que le serveur Django est bien redémarré

```bash
# Vérifier que le processus Django utilise le bon code
# Les logs de debug devraient apparaître dans la console Django
```

### 2. Vérifier les cookies dans le navigateur

- Les cookies doivent être présents après l'inscription
- Si absents, problème de CORS ou de configuration

### 3. Vérifier les logs Django

- Ouvrir le terminal où Django tourne
- Vérifier les erreurs éventuelles lors de l'appel à `/api/location/update/`

### 4. Tester avec curl (pour isoler le problème)

```bash
# 1. S'inscrire et noter le sessionid du cookie
# 2. Tester l'endpoint avec curl :
curl -X POST http://localhost:8000/api/location/update/ \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionid=VOTRE_SESSION_ID" \
  -d '{"latitude": 18.0735, "longitude": -15.9582}'
```

## 📝 Notes Importantes

- **Les cookies sont nécessaires** : Sans cookies de session, Django ne peut pas authentifier l'utilisateur
- **CORS doit être configuré** : `CORS_ALLOW_CREDENTIALS = True` est essentiel
- **Le frontend doit envoyer les cookies** : `credentials: 'include'` dans tous les appels API
- **Le backend doit créer la session** : `login(request, user)` est obligatoire après inscription

## 🎯 Résultat Attendu

Après ces corrections et le redémarrage du serveur Django :

1. ✅ Inscription → Session créée automatiquement
2. ✅ Cookies reçus par le frontend
3. ✅ Vérification de session réussie
4. ✅ Confirmation de localisation → 200 OK (pas 403)
5. ✅ Redirection vers la page Pharmacie













