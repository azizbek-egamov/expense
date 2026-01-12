from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Faqat Admin foydalanuvchilar uchun ruxsat
    
    Bu permission faqat Admin guruhiga tegishli foydalanuvchilarga 
    barcha amalllarni bajarishga ruxsat beradi.
    """
    message = "Bu amal faqat Admin uchun ruxsat etilgan."
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='Admin').exists() or request.user.is_superuser


class IsAdminOrAccountant(permissions.BasePermission):
    """
    Admin yoki Accountant foydalanuvchilar uchun ruxsat
    
    Bu permission Admin va Accountant guruhlariga tegishli 
    foydalanuvchilarga yozish amallarini bajarishga ruxsat beradi.
    """
    message = "Bu amal faqat Admin yoki Accountant uchun ruxsat etilgan."
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superuser har doim ruxsatga ega
        if request.user.is_superuser:
            return True
        
        return request.user.groups.filter(name__in=['Admin', 'Accountant']).exists()


class IsAdminOrAccountantOrReadOnly(permissions.BasePermission):
    """
    Admin va Accountant yozishi mumkin, Viewer faqat o'qiy oladi
    
    Bu permission GET, HEAD, OPTIONS so'rovlarini barcha autentifikatsiya qilingan 
    foydalanuvchilarga ruxsat beradi. Boshqa so'rovlar faqat Admin va Accountant uchun.
    """
    message = "O'zgartirish faqat Admin yoki Accountant uchun ruxsat etilgan."
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # O'qish amallari barcha autentifikatsiya qilingan foydalanuvchilar uchun
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Superuser har doim ruxsatga ega
        if request.user.is_superuser:
            return True
        
        # Yozish amallari faqat Admin va Accountant uchun
        return request.user.groups.filter(name__in=['Admin', 'Accountant']).exists()


class CanManageUsers(permissions.BasePermission):
    """
    Foydalanuvchilarni boshqarish uchun ruxsat
    
    Faqat asosiy admin (ceoadmin) foydalanuvchilar bo'limiga kira oladi.
    Boshqa foydalanuvchilar umuman bu bo'limga kira olmaydi.
    """
    message = "Foydalanuvchilar bo'limi faqat asosiy admin (ceoadmin) uchun ruxsat etilgan."
    
    # Asosiy admin username
    CEO_ADMIN_USERNAME = 'ceoadmin'
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Faqat ceoadmin barcha amallarga ruxsatga ega
        return request.user.username == self.CEO_ADMIN_USERNAME
