from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Building(models.Model):
    """
    Bino modeli - qurilish ob'ektlari
    
    Bu model qurilish kompaniyasining binolari haqidagi ma'lumotlarni saqlaydi.
    """
    
    class Status(models.TextChoices):
        NEW = 'new', 'Yangi'
        STARTED = 'started', 'Qurilish boshlangan'
        FINISHED = 'finished', 'Tugatildi'
    
    name = models.CharField(
        max_length=255, 
        verbose_name="Bino nomi",
        help_text="Qurilish ob'ektining nomi"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
        verbose_name="Qurilish holati",
        help_text="Binoning joriy holati: Yangi, Qurilish boshlangan yoki Tugatildi"
    )
    budget = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        default=0,
        verbose_name="Ajratilgan mablag'",
        help_text="Binoga ajratilgan umumiy mablag' (so'm)"
    )
    spent_amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        default=0,
        verbose_name="Sarflangan mablag'",
        help_text="Hozirga qadar sarflangan mablag' (so'm)"
    )
    start_date = models.DateField(
        null=True, 
        blank=True,
        verbose_name="Qurilish boshlangan sana",
        help_text="Qurilish ishlari boshlangan sana"
    )
    end_date = models.DateField(
        null=True, 
        blank=True,
        verbose_name="Taxminiy tugash sanasi",
        help_text="Qurilish ishlarining taxminiy tugash sanasi"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Tavsif",
        help_text="Bino haqida qo'shimcha ma'lumot"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Yaratilgan vaqt"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Yangilangan vaqt"
    )
    
    class Meta:
        verbose_name = "Bino"
        verbose_name_plural = "Binolar"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def remaining_budget(self):
        """Qolgan mablag'ni hisoblash"""
        return self.budget - self.spent_amount


class ExpenseCategory(models.Model):
    """
    Chiqim kategoriyasi modeli
    
    Dinamik kategoriyalarni boshqarish uchun model.
    """
    name = models.CharField(
        max_length=100,
        verbose_name="Kategoriya nomi",
        help_text="Kategoriya nomi (masalan: Materiallar, Ish haqi)"
    )
    slug = models.SlugField(
        max_length=50,
        unique=True,
        verbose_name="Slug",
        help_text="URL-friendly identifikator (masalan: material, labor)"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Icon nomi",
        help_text="Lucide icon nomi (masalan: Package, Users)"
    )
    color = models.CharField(
        max_length=100,
        blank=True,
        default="text-slate-400 bg-slate-500/20 border-slate-500/30",
        verbose_name="Rang klassi",
        help_text="Tailwind CSS rang klasslari"
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Tartib",
        help_text="Ko'rsatish tartibi (kichik raqam birinchi)"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Faolmi",
        help_text="Kategoriya faol holatda (tanlash uchun ko'rinadi)"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Yaratilgan vaqt"
    )
    
    class Meta:
        verbose_name = "Chiqim kategoriyasi"
        verbose_name_plural = "Chiqim kategoriyalari"
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class Expense(models.Model):
    """
    Chiqim modeli - xarajatlar
    
    Bu model binolar bo'yicha xarajatlarni kuzatish uchun ishlatiladi.
    """
    
    # Eski TextChoices - faqat data migration uchun, keyinchalik o'chiriladi
    class LegacyCategory(models.TextChoices):
        MATERIAL = 'material', 'Material'
        LABOR = 'labor', 'Ish haqi'
        TRANSPORT = 'transport', 'Transport'
        EQUIPMENT = 'equipment', 'Uskuna'
        OTHER = 'other', 'Boshqa'
    
    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name='expenses',
        verbose_name="Bino",
        help_text="Chiqim qaysi binoga tegishli"
    )
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.PROTECT,
        related_name='expenses',
        verbose_name="Kategoriya",
        help_text="Chiqim turi",
        null=True,  # Vaqtincha null - migration uchun
        blank=True
    )
    # Eski kategoriya maydoni - migration uchun
    legacy_category = models.CharField(
        max_length=20,
        choices=LegacyCategory.choices,
        default=LegacyCategory.OTHER,
        verbose_name="Eski kategoriya",
        help_text="Eski kategoriya (migration uchun)",
        blank=True
    )
    description = models.CharField(
        max_length=500,
        verbose_name="Tavsif",
        help_text="Chiqim haqida qisqacha ma'lumot"
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name="Summa",
        help_text="Chiqim summasi (so'm)"
    )
    date = models.DateField(
        verbose_name="Sana",
        help_text="Chiqim amalga oshirilgan sana",
        default=timezone.now
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='expenses',
        verbose_name="Kim tomonidan",
        help_text="Chiqimni kim qo'shgan"
    )
    image = models.ImageField(
        upload_to='expenses/', 
        null=True, 
        blank=True, 
        verbose_name="Rasm"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Yaratilgan vaqt"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Yangilangan vaqt"
    )
    
    class Meta:
        verbose_name = "Chiqim"
        verbose_name_plural = "Chiqimlar"
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.description} - {self.amount} so'm"
