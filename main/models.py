from django.db import models
from django.contrib.auth.models import User


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


class Expense(models.Model):
    """
    Chiqim modeli - xarajatlar
    
    Bu model binolar bo'yicha xarajatlarni kuzatish uchun ishlatiladi.
    """
    
    class Category(models.TextChoices):
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
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
        verbose_name="Kategoriya",
        help_text="Chiqim turi"
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
        help_text="Chiqim amalga oshirilgan sana"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='expenses',
        verbose_name="Kim tomonidan",
        help_text="Chiqimni kim qo'shgan"
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
