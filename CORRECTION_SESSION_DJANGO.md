# ✅ Correction Session Django - Backend Uniquement

## 🔴 Problème Identifié

Lors de l'inscription d'une pharmacie, la session Django n'est **PAS créée**, donc :
- `request.user.is_authenticated == False`
- `request.user.role != "pharmacien"`
- `/api/location/update/` retourne **403 Forbidden**

## ✅ Solution Appliquée

### 1. PharmacyRegisterView - Création de Session

**Fichier : `backend/api/views.py`**

```python
class PharmacyRegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        from .serializers import PharmacyRegisterSerializer
        serializer = PharmacyRegisterSerializer(data=request.data)
        if serializer.is_valid():
            pharmacie = serializer.save()
            user = pharmacie.user
            
            # CRITICAL STEP 1: Ensure session exists (create if not)
            # Django requires a session to exist before login() can work
            if not request.session.exists(request.session.session_key):
                request.session.create()
            
            # CRITICAL STEP 2: Login user to authenticate Django session
            # This sets request.user.is_authenticated = True
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            
            # CRITICAL STEP 3: Store additional session data
            request.session['user_id'] = user.id
            request.session['username'] = user.username
            request.session['role'] = user.role
            request.session['id_pharmacie'] = pharmacie.id
            request.session['nom'] = pharmacie.nom
            request.session['email'] = pharmacie.email
            request.session['has_location'] = bool(pharmacie.localisation)
            
            # CRITICAL STEP 4: Force session save to persist cookie
            # This ensures the session cookie is sent in the response
            request.session.save()
            
            # CRITICAL STEP 5: Verify authentication is working
            if not request.user.is_authenticated:
                # Fallback: try login again if first attempt failed
                login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                request.session.save()
            
            return Response({
                "message": "Pharmacie créée avec succès",
                "pharmacie_id": pharmacie.id,
                "user_id": user.id,
                "role": "pharmacien",
                "username": user.username,
                "nom": pharmacie.nom,
                "email": pharmacie.email,
                "has_location": bool(pharmacie.localisation),
                "authenticated": request.user.is_authenticated,
                "session_key": request.session.session_key,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### 2. LocationUpdateView - Vérification d'Authentification

**Fichier : `backend/api/views.py`**

```python
class LocationUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Update pharmacy location"""
        # CRITICAL: Check authentication first
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Non authentifié'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # CRITICAL: Check role
        if request.user.role != 'pharmacien':
            return Response(
                {'error': 'Accès refusé'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            pharmacie = Pharmacie.objects.get(user=request.user)
        except Pharmacie.DoesNotExist:
            return Response(
                {'error': 'Pharmacie non trouvée'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if not latitude or not longitude:
            return Response(
                {'error': 'Latitude et longitude requises'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(latitude)
            lon = float(longitude)
            pharmacie.localisation = f"{lat},{lon}"
            pharmacie.save()
            
            # Update session
            request.session['has_location'] = True
            
            return Response({
                'message': 'Localisation enregistrée avec succès',
                'localisation': pharmacie.localisation
            }, status=status.HTTP_200_OK)
        except ValueError:
            return Response(
                {'error': 'Coordonnées invalides'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
```

### 3. Imports Nécessaires

**Fichier : `backend/api/views.py`**

```python
from django.contrib.auth import get_user_model, authenticate, login
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
```

## 🔑 Points Critiques

1. **Créer la session AVANT login()** : `request.session.create()` si la session n'existe pas
2. **Appeler login() explicitement** : `login(request, user, backend='django.contrib.auth.backends.ModelBackend')`
3. **Sauvegarder la session** : `request.session.save()` pour forcer la persistance du cookie
4. **Vérifier l'authentification** : `request.user.is_authenticated` doit être `True` après `login()`

## 🚀 Test de Vérification

### 1. Vérifier la Session après Inscription

```bash
# Après inscription, appeler :
GET /api/session/

# Doit retourner :
{
  "user_id": 1,
  "username": "pharmacie1",
  "role": "pharmacien",
  "id_pharmacie": 1,
  "nom": "Pharmacie Test",
  "email": "test@example.com",
  "has_location": false
}
```

### 2. Vérifier l'Authentification pour Location Update

```bash
# Après inscription, appeler :
POST /api/location/update/
{
  "latitude": 18.0735,
  "longitude": -15.9582
}

# Doit retourner 200 OK (pas 403) :
{
  "message": "Localisation enregistrée avec succès",
  "localisation": "18.0735,-15.9582"
}
```

## ⚠️ Action Requise

**REDÉMARRER le serveur Django** pour que les modifications prennent effet :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer :
cd backend
python manage.py runserver
```

## 📝 Résultat Attendu

Après ces corrections :

1. ✅ Inscription → Session Django créée automatiquement
2. ✅ `request.user.is_authenticated == True` après inscription
3. ✅ `request.user.role == "pharmacien"` après inscription
4. ✅ `/api/location/update/` accepte la requête (200 OK)
5. ✅ Plus aucun 403 Forbidden













