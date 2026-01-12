from django.contrib import admin
from django.utils.html import mark_safe
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin, GroupAdmin as BaseGroupAdmin
from .models import Building, Expense


# User va Group ni qayta ro'yxatdan o'tkazish
admin.site.unregister(User)
admin.site.unregister(Group)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'get_role', 'is_active', 'date_joined']
    list_filter = ['is_active', 'groups', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    def get_role(self, obj):
        groups = obj.groups.all()
        if groups.exists():
            return ', '.join([g.name for g in groups])
        return '-'
    get_role.short_description = 'Rol'


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin):
    list_display = ['name', 'get_users_count', 'get_permissions_count']
    search_fields = ['name']
    
    def get_users_count(self, obj):
        return obj.user_set.count()
    get_users_count.short_description = 'Foydalanuvchilar soni'
    
    def get_permissions_count(self, obj):
        return obj.permissions.count()
    get_permissions_count.short_description = 'Ruxsatlar soni'


def format_currency(value):
    """Decimal/float qiymatini formatlash"""
    try:
        return "{:,.0f}".format(float(value))
    except:
        return str(value)


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'name', 'colored_status', 'formatted_budget', 
        'formatted_spent', 'formatted_remaining', 'start_date', 
        'end_date', 'expenses_count', 'created_at'
    ]
    list_filter = ['status', 'start_date', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 25
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ("Asosiy ma'lumotlar", {
            'fields': ('name', 'status', 'description')
        }),
        ("Moliyaviy ma'lumotlar", {
            'fields': ('budget', 'spent_amount')
        }),
        ('Sanalar', {
            'fields': ('start_date', 'end_date', 'created_at', 'updated_at')
        }),
    )
    
    def colored_status(self, obj):
        colors = {
            'new': '#3498db',
            'started': '#f39c12',
            'finished': '#27ae60'
        }
        color = colors.get(obj.status, '#95a5a6')
        status_text = obj.get_status_display()
        return mark_safe(f'<span style="background-color: {color}; color: white; padding: 3px 10px; border-radius: 3px;">{status_text}</span>')
    colored_status.short_description = 'Holat'
    
    def formatted_budget(self, obj):
        amount = format_currency(obj.budget)
        return mark_safe(f"<b>{amount}</b> so'm")
    formatted_budget.short_description = "Ajratilgan mablag'"
    
    def formatted_spent(self, obj):
        amount = format_currency(obj.spent_amount)
        return f"{amount} so'm"
    formatted_spent.short_description = 'Sarflangan'
    
    def formatted_remaining(self, obj):
        remaining = obj.remaining_budget
        color = '#27ae60' if remaining > 0 else '#e74c3c'
        amount = format_currency(remaining)
        return mark_safe(f'<span style="color: {color};">{amount} so\'m</span>')
    formatted_remaining.short_description = 'Qolgan'
    
    def expenses_count(self, obj):
        count = obj.expenses.count()
        return mark_safe(f'<a href="/admin/main/expense/?building__id__exact={obj.id}">{count} ta</a>')
    expenses_count.short_description = 'Chiqimlar'


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'description', 'building_link', 'colored_category', 
        'formatted_amount', 'date', 'created_by', 'created_at'
    ]
    list_filter = ['category', 'building', 'date', 'created_by']
    search_fields = ['description', 'building__name']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    raw_id_fields = ['building']
    date_hierarchy = 'date'
    list_per_page = 25
    
    fieldsets = (
        ("Asosiy ma'lumotlar", {
            'fields': ('building', 'category', 'description')
        }),
        ("Moliyaviy ma'lumotlar", {
            'fields': ('amount', 'date')
        }),
        ("Tizim ma'lumotlari", {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )
    
    def building_link(self, obj):
        return mark_safe(f'<a href="/admin/main/building/{obj.building.id}/change/">{obj.building.name}</a>')
    building_link.short_description = 'Bino'
    
    def colored_category(self, obj):
        colors = {
            'material': '#3498db',
            'labor': '#9b59b6',
            'transport': '#1abc9c',
            'equipment': '#e67e22',
            'other': '#95a5a6'
        }
        color = colors.get(obj.category, '#95a5a6')
        cat_text = obj.get_category_display()
        return mark_safe(f'<span style="background-color: {color}; color: white; padding: 3px 10px; border-radius: 3px;">{cat_text}</span>')
    colored_category.short_description = 'Kategoriya'
    
    def formatted_amount(self, obj):
        amount = format_currency(obj.amount)
        return mark_safe(f"<b>{amount}</b> so'm")
    formatted_amount.short_description = 'Summa'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# Admin site sozlamalari
admin.site.site_header = "Qurilish Chiqimlari Boshqaruvi"
admin.site.site_title = "Chiqimlar Admin"
admin.site.index_title = "Bosh sahifa"
