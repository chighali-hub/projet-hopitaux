from django.shortcuts import render

# Create your views here.
from django.contrib.auth import get_user_model
from rest_framework import viewsets
from .models import *
from .serializers import *

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class PharmacieViewSet(viewsets.ModelViewSet):
    queryset = Pharmacie.objects.all()
    serializer_class = PharmacieSerializer


class MedicamentViewSet(viewsets.ModelViewSet):
    queryset = Medicament.objects.all()
    serializer_class = MedicamentSerializer


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class CommandeViewSet(viewsets.ModelViewSet):
    queryset = Commande.objects.all()
    serializer_class = CommandeSerializer

## Registration View

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created"}, status=201)
        return Response(serializer.errors, status=400)
