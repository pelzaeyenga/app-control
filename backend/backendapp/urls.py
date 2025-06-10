# backendapp/urls.py

from django.contrib import admin
from django.urls import path, include
from auth_app.views import PlanificationListView, PlanificationDetailView, DocumentUploadView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('auth_app.urls')), 
     path('planifications/', PlanificationListView.as_view(), name='direct-planifications'),
   
]
