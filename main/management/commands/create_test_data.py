from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from main.models import Building, Expense
from datetime import date, timedelta
from decimal import Decimal
import random


class Command(BaseCommand):
    help = "Test ma'lumotlarini yaratish"

    def handle(self, *args, **options):
        self.stdout.write("Test ma'lumotlarini yaratish boshlandi...\n")
        
        # 1. Rollarni yaratish
        admin_group, _ = Group.objects.get_or_create(name='Admin')
        accountant_group, _ = Group.objects.get_or_create(name='Accountant')
        viewer_group, _ = Group.objects.get_or_create(name='Viewer')
        self.stdout.write(self.style.SUCCESS("Rollar yaratildi"))
        
        # 2. Foydalanuvchilarni yaratish
        users_data = [
            {'username': 'ceoadmin', 'email': 'ceo@company.uz', 'first_name': 'CEO', 'last_name': 'Admin', 'group': admin_group},
            {'username': 'buxgalter1', 'email': 'buxgalter1@company.uz', 'first_name': 'Aziz', 'last_name': 'Karimov', 'group': accountant_group},
            {'username': 'buxgalter2', 'email': 'buxgalter2@company.uz', 'first_name': 'Malika', 'last_name': 'Rahimova', 'group': accountant_group},
            {'username': 'nazoratchi', 'email': 'nazoratchi@company.uz', 'first_name': 'Sardor', 'last_name': 'Umarov', 'group': viewer_group},
        ]
        
        created_users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                }
            )
            if created:
                user.set_password('test12345')
                user.save()
                user.groups.add(user_data['group'])
                self.stdout.write(f"  - {user.username} yaratildi (parol: test12345)")
            else:
                self.stdout.write(f"  - {user.username} allaqachon mavjud")
            created_users.append(user)
        
        self.stdout.write(self.style.SUCCESS("Foydalanuvchilar yaratildi"))
        
        # 3. Binolarni yaratish
        buildings_data = [
            {
                'name': 'Toshkent City Mall',
                'status': 'started',
                'budget': Decimal('50000000000'),
                'spent_amount': Decimal('25000000000'),
                'start_date': date(2024, 3, 15),
                'end_date': date(2026, 12, 31),
                'description': '10 qavatli zamonaviy savdo markazi'
            },
            {
                'name': 'Yunusobod Turar-joy Majmuasi',
                'status': 'started',
                'budget': Decimal('35000000000'),
                'spent_amount': Decimal('18000000000'),
                'start_date': date(2024, 6, 1),
                'end_date': date(2026, 6, 30),
                'description': '5 ta 16 qavatli turar-joy binosi'
            },
            {
                'name': 'Chilonzor Business Center',
                'status': 'new',
                'budget': Decimal('28000000000'),
                'spent_amount': Decimal('0'),
                'start_date': date(2026, 2, 1),
                'end_date': date(2028, 2, 1),
                'description': '12 qavatli biznes markaz'
            },
            {
                'name': 'Sergeli Maktab',
                'status': 'finished',
                'budget': Decimal('8000000000'),
                'spent_amount': Decimal('7800000000'),
                'start_date': date(2023, 4, 1),
                'end_date': date(2024, 9, 1),
                'description': '3 qavatli zamonaviy maktab binosi'
            },
            {
                'name': 'Mirzo Ulugbek Metro Yaqinidagi Ofis',
                'status': 'started',
                'budget': Decimal('15000000000'),
                'spent_amount': Decimal('9500000000'),
                'start_date': date(2024, 9, 15),
                'end_date': date(2025, 12, 31),
                'description': '8 qavatli ofis binosi'
            },
        ]
        
        created_buildings = []
        for building_data in buildings_data:
            building, created = Building.objects.get_or_create(
                name=building_data['name'],
                defaults=building_data
            )
            if created:
                self.stdout.write(f"  - {building.name} yaratildi")
            else:
                self.stdout.write(f"  - {building.name} allaqachon mavjud")
            created_buildings.append(building)
        
        self.stdout.write(self.style.SUCCESS("Binolar yaratildi"))
        
        # 4. Chiqimlarni yaratish
        expense_templates = [
            ('Sement sotib olish', 'material'),
            ("G'isht yetkazib berish", 'material'),
            ('Armattura xaridi', 'material'),
            ('Qum va shag\'al', 'material'),
            ('Ishchilar ish haqi', 'labor'),
            ('Muhandislar maoshi', 'labor'),
            ('Prarpab maoshi', 'labor'),
            ('Yuk mashinasi ijarasi', 'transport'),
            ('Kran xizmati', 'equipment'),
            ('Beton aralashtirgich ijarasi', 'equipment'),
            ('Elektr jihozlari', 'equipment'),
            ('Suv ta\'minoti ishlari', 'other'),
            ('Elektr montaj ishlari', 'other'),
            ('Loyihalash xizmati', 'other'),
        ]
        
        # Oxirgi 90 kun uchun chiqimlar
        today = date.today()
        expenses_created = 0
        
        for building in created_buildings:
            if building.status == 'new':
                continue  # Yangi binolarda chiqim yo'q
            
            num_expenses = random.randint(15, 30)
            for _ in range(num_expenses):
                template = random.choice(expense_templates)
                expense_date = today - timedelta(days=random.randint(1, 90))
                amount = Decimal(random.randint(5, 500)) * Decimal('1000000')
                user = random.choice(created_users[:3])  # Admin va Accountantlar
                
                Expense.objects.create(
                    building=building,
                    category=template[1],
                    description=template[0],
                    amount=amount,
                    date=expense_date,
                    created_by=user
                )
                expenses_created += 1
        
        self.stdout.write(self.style.SUCCESS(f"{expenses_created} ta chiqim yaratildi"))
        
        # Yakuniy statistika
        self.stdout.write("\n" + "="*50)
        self.stdout.write(self.style.SUCCESS("TEST MA'LUMOTLARI MUVAFFAQIYATLI YARATILDI!"))
        self.stdout.write("="*50)
        self.stdout.write(f"\nFoydalanuvchilar: {User.objects.count()} ta")
        self.stdout.write(f"Binolar: {Building.objects.count()} ta")
        self.stdout.write(f"Chiqimlar: {Expense.objects.count()} ta")
        self.stdout.write("\n" + "-"*50)
        self.stdout.write("Login ma'lumotlari:")
        self.stdout.write("  ceoadmin / test12345 (CEO Admin)")
        self.stdout.write("  buxgalter1 / test12345 (Accountant)")
        self.stdout.write("  buxgalter2 / test12345 (Accountant)")
        self.stdout.write("  nazoratchi / test12345 (Viewer)")
        self.stdout.write("-"*50 + "\n")
