from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, BuildingViewSet, ExpenseViewSet,
    DashboardStatisticsView, BuildingComparisonView, 
    MonthlyReportView, WeeklyReportView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'buildings', BuildingViewSet, basename='building')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
    
    # Statistika endpointlari
    path('statistics/dashboard/', DashboardStatisticsView.as_view(), name='dashboard-statistics'),
    path('statistics/buildings/', BuildingComparisonView.as_view(), name='building-comparison'),
    path('statistics/monthly/', MonthlyReportView.as_view(), name='monthly-report'),
    path('statistics/weekly/', WeeklyReportView.as_view(), name='weekly-report'),
]
