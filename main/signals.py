from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from .models import Expense

@receiver(post_save, sender=Expense)
@receiver(post_delete, sender=Expense)
def update_building_spent_amount(sender, instance, **kwargs):
    """
    Chiqim qo'shilganda, o'zgartirilganda yoki o'chirilganda
    binoning sarflangan mablag'ini qayta hisoblash
    """
    building = instance.building
    # Barcha chiqimlar yig'indisini hisoblash
    total_expenses = building.expenses.aggregate(total=Sum('amount'))['total'] or 0
    
    # Binoga yozish
    building.spent_amount = total_expenses
    building.save()
