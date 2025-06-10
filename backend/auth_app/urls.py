# authapp/urls.py

from django.urls import path
from .views import RegisterView, LoginView, MeView, PlanificationListView, DocumentUploadView, PlanificationDetailView, ControleurListView, PlanningListView, DocumentListView, DocumentDownloadView, SummaryReportDownloadView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', MeView.as_view(), name='me'),
    path('planifications/', PlanificationListView.as_view(), name='planifications'),
    path('upload-documents/', DocumentUploadView.as_view(), name='upload-documents'),
    path('planifications/<int:pk>/', PlanificationDetailView.as_view(), name='planification-detail'),
    path('calendar/', ControleurListView.as_view(), name='controleur-list'),
    path('calendar/<int:controleur_id>/planning/', PlanningListView.as_view(), name='planning-list'),
    path('calendar/<int:controleur_id>/documents/', DocumentListView.as_view(), name='document-list'),
    path('documents/<int:document_id>/download/', DocumentDownloadView.as_view(), name='document-download'),
    path('summary-reports/<int:report_id>/download/', SummaryReportDownloadView.as_view(), name='summary-report-download'),
]

