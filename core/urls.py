"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from drf_spectacular.utils import extend_schema


# JWT views uchun Swagger dokumentatsiyasi
class TokenObtainPairViewWithDocs(TokenObtainPairView):
    @extend_schema(
        summary="Token olish",
        description="""
        Username va parol yordamida JWT access va refresh tokenlarini olish.
        
        **So'rov:**
        - `username` - Foydalanuvchi nomi
        - `password` - Parol
        
        **Javob:**
        - `access` - Access token (15 daqiqa amal qiladi)
        - `refresh` - Refresh token (1 kun amal qiladi)
        """,
        tags=['Autentifikatsiya']
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class TokenRefreshViewWithDocs(TokenRefreshView):
    @extend_schema(
        summary="Tokenni yangilash",
        description="""
        Refresh token yordamida yangi access token olish.
        
        **So'rov:**
        - `refresh` - Refresh token
        
        **Javob:**
        - `access` - Yangi access token
        """,
        tags=['Autentifikatsiya']
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class TokenVerifyViewWithDocs(TokenVerifyView):
    @extend_schema(
        summary="Tokenni tekshirish",
        description="""
        Access yoki refresh token amal qilishini tekshirish.
        
        **So'rov:**
        - `token` - Tekshiriladigan token
        
        **Javob:**
        - Token to'g'ri bo'lsa - 200 OK
        - Token noto'g'ri bo'lsa - 401 Unauthorized
        """,
        tags=['Autentifikatsiya']
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    
    # JWT Autentifikatsiya
    path('api/token/', TokenObtainPairViewWithDocs.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshViewWithDocs.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyViewWithDocs.as_view(), name='token_verify'),
    
    # API endpoints
    path('api/', include('main.urls')),
    
    # Swagger / OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)