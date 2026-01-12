from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from main.models import Building, Asset, Expense


class Command(BaseCommand):
    help = "Foydalanuvchi rollari va ruxsatlarini sozlash"

    def handle(self, *args, **options):
        # Rollarni yaratish
        admin_group, created = Group.objects.get_or_create(name='Admin')
        if created:
            self.stdout.write(self.style.SUCCESS("Admin guruhi yaratildi"))
        
        accountant_group, created = Group.objects.get_or_create(name='Accountant')
        if created:
            self.stdout.write(self.style.SUCCESS("Accountant guruhi yaratildi"))
        
        viewer_group, created = Group.objects.get_or_create(name='Viewer')
        if created:
            self.stdout.write(self.style.SUCCESS("Viewer guruhi yaratildi"))
        
        # Content type larni olish
        building_ct = ContentType.objects.get_for_model(Building)
        asset_ct = ContentType.objects.get_for_model(Asset)
        expense_ct = ContentType.objects.get_for_model(Expense)
        
        # Barcha model ruxsatlarini olish
        building_perms = Permission.objects.filter(content_type=building_ct)
        asset_perms = Permission.objects.filter(content_type=asset_ct)
        expense_perms = Permission.objects.filter(content_type=expense_ct)
        
        # Admin - barcha ruxsatlar
        admin_group.permissions.set(
            list(building_perms) + list(asset_perms) + list(expense_perms)
        )
        self.stdout.write(self.style.SUCCESS("Admin ruxsatlari sozlandi"))
        
        # Accountant - ko'rish va o'zgartirish (o'chirish yo'q)
        accountant_perms = []
        for perm in list(building_perms) + list(asset_perms) + list(expense_perms):
            if 'view' in perm.codename or 'add' in perm.codename or 'change' in perm.codename:
                accountant_perms.append(perm)
        accountant_group.permissions.set(accountant_perms)
        self.stdout.write(self.style.SUCCESS("Accountant ruxsatlari sozlandi"))
        
        # Viewer - faqat ko'rish
        viewer_perms = []
        for perm in list(building_perms) + list(asset_perms) + list(expense_perms):
            if 'view' in perm.codename:
                viewer_perms.append(perm)
        viewer_group.permissions.set(viewer_perms)
        self.stdout.write(self.style.SUCCESS("Viewer ruxsatlari sozlandi"))
        
        self.stdout.write(self.style.SUCCESS("\nBarcha rollar muvaffaqiyatli sozlandi!"))
