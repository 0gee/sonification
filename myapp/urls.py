# myapp/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),  # Root URL of the app
    path('update_portfolio/', views.update_portfolio, name='update_portfolio'),
    path('update_sensitivity/', views.update_sensitivity, name='update_sensitivity'),
    path('delete_crypto/', views.delete_crypto, name='delete_crypto'),
]
