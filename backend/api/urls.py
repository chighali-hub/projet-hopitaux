from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register('pharmacies', PharmacieViewSet)
router.register('medicaments', MedicamentViewSet)
router.register('stocks', StockViewSet)
router.register('clients', ClientViewSet)
router.register('commandes', CommandeViewSet)

urlpatterns = router.urls

