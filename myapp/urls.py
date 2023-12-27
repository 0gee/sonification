# myapp/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),  # Root URL of the app
    path('update_portfolio/', views.update_portfolio, name='update_portfolio'),

]
