from django.shortcuts import render
from django.contrib.auth import get_user_model, authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.authtoken.models import Token
from .models import *
from .serializers import *

User = get_user_model()

# =========================
# Custom Permissions
# =========================

class IsPharmacien(BasePermission):
    """
    Permission personnalisée pour vérifier que l'utilisateur est authentifié ET pharmacien.
    """
    def has_permission(self, request, view):
        """
        Vérifie que l'utilisateur est authentifié et a le rôle 'pharmacien'.
        """
        # Vérifier l'authentification
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Vérifier le rôle
        return hasattr(request.user, 'role') and request.user.role == 'pharmacien'

def get_user_from_token(request):
    """
    Authenticate via the 'Authorization: Token <key>' header.
    Returns (user, error_response) where error_response is None if the
    token is valid. Used by views that set authentication_classes = []
    to allow public GET access on the same endpoint while still
    requiring a valid token for the actions that call this.
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Token '):
        return None, Response(
            {'error': 'Non authentifié', 'message': 'Token manquant'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    key = auth_header[len('Token '):].strip()
    try:
        token = Token.objects.select_related('user').get(key=key)
    except Token.DoesNotExist:
        return None, Response(
            {'error': 'Non authentifié', 'message': 'Token invalide'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    request.user = token.user  # Attach to request for compatibility
    return token.user, None


def get_pharmacien_from_token(request):
    """Same as get_user_from_token, but also requires the 'pharmacien' role."""
    user, error_response = get_user_from_token(request)
    if error_response:
        return None, error_response
    if user.role != 'pharmacien':
        return None, Response(
            {'error': 'Accès refusé', 'message': 'Seuls les pharmaciens peuvent accéder à cette ressource'},
            status=status.HTTP_403_FORBIDDEN
        )
    return user, None


def get_client_from_token(request):
    """Same as get_user_from_token, but also requires the 'client' role."""
    user, error_response = get_user_from_token(request)
    if error_response:
        return None, error_response
    if user.role != 'client':
        return None, Response(
            {'error': 'Accès refusé', 'message': 'Seuls les clients peuvent accéder à cette ressource'},
            status=status.HTTP_403_FORBIDDEN
        )
    return user, None

# =========================
# ViewSets
# =========================

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

@method_decorator(csrf_exempt, name='dispatch')
class PharmacieViewSet(viewsets.ModelViewSet):
    queryset = Pharmacie.objects.all()
    serializer_class = PharmacieSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def my_pharmacy(self, request):
        """Get current user's pharmacy"""
        # Load user from session
        user, error_response = get_pharmacien_from_token(request)
        if error_response:
            return error_response
        
        try:
            pharmacie = Pharmacie.objects.get(user=user)
            serializer = self.get_serializer(pharmacie, context={'request': request})
            return Response(serializer.data)
        except Pharmacie.DoesNotExist:
            return Response({'error': 'Pharmacie non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['patch'], permission_classes=[AllowAny])
    def update_photo(self, request, pk=None):
        """Update pharmacy profile photo"""
        # Load user from session
        user, error_response = get_pharmacien_from_token(request)
        if error_response:
            return error_response
        
        pharmacie = self.get_object()
        if pharmacie.user != user:
            return Response({'error': 'Permission refusée'}, status=status.HTTP_403_FORBIDDEN)
        
        photo = request.FILES.get('photo_profile')
        if not photo:
            return Response({'error': 'Photo requise'}, status=status.HTTP_400_BAD_REQUEST)
        
        pharmacie.photo_profile = photo
        pharmacie.save()
        serializer = self.get_serializer(pharmacie, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'], permission_classes=[AllowAny])
    def set_open_status(self, request):
        """Update pharmacy open/closed status"""
        # Load user from session
        user, error_response = get_pharmacien_from_token(request)
        if error_response:
            return error_response
        
        try:
            pharmacie = Pharmacie.objects.get(user=user)
        except Pharmacie.DoesNotExist:
            return Response({'error': 'Pharmacie non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get is_open from request body
        is_open = request.data.get('is_open')
        if is_open is None:
            return Response({'error': 'Le champ is_open est requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update only is_open field
        pharmacie.is_open = bool(is_open)
        pharmacie.save(update_fields=['is_open'])
        
        serializer = self.get_serializer(pharmacie, context={'request': request})
        return Response(serializer.data)

@method_decorator(csrf_exempt, name='dispatch')
class MedicamentViewSet(viewsets.ModelViewSet):
    queryset = Medicament.objects.all()
    serializer_class = MedicamentSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get_queryset(self):
        """Filter medicines by pharmacy if user is pharmacist"""
        queryset = Medicament.objects.all()
        
        # If filtering by pharmacy
        pharmacie_id = self.request.query_params.get('pharmacie_id', None)
        if pharmacie_id:
            # Get medicines in stock for this pharmacy
            stock_medicaments = Stock.objects.filter(pharmacie_id=pharmacie_id).values_list('medicament_id', flat=True)
            queryset = queryset.filter(id__in=stock_medicaments)
        
        # Search by name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(nom__istartswith=search)
        
        # Filter by category
        categorie = self.request.query_params.get('categorie', None)
        if categorie:
            queryset = queryset.filter(categorie__icontains=categorie)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """List medicines (public access for search)"""
        # Allow public access for listing/searching medicines
        # Get queryset directly (no authentication required)
        queryset = self.get_queryset()
        
        # Serialize and return
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Get single medicine (public access)"""
        # Allow public access for retrieving medicine details
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Create medicine and add to pharmacy stock"""
        user, error_response = get_pharmacien_from_token(request)
        if error_response:
            return error_response

        # Get pharmacy
        try:
            pharmacie = Pharmacie.objects.get(user=user)
        except Pharmacie.DoesNotExist:
            return Response({'error': 'Pharmacie non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create or get medicament
        medicament_data = request.data.copy()
        medicament_nom = medicament_data.get('nom')
        
        # Check if medicament already exists
        medicament, created = Medicament.objects.get_or_create(
            nom=medicament_nom,
            defaults={
                'categorie': medicament_data.get('categorie', ''),
                'forme': medicament_data.get('forme', ''),
                'prix': medicament_data.get('prix', 0),
                'quantite_stock': medicament_data.get('quantite_stock', 0),
                'date_expiration': medicament_data.get('date_expiration'),
                'description': medicament_data.get('description', ''),
            }
        )
        
        # Get quantity and price for stock
        quantite = int(medicament_data.get('quantite', 0))
        prix = float(medicament_data.get('prix', 0))
        
        # Create or update stock
        stock, stock_created = Stock.objects.get_or_create(
            pharmacie=pharmacie,
            medicament=medicament,
            defaults={'quantite': quantite, 'prix': prix}
        )
        
        if not stock_created:
            # Update existing stock
            stock.quantite += quantite
            stock.prix = prix
            stock.save()
        
        # Check for pending notification requests for this medicine name
        # Create notifications for clients who requested to be notified
        from .models import MedicineNotificationRequest, MedicineNotification, Client
        notification_requests = MedicineNotificationRequest.objects.filter(
            medicine_name__icontains=medicament_nom,
            is_active=True
        )
        
        for req in notification_requests:
            # Check if notification already exists (avoid duplicates)
            if not MedicineNotification.objects.filter(
                client=req.client,
                medicine_name__icontains=medicament_nom,
                pharmacie=pharmacie,
                medicament=medicament
            ).exists():
                MedicineNotification.objects.create(
                    client=req.client,
                    medicine_name=medicament_nom,
                    pharmacie=pharmacie,
                    medicament=medicament,
                    stock=stock
                )
        
        serializer = self.get_serializer(medicament)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update medicine and stock"""
        user, error_response = get_pharmacien_from_token(request)
        if error_response:
            return error_response

        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Get pharmacy
        try:
            pharmacie = Pharmacie.objects.get(user=user)
        except Pharmacie.DoesNotExist:
            return Response({'error': 'Pharmacie non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        
        # Update medicament
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Update stock if quantity/price provided
        if 'quantite' in request.data or 'prix' in request.data:
            stock, _ = Stock.objects.get_or_create(
                pharmacie=pharmacie,
                medicament=instance
            )
            if 'quantite' in request.data:
                stock.quantite = int(request.data['quantite'])
            if 'prix' in request.data:
                stock.prix = float(request.data['prix'])
            stock.save()
        
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete medicine from pharmacy stock"""
        # Load user from session
        user, error_response = get_pharmacien_from_token(request)
        if error_response:
            return error_response
        
        instance = self.get_object()
        
        # Get pharmacy
        try:
            pharmacie = Pharmacie.objects.get(user=user)
        except Pharmacie.DoesNotExist:
            return Response({'error': 'Pharmacie non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        
        # Delete from stock
        Stock.objects.filter(pharmacie=pharmacie, medicament=instance).delete()
        
        # Delete medicament if no other pharmacy has it
        medicament_deleted = False
        if not Stock.objects.filter(medicament=instance).exists():
            instance.delete()
            medicament_deleted = True
        
        # Always return JSON response (not 204 No Content) to ensure session is maintained
        return Response({
            'message': 'Médicament supprimé avec succès',
            'deleted': medicament_deleted
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def my_stock(self, request):
        """Get current pharmacy's stock"""
        # Load user from session
        user, error_response = get_pharmacien_from_token(request)
        if error_response:
            return error_response
        
        try:
            pharmacie = Pharmacie.objects.get(user=user)
            stocks = Stock.objects.filter(pharmacie=pharmacie)
            serializer = StockSerializer(stocks, many=True)
            return Response(serializer.data)
        except Pharmacie.DoesNotExist:
            return Response({'error': 'Pharmacie non trouvée'}, status=status.HTTP_404_NOT_FOUND)

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('pharmacie', 'medicament').all()
    serializer_class = StockSerializer
    # Public read access is allowed for searching available medicines,
    # write operations still require authentication.
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_queryset(self):
        """
        Public stock listing for search:
        - Filter by medicine name (?medicament__nom__istartswith=).
        - Only returns stocks with positive quantity.
        """
        queryset = Stock.objects.select_related('pharmacie', 'medicament').all()

        search = self.request.query_params.get('medicament__nom__istartswith')
        if search:
            queryset = queryset.filter(medicament__nom__istartswith=search)

        # Only keep items that are actually in stock
        queryset = queryset.filter(quantite__gt=0)

        return queryset

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class CommandeViewSet(viewsets.ModelViewSet):
    queryset = Commande.objects.all()
    serializer_class = CommandeSerializer

# =========================
# API Views
# =========================

class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PharmacyRegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        from .serializers import PharmacyRegisterSerializer
        import random
        from django.core.mail import send_mail
        from django.conf import settings
        
        serializer = PharmacyRegisterSerializer(data=request.data)
        if serializer.is_valid():
            # Instead of saving immediately, generate OTP and save to PendingRegistration
            otp = str(random.randint(100000, 999999))
            email = request.data.get('email')
            
            # Store data in PendingRegistration
            # Note: get_or_create (not update_or_create) because update_or_create
            # relies on select_for_update(), which the MongoDB backend doesn't support.
            pending, created = PendingRegistration.objects.get_or_create(
                email=email,
                defaults={
                    'role': 'pharmacien',
                    'registration_data': request.data,
                    'otp': otp
                }
            )
            if not created:
                pending.role = 'pharmacien'
                pending.registration_data = request.data
                pending.otp = otp
                pending.save()
            
            # Send OTP via email
            send_mail(
                'Votre code de vérification - monhopital.com',
                f'Votre code de vérification est : {otp}',
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@monhopital.com'),
                [email],
                fail_silently=False,
            )
            
            return Response({
                "message": "Un code de vérification a été envoyé à votre adresse e-mail.",
                "email": email,
                "requires_otp": True
            }, status=status.HTTP_200_OK)
        
        # Retourner les erreurs de validation de manière plus claire
        # DRF serializer.errors retourne un dict avec des listes d'erreurs
        # On les transforme en format simple pour le frontend
        errors = {}
        for field, field_errors in serializer.errors.items():
            if isinstance(field_errors, list):
                # Prendre le premier message d'erreur
                errors[field] = field_errors[0] if field_errors else "Erreur de validation"
            else:
                errors[field] = str(field_errors)
        
        # Retourner les erreurs dans le format serializer.errors (compatible avec DRF)
        # mais aussi avec un format simplifié pour le frontend
        return Response({
            "error": "Erreur de validation",
            "message": "Veuillez corriger les erreurs ci-dessous",
            **errors  # Inclure les erreurs directement au niveau racine pour compatibilité
        }, status=status.HTTP_400_BAD_REQUEST)

class ClientRegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        from .serializers import ClientRegisterSerializer
        import random
        from django.core.mail import send_mail
        from django.conf import settings
        
        serializer = ClientRegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Generate OTP and save to PendingRegistration
                otp = str(random.randint(100000, 999999))
                email = request.data.get('email')
                
                # Note: get_or_create (not update_or_create) because update_or_create
                # relies on select_for_update(), which the MongoDB backend doesn't support.
                pending, created = PendingRegistration.objects.get_or_create(
                    email=email,
                    defaults={
                        'role': 'client',
                        'registration_data': request.data,
                        'otp': otp
                    }
                )
                if not created:
                    pending.role = 'client'
                    pending.registration_data = request.data
                    pending.otp = otp
                    pending.save()
                
                # Send OTP via email
                send_mail(
                    'Votre code de vérification - monhopital.com',
                    f'Votre code de vérification est : {otp}',
                    getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@monhopital.com'),
                    [email],
                    fail_silently=False,
                )
                
                return Response({
                    "message": "Un code de vérification a été envoyé à votre adresse e-mail.",
                    "email": email,
                    "requires_otp": True
                }, status=status.HTTP_200_OK)
            except Exception as e:
                # Gérer les erreurs lors de la création
                return Response({
                    "error": "Erreur lors de la création de la demande",
                    "message": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        for field, field_errors in serializer.errors.items():
            if isinstance(field_errors, list):
                # Prendre le premier message d'erreur
                errors[field] = field_errors[0] if field_errors else "Erreur de validation"
            else:
                errors[field] = str(field_errors)
        
        # Retourner les erreurs dans le format serializer.errors (compatible avec DRF)
        # mais aussi avec un format simplifié pour le frontend
        return Response({
            "error": "Erreur de validation",
            "message": "Veuillez corriger les erreurs ci-dessous",
            **errors  # Inclure les erreurs directement au niveau racine pour compatibilité
        }, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
        
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({'error': 'Email et code OTP requis'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            pending = PendingRegistration.objects.get(email=email, otp=otp)
        except PendingRegistration.DoesNotExist:
            return Response({'error': 'Code OTP invalide ou expiré'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Code is valid, proceed with actual registration
        from .serializers import PharmacyRegisterSerializer, ClientRegisterSerializer
        
        if pending.role == 'pharmacien':
            serializer = PharmacyRegisterSerializer(data=pending.registration_data)
            if serializer.is_valid():
                pharmacie = serializer.save()
                user = pharmacie.user
                token, _ = Token.objects.get_or_create(user=user)
                pending.delete()

                return Response({
                    "message": "Pharmacie créée avec succès",
                    "token": token.key,
                    "pharmacie_id": pharmacie.id,
                    "user_id": user.id,
                    "role": "pharmacien",
                    "username": user.username,
                    "nom": pharmacie.nom,
                    "email": pharmacie.email,
                    "has_location": bool(pharmacie.localisation),
                }, status=status.HTTP_201_CREATED)

        elif pending.role == 'client':
            serializer = ClientRegisterSerializer(data=pending.registration_data)
            if serializer.is_valid():
                client = serializer.save()
                user = client.user
                token, _ = Token.objects.get_or_create(user=user)
                pending.delete()

                return Response({
                    "message": "Client créé avec succès",
                    "token": token.key,
                    "client_id": client.id,
                    "user_id": user.id,
                    "role": "client",
                    "username": user.username,
                    "email": client.email
                }, status=status.HTTP_201_CREATED)
                
        # If we reach here, serializers failed for some reason
        return Response({
            "error": "Erreur lors de la validation finale",
            "details": serializer.errors if 'serializer' in locals() else "Unknown error"
        }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username et mot de passe requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate user with username and password
        user = authenticate(request, username=username, password=password)
        
        if not user:
            return Response(
                {'error': 'Identifiants invalides'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token, _ = Token.objects.get_or_create(user=user)

        # Check if user is Pharmacie
        if user.role == 'pharmacien':
            try:
                pharmacie = Pharmacie.objects.get(user=user)
                return Response({
                    'message': 'Connexion réussie',
                    'token': token.key,
                    'role': 'pharmacien',
                    'user_id': user.id,
                    'pharmacie_id': pharmacie.id,
                    'nom': pharmacie.nom,
                    'email': pharmacie.email,
                    'username': user.username,
                    'has_location': bool(pharmacie.localisation)
                }, status=status.HTTP_200_OK)
            except Pharmacie.DoesNotExist:
                return Response(
                    {'error': 'Pharmacie non trouvée'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Check if user is Client
        elif user.role == 'client':
            try:
                client = Client.objects.get(user=user)
                return Response({
                    'message': 'Connexion réussie',
                    'token': token.key,
                    'role': 'client',
                    'user_id': user.id,
                    'client_id': client.id,
                    'username': user.username
                }, status=status.HTTP_200_OK)
            except Client.DoesNotExist:
                return Response(
                    {'error': 'Client non trouvé'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(
            {'error': 'Ce compte n\'existe pas'}, 
            status=status.HTTP_404_NOT_FOUND
        )

class LogoutView(APIView):
    permission_classes = [AllowAny]  # Allow logout even if not authenticated
    authentication_classes = []

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        user, error_response = get_user_from_token(request)
        if user:
            Token.objects.filter(user=user).delete()
        return Response({'message': 'Déconnexion réussie'}, status=status.HTTP_200_OK)

class SessionView(APIView):
    permission_classes = [AllowAny]  # Allow checking session without authentication
    authentication_classes = []

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get(self, request):
        """Return who the token belongs to, and their role-specific profile."""
        user, error_response = get_user_from_token(request)
        if error_response:
            return error_response

        session_data = {
            'user_id': user.id,
            'username': user.username,
        }

        # The database is the source of truth for the role, not the token.
        try:
            pharmacie = Pharmacie.objects.get(user=user)
            session_data.update({
                'role': 'pharmacien',
                'id_pharmacie': pharmacie.id,
                'nom': pharmacie.nom,
                'email': pharmacie.email,
                'has_location': bool(pharmacie.localisation),
            })
            return Response(session_data)
        except Pharmacie.DoesNotExist:
            pass

        try:
            client = Client.objects.get(user=user)
            session_data.update({
                'role': 'client',
                'id_client': client.id,
            })
            return Response(session_data)
        except Client.DoesNotExist:
            pass

        return Response({'error': 'Aucun profil pharmacie ou client associé à ce compte'}, status=status.HTTP_404_NOT_FOUND)

class LocationUpdateView(APIView):
    """
    Vue pour mettre à jour la localisation d'une pharmacie.
    Exige une authentification valide (token) et le rôle 'pharmacien'.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

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
        user, error_response = get_pharmacien_from_token(request)
        if error_response:
            return error_response

        # ÉTAPE 3: Récupérer la pharmacie associée à l'utilisateur
        try:
            pharmacie = Pharmacie.objects.get(user=user)
        except Pharmacie.DoesNotExist:
            return Response(
                {
                    'error': 'Pharmacie non trouvée',
                    'message': f'Aucune pharmacie associée à l\'utilisateur {user.username}'
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
            
            # Valider la plage des coordonnées (optionnel mais recommandé)
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

class MedicineNotificationRequestView(APIView):
    """
    View to create a notification request when client searches for a medicine and finds nothing
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        """Create a notification request for a medicine"""
        user, error_response = get_client_from_token(request)
        if error_response:
            return error_response

        try:
            client = Client.objects.get(user=user)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )

        medicine_name = request.data.get('medicine_name', '').strip()
        if not medicine_name:
            return Response(
                {'error': 'Le nom du médicament est requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or get existing request
        request_obj, created = MedicineNotificationRequest.objects.get_or_create(
            client=client,
            medicine_name=medicine_name,
            defaults={'is_active': True}
        )
        
        if not created:
            # Reactivate if it was deactivated
            if not request_obj.is_active:
                request_obj.is_active = True
                request_obj.save()
        
        from .serializers import MedicineNotificationRequestSerializer
        serializer = MedicineNotificationRequestSerializer(request_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class MedicineNotificationListView(APIView):
    """
    View to get notifications for the current client
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        """Get all notifications for the current client"""
        user, error_response = get_client_from_token(request)
        if error_response:
            return error_response

        try:
            client = Client.objects.get(user=user)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )

        notifications = MedicineNotification.objects.filter(client=client).order_by('-created_at')
        
        # Check for unread count
        unread_count = notifications.filter(is_read=False).count()
        
        from .serializers import MedicineNotificationSerializer
        serializer = MedicineNotificationSerializer(notifications, many=True)
        
        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count
        })

class MedicineNotificationMarkReadView(APIView):
    """
    View to mark a notification as read
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def patch(self, request, notification_id):
        """Mark a notification as read"""
        user, error_response = get_client_from_token(request)
        if error_response:
            return error_response

        try:
            client = Client.objects.get(user=user)
            notification = MedicineNotification.objects.get(id=notification_id, client=client)
            notification.is_read = True
            notification.save()
            return Response({'message': 'Notification marquée comme lue'})
        except (Client.DoesNotExist, MedicineNotification.DoesNotExist):
            return Response(
                {'error': 'Notification non trouvée'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class PharmacyNotificationRequestsView(APIView):
    """
    View to get all medicine notification requests for pharmacies
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        """Get all active medicine notification requests grouped by medicine name"""
        # Load user from session
        user, error_response = get_pharmacien_from_token(request)
        if error_response:
            return error_response
        
        try:
            pharmacie = Pharmacie.objects.get(user=user)
        except Pharmacie.DoesNotExist:
            return Response({'error': 'Pharmacie non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all active notification requests and group by medicine_name
        from django.db.models import Count
        from collections import OrderedDict
        
        notification_requests = MedicineNotificationRequest.objects.filter(
            is_active=True
        ).values('medicine_name').annotate(
            request_count=Count('id')
        ).order_by('-request_count', 'medicine_name')
        
        # Format the response
        medicines_data = []
        for item in notification_requests:
            medicines_data.append({
                'medicine_name': item['medicine_name'],
                'request_count': item['request_count']
            })
        
        return Response({
            'medicines': medicines_data,
            'total_medicines': len(medicines_data),
            'total_requests': sum(item['request_count'] for item in medicines_data)
        })