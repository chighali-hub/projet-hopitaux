# ✅ CORRECTION FINALE - Erreur 403 sur /api/location/update/

## 🔴 Problème Identifié

- GET `/api/session/` retourne 200 avec `is_authenticated = true`, `role = "pharmacien"`
- POST `/api/location/update/` retourne **403 Forbidden**
- Le frontend fonctionne correctement
- Les cookies et CORS sont correctement configurés

## ✅ Solution Appliquée

### 1. Vue LocationUpdateView - Code Final

**Fichier : `backend/api/views.py`**

```python
class LocationUpdateView(APIView):
    """
    Vue pour mettre à jour la localisation d'une pharmacie.
    Exige une authentification valide et le rôle 'pharmacien'.
    """
    permission_classes = [IsAuthenticated]  # Utiliser IsAuthenticated comme demandé
    
    def post(self, request):
        """
        Met à jour la localisation de la pharmacie de l'utilisateur connecté.
        
        Retourne:
        - 401 si l'utilisateur n'est pas authentifié
        - 403 si l'utilisateur n'est pas pharmacien
        - 404 si la pharmacie n'existe pas
        - 400 si les coordonnées sont invalides ou manquantes
        - 200 si la mise à jour réussit
        """
        # ÉTAPE 1: Vérifier que l'utilisateur est authentifié
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Non authentifié'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # ÉTAPE 2: Vérifier que l'utilisateur a le rôle 'pharmacien'
        if not hasattr(request.user, 'role') or request.user.role != 'pharmacien':
            return Response(
                {
                    'error': 'Accès refusé',
                    'message': 'Seuls les pharmaciens peuvent mettre à jour leur localisation'
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # ÉTAPE 3: Récupérer la pharmacie associée à l'utilisateur
        try:
            pharmacie = Pharmacie.objects.get(user=request.user)
        except Pharmacie.DoesNotExist:
            return Response(
                {
                    'error': 'Pharmacie non trouvée',
                    'message': f'Aucune pharmacie associée à l\'utilisateur {request.user.username}'
                }, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # ÉTAPE 4: Valider les données de localisation
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if latitude is None or longitude is None:
            return Response(
                {
                    'error': 'Données manquantes',
                    'message': 'Latitude et longitude sont requises'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ÉTAPE 5: Convertir et valider les coordonnées
        try:
            lat = float(latitude)
            lon = float(longitude)
            
            # Valider la plage des coordonnées
            if not (-90 <= lat <= 90):
                return Response(
                    {
                        'error': 'Coordonnées invalides',
                        'message': 'La latitude doit être entre -90 et 90'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not (-180 <= lon <= 180):
                return Response(
                    {
                        'error': 'Coordonnées invalides',
                        'message': 'La longitude doit être entre -180 et 180'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {
                    'error': 'Coordonnées invalides',
                    'message': 'Latitude et longitude doivent être des nombres valides'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ÉTAPE 6: Mettre à jour la localisation
        try:
            pharmacie.localisation = f"{lat},{lon}"
            pharmacie.save()
            
            # Mettre à jour la session pour refléter le changement
            request.session['has_location'] = True
            request.session.save()
            
            return Response({
                'message': 'Localisation enregistrée avec succès',
                'localisation': pharmacie.localisation,
                'latitude': lat,
                'longitude': lon,
                'pharmacie_id': pharmacie.id,
                'pharmacie_nom': pharmacie.nom
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Gérer toute autre erreur inattendue
            return Response(
                {
                    'error': 'Erreur lors de la mise à jour',
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

### 2. Points Critiques Vérifiés

✅ **Permission `IsAuthenticated`** : Utilisée comme demandé
✅ **Vérification explicite** : `request.user.is_authenticated` dans la méthode
✅ **Vérification du rôle** : `request.user.role == 'pharmacien'`
✅ **Récupération de la pharmacie** : `Pharmacie.objects.get(user=request.user)`
✅ **Codes de statut corrects** : 401, 403, 404, 400, 200, 500
✅ **Gestion d'erreurs complète** : Tous les cas d'erreur sont gérés
✅ **Validation des coordonnées** : Plage de valeurs vérifiée
✅ **Mise à jour de la session** : `has_location` mis à jour

### 3. Configuration Django Vérifiée

**Fichier : `backend/gestion_pharmacie/settings.py`**

✅ **SessionAuthentication** : Configuré dans `REST_FRAMEWORK`
✅ **CORS** : `CORS_ALLOW_CREDENTIALS = True`
✅ **Session** : `SESSION_COOKIE_SAMESITE = 'Lax'`
✅ **CSRF** : `CSRF_TRUSTED_ORIGINS` configuré

### 4. Middlewares Django Vérifiés

**Fichier : `backend/gestion_pharmacie/settings.py`**

✅ **SessionMiddleware** : Présent
✅ **AuthenticationMiddleware** : Présent
✅ **CorsMiddleware** : Présent et bien placé

## 🔍 Diagnostic du Problème 403

Si le 403 persiste après ces corrections, vérifier :

### 1. Vérifier que la session est bien attachée à la requête POST

Dans la console Django, ajouter un print dans `LocationUpdateView.post()` :

```python
def post(self, request):
    print(f"DEBUG: request.user = {request.user}")
    print(f"DEBUG: request.user.is_authenticated = {request.user.is_authenticated}")
    print(f"DEBUG: request.user.role = {getattr(request.user, 'role', 'N/A')}")
    print(f"DEBUG: request.session.session_key = {request.session.session_key}")
    # ... reste du code
```

### 2. Vérifier les cookies dans le navigateur

- Ouvrir Developer Tools → Application → Cookies
- Vérifier que `sessionid` est présent pour `localhost:8000`
- Vérifier que le cookie est envoyé avec la requête POST

### 3. Vérifier les headers de la requête

Dans Network tab, vérifier que :
- `Cookie: sessionid=...` est présent
- `Content-Type: application/json` est présent
- `credentials: include` est utilisé côté frontend

## 🚀 Action Requise

**REDÉMARRER le serveur Django** :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer :
cd backend
python manage.py runserver
```

## 📝 Résultat Attendu

Après redémarrage :

1. ✅ POST `/api/location/update/` retourne **200 OK** pour un pharmacien connecté
2. ✅ Plus d'erreur 403 Forbidden
3. ✅ La localisation est correctement enregistrée
4. ✅ La session `has_location` est mise à jour

## 🧪 Test de Vérification

```bash
# 1. S'inscrire comme pharmacien
POST /api/register/pharmacy/
{
  "nom": "Test Pharmacy",
  "username": "testpharma",
  "email": "test@example.com",
  "telephone": "123456789",
  "password": "test123"
}

# 2. Vérifier la session
GET /api/session/
# Doit retourner : role = "pharmacien", is_authenticated = true

# 3. Mettre à jour la localisation
POST /api/location/update/
{
  "latitude": 18.0735,
  "longitude": -15.9582
}
# Doit retourner 200 OK (pas 403)
```

## ⚠️ Si le Problème Persiste

1. Vérifier les logs Django pour voir les erreurs exactes
2. Vérifier que `request.user` est bien un objet User et non AnonymousUser
3. Vérifier que `request.user.role` est bien défini
4. Vérifier que la session est bien persistée entre les requêtes













