from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import *

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register('pharmacies', PharmacieViewSet)
router.register('medicaments', MedicamentViewSet)
router.register('stocks', StockViewSet)
router.register('clients', ClientViewSet)
router.register('commandes', CommandeViewSet)

urlpatterns = router.urls + [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('register/pharmacy/', PharmacyRegisterView.as_view(), name='register-pharmacy'),
    path('register/client/', ClientRegisterView.as_view(), name='register-client'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('session/', SessionView.as_view(), name='session'),
    
    # Location endpoint
    path('location/update/', LocationUpdateView.as_view(), name='location-update'),
]
