from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User, Group
from django.db.models import Sum, Count, Avg, Max, Min
from django.db.models.functions import TruncWeek, TruncMonth
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import Building, Expense, ExpenseCategory
from .serializers import (
    UserSerializer, UserCreateSerializer,
    BuildingListSerializer, BuildingDetailSerializer, BuildingCreateUpdateSerializer,
    ExpenseListSerializer, ExpenseDetailSerializer, ExpenseCreateUpdateSerializer,
    ExpenseStatisticsSerializer, ExpenseCategorySerializer
)
from .permissions import (
    IsAdmin, IsAdminOrAccountant, IsAdminOrAccountantOrReadOnly, 
    CanManageUsers
)


# CEO Admin username
CEO_ADMIN_USERNAME = 'ceoadmin'


@extend_schema_view(
    list=extend_schema(
        summary="Foydalanuvchilar ro'yxati",
        description="Tizimdagi barcha foydalanuvchilarni ko'rish. Faqat ceoadmin uchun.",
        tags=['Foydalanuvchilar']
    ),
    retrieve=extend_schema(
        summary="Foydalanuvchi tafsilotlari",
        description="Bitta foydalanuvchining to'liq ma'lumotlarini ko'rish.",
        tags=['Foydalanuvchilar']
    ),
    create=extend_schema(
        summary="Yangi foydalanuvchi yaratish",
        description="Yangi foydalanuvchi yaratish. Faqat ceoadmin uchun ruxsat etilgan.",
        tags=['Foydalanuvchilar'],
        request=UserCreateSerializer,
        examples=[
            OpenApiExample(
                'Yangi foydalanuvchi',
                value={
                    'username': 'yangi_user',
                    'email': 'user@example.com',
                    'password': 'kuchliparol123',
                    'password_confirm': 'kuchliparol123',
                    'first_name': 'Ism',
                    'last_name': 'Familiya',
                    'role': 'Accountant'
                }
            )
        ]
    ),
    update=extend_schema(
        summary="Foydalanuvchini yangilash",
        description="Foydalanuvchi ma'lumotlarini to'liq yangilash. Faqat ceoadmin uchun.",
        tags=['Foydalanuvchilar']
    ),
    partial_update=extend_schema(
        summary="Foydalanuvchini qisman yangilash",
        description="Foydalanuvchi ma'lumotlarini qisman yangilash. Faqat ceoadmin uchun.",
        tags=['Foydalanuvchilar']
    ),
    destroy=extend_schema(
        summary="Foydalanuvchini o'chirish",
        description="Foydalanuvchini tizimdan o'chirish. Faqat ceoadmin uchun ruxsat etilgan.",
        tags=['Foydalanuvchilar']
    )
)
class UserViewSet(viewsets.ModelViewSet):
    """
    Foydalanuvchilar bilan ishlash uchun API
    
    Bu API orqali foydalanuvchilarni ko'rish, yaratish, yangilash va o'chirish mumkin.
    Faqat ceoadmin uchun ruxsat etilgan.
    """
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [IsAuthenticated, CanManageUsers]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    @extend_schema(
        summary="Joriy foydalanuvchi",
        description="Hozirgi autentifikatsiya qilingan foydalanuvchi ma'lumotlarini olish.",
        tags=['Foydalanuvchilar']
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Joriy foydalanuvchi ma'lumotlarini olish"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="Kategoriyalar ro'yxati",
        description="Barcha chiqim kategoriyalarini ko'rish.",
        tags=['Kategoriyalar']
    ),
    retrieve=extend_schema(
        summary="Kategoriya tafsilotlari",
        description="Bitta kategoriyaning to'liq ma'lumotlarini ko'rish.",
        tags=['Kategoriyalar']
    ),
    create=extend_schema(
        summary="Yangi kategoriya qo'shish",
        description="Yangi chiqim kategoriyasini tizimga qo'shish.",
        tags=['Kategoriyalar']
    ),
    update=extend_schema(
        summary="Kategoriyani yangilash",
        description="Kategoriya ma'lumotlarini to'liq yangilash.",
        tags=['Kategoriyalar']
    ),
    partial_update=extend_schema(
        summary="Kategoriyani qisman yangilash",
        description="Kategoriya ma'lumotlarini qisman yangilash.",
        tags=['Kategoriyalar']
    ),
    destroy=extend_schema(
        summary="Kategoriyani o'chirish",
        description="Kategoriyani tizimdan o'chirish. Diqqat: Faqat foydalanilmagan kategoriyalarni o'chirish mumkin!",
        tags=['Kategoriyalar']
    )
)
class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    """
    Chiqim kategoriyalari bilan ishlash uchun API
    
    Kategoriyalarni boshqarish: ko'rish, qo'shish, tahrirlash, o'chirish.
    """
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated, IsAdminOrAccountantOrReadOnly]
    
    def get_queryset(self):
        queryset = ExpenseCategory.objects.all()
        
        # Faqat faol kategoriyalarni ko'rsatish (agar so'ralsa)
        active_only = self.request.query_params.get('active_only')
        if active_only and active_only.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        
        return queryset


@extend_schema_view(
    list=extend_schema(
        summary="Binolar ro'yxati",
        description="""
        Barcha binolarni ko'rish.
        
        **Filtrlash imkoniyatlari:**
        - `status`: Holat bo'yicha filtrlash (new, started, finished)
        - `search`: Nom bo'yicha qidirish
        """,
        tags=['Binolar'],
        parameters=[
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Holat bo'yicha filtrlash: new, started, finished",
                required=False
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Bino nomi bo'yicha qidirish",
                required=False
            )
        ]
    ),
    retrieve=extend_schema(
        summary="Bino tafsilotlari",
        description="Bitta binoning to'liq ma'lumotlarini ko'rish.",
        tags=['Binolar']
    ),
    create=extend_schema(
        summary="Yangi bino qo'shish",
        description="Yangi qurilish ob'ektini tizimga qo'shish. Admin va Accountant uchun ruxsat etilgan.",
        tags=['Binolar'],
        examples=[
            OpenApiExample(
                'Yangi bino',
                value={
                    'name': 'Toshkent City Tower',
                    'status': 'new',
                    'budget': 5000000000,
                    'start_date': '2024-01-15',
                    'end_date': '2025-06-30',
                    'description': '25 qavatli zamonaviy ofis binosi'
                }
            )
        ]
    ),
    update=extend_schema(
        summary="Binoni yangilash",
        description="Bino ma'lumotlarini to'liq yangilash.",
        tags=['Binolar']
    ),
    partial_update=extend_schema(
        summary="Binoni qisman yangilash",
        description="Bino ma'lumotlarini qisman yangilash (masalan, faqat mablag' yoki holat).",
        tags=['Binolar']
    ),
    destroy=extend_schema(
        summary="Binoni o'chirish",
        description="Binoni tizimdan o'chirish. Diqqat: Binoga tegishli barcha chiqimlar ham o'chiriladi!",
        tags=['Binolar']
    )
)
class BuildingViewSet(viewsets.ModelViewSet):
    """
    Binolar bilan ishlash uchun API
    
    Qurilish ob'ektlarini boshqarish: ko'rish, qo'shish, tahrirlash, o'chirish.
    """
    queryset = Building.objects.all()
    permission_classes = [IsAuthenticated, IsAdminOrAccountantOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BuildingListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return BuildingCreateUpdateSerializer
        return BuildingDetailSerializer
    
    def get_queryset(self):
        queryset = Building.objects.all()
        
        # Holat bo'yicha filtrlash
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Nom bo'yicha qidirish
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset
    
    @extend_schema(
        summary="Bino statistikasi",
        description="""
        Tanlangan bino bo'yicha chiqimlar statistikasi.
        
        **Filterlar:**
        - `date_from` - Boshlanish sanasi (YYYY-MM-DD)
        - `date_to` - Tugash sanasi (YYYY-MM-DD)
        - `category` - Kategoriya ID
        - `created_by` - Foydalanuvchi ID (faqat admin)
        """,
        tags=['Binolar'],
        parameters=[
            OpenApiParameter(name='date_from', type=str, description='Boshlanish sanasi (YYYY-MM-DD)'),
            OpenApiParameter(name='date_to', type=str, description='Tugash sanasi (YYYY-MM-DD)'),
            OpenApiParameter(name='category', type=int, description='Kategoriya ID'),
            OpenApiParameter(name='created_by', type=int, description='Foydalanuvchi ID (faqat admin)'),
        ]
    )
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Bino bo'yicha statistikani olish"""
        building = self.get_object()
        
        # Chiqimlar statistikasi
        expenses = building.expenses.all()
        
        # Filterlarni qo'llash
        date_from = request.query_params.get('date_from')
        if date_from:
            expenses = expenses.filter(date__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            expenses = expenses.filter(date__lte=date_to)
        
        category = request.query_params.get('category')
        if category:
            expenses = expenses.filter(category_id=category)
        
        created_by = request.query_params.get('created_by')
        if created_by and request.user.username == CEO_ADMIN_USERNAME:
            expenses = expenses.filter(created_by_id=created_by)
        
        # Umumiy statistikalar
        stats = expenses.aggregate(
            total=Sum('amount'),
            count=Count('id'),
            avg=Avg('amount'),
            max_amount=Max('amount')
        )
        total_expenses = stats['total'] or 0
        expenses_count = stats['count'] or 0
        avg_expense = stats['avg'] or 0
        max_expense = stats['max_amount'] or 0
        
        # Kategoriya bo'yicha
        by_category = {}
        for cat in ExpenseCategory.objects.all():
            amount = expenses.filter(category=cat).aggregate(total=Sum('amount'))['total'] or 0
            by_category[cat.name] = float(amount)
        
        # Top foydalanuvchilar (faqat admin uchun)
        top_users = []
        if request.user.username == CEO_ADMIN_USERNAME:
            top_users = list(
                expenses.values('created_by__username', 'created_by_id')
                .annotate(total=Sum('amount'), count=Count('id'))
                .order_by('-total')[:10]
            )
        
        # Kunlik chiqimlar (so'nggi 30 kun)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        daily_expenses = list(
            expenses.filter(date__gte=thirty_days_ago)
            .values('date')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('date')
        )
        
        # Oylik chiqimlar (so'nggi 12 oy)
        twelve_months_ago = timezone.now().date() - timedelta(days=365)
        monthly_expenses = list(
            expenses.filter(date__gte=twelve_months_ago)
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('month')
        )
        
        # Format monthly data
        monthly_data = []
        for item in monthly_expenses:
            if item['month']:
                monthly_data.append({
                    'month': item['month'].strftime('%Y-%m'),
                    'month_name': item['month'].strftime('%B %Y'),
                    'total': float(item['total'] or 0)
                })
        
        # So'nggi chiqimlar
        recent_expenses = list(
            expenses.select_related('category', 'created_by')
            .order_by('-date', '-created_at')[:10]
            .values(
                'id', 'description', 'amount', 'date',
                'category__name', 'category__icon', 'category__color',
                'created_by__username'
            )
        )
        
        # Format recent expenses
        formatted_recent = []
        for exp in recent_expenses:
            formatted_recent.append({
                'id': exp['id'],
                'description': exp['description'],
                'amount': float(exp['amount']),
                'date': exp['date'].isoformat() if exp['date'] else None,
                'category': exp['category__name'] or 'Boshqa',
                'category_icon': exp['category__icon'] or 'MoreHorizontal',
                'category_color': exp['category__color'] or 'text-slate-400 bg-slate-500/20 border-slate-500/30',
                'created_by': exp['created_by__username'] or 'Noma\'lum'
            })
        
        return Response({
            'building_name': building.name,
            'building_status': building.status,
            'building_description': building.description,
            'start_date': building.start_date.isoformat() if building.start_date else None,
            'budget': float(building.budget),
            'spent_amount': float(building.spent_amount),
            'remaining_budget': float(building.remaining_budget),
            'total_expenses': float(total_expenses),
            'expenses_count': expenses_count,
            'average_expense': float(avg_expense),
            'max_expense': float(max_expense),
            'expenses_by_category': by_category,
            'top_users': top_users,
            'daily_expenses': daily_expenses,
            'monthly_expenses': monthly_data,
            'recent_expenses': formatted_recent
        })


@extend_schema_view(
    list=extend_schema(
        summary="Chiqimlar ro'yxati",
        description="""
        Barcha chiqimlarni ko'rish.
        
        **Filtrlash imkoniyatlari:**
        - `building`: Bino ID si bo'yicha
        - `category`: Kategoriya ID si bo'yicha (/api/expense-categories/ dan oling)
        - `date_from`: Sanadan boshlab
        - `date_to`: Sanagacha
        - `created_by`: Foydalanuvchi ID si bo'yicha (faqat ceoadmin uchun)
        """,
        tags=['Chiqimlar'],
        parameters=[
            OpenApiParameter(
                name='building',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Bino ID si",
                required=False
            ),
            OpenApiParameter(
                name='category',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Kategoriya ID si (/api/expense-categories/ dan oling)",
                required=False
            ),
            OpenApiParameter(
                name='date_from',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description="Boshlang'ich sana (YYYY-MM-DD)",
                required=False
            ),
            OpenApiParameter(
                name='date_to',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description="Tugash sanasi (YYYY-MM-DD)",
                required=False
            ),
            OpenApiParameter(
                name='created_by',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Foydalanuvchi ID si bo'yicha filtrlash (faqat ceoadmin uchun)",
                required=False
            )
        ]
    ),
    retrieve=extend_schema(
        summary="Chiqim tafsilotlari",
        description="Bitta chiqimning to'liq ma'lumotlarini ko'rish.",
        tags=['Chiqimlar']
    ),
    create=extend_schema(
        summary="Yangi chiqim qo'shish",
        description="Yangi xarajatni tizimga qo'shish.",
        tags=['Chiqimlar'],
        examples=[
            OpenApiExample(
                'Yangi chiqim',
                value={
                    'building': 1,
                    'category': 1,
                    'description': 'Sement sotib olish',
                    'amount': 15000000,
                    'date': '2024-01-15'
                },
                description='category - kategoriya ID si (ixtiyoriy), date - sana (ixtiyoriy, default: bugun)'
            )
        ]
    ),
    update=extend_schema(
        summary="Chiqimni yangilash",
        description="Chiqim ma'lumotlarini to'liq yangilash.",
        tags=['Chiqimlar']
    ),
    partial_update=extend_schema(
        summary="Chiqimni qisman yangilash",
        description="Chiqim ma'lumotlarini qisman yangilash.",
        tags=['Chiqimlar']
    ),
    destroy=extend_schema(
        summary="Chiqimni o'chirish",
        description="Chiqimni tizimdan o'chirish.",
        tags=['Chiqimlar']
    )
)
class ExpenseViewSet(viewsets.ModelViewSet):
    """
    Chiqimlar bilan ishlash uchun API
    
    Xarajatlarni boshqarish: ko'rish, qo'shish, tahrirlash, o'chirish.
    """
    queryset = Expense.objects.all()
    permission_classes = [IsAuthenticated, IsAdminOrAccountantOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ExpenseListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ExpenseCreateUpdateSerializer
        return ExpenseDetailSerializer
    
    def get_queryset(self):
        queryset = Expense.objects.all()
        
        # ceoadmin barcha chiqimlarni ko'radi, boshqalar faqat o'ziniki
        if self.request.user.username != CEO_ADMIN_USERNAME:
            queryset = queryset.filter(created_by=self.request.user)
        
        # Bino bo'yicha filtrlash
        building = self.request.query_params.get('building')
        if building:
            queryset = queryset.filter(building_id=building)
        
        # Kategoriya bo'yicha
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Sana bo'yicha
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        # Foydalanuvchi bo'yicha filtrlash (faqat ceoadmin uchun)
        created_by = self.request.query_params.get('created_by')
        if created_by and self.request.user.username == CEO_ADMIN_USERNAME:
            queryset = queryset.filter(created_by_id=created_by)
        
        return queryset
    
    @extend_schema(
        summary="Chiqimlar statistikasi",
        description="""
        Umumiy chiqimlar statistikasini olish.
        
        **Filterlar:**
        - `date_from` - Boshlanish sanasi (YYYY-MM-DD)
        - `date_to` - Tugash sanasi (YYYY-MM-DD)
        - `building` - Bino ID
        - `category` - Kategoriya ID
        - `created_by` - Foydalanuvchi ID (faqat admin)
        
        **Ma'lumotlar:**
        - Umumiy chiqimlar summasi
        - Kategoriyalar bo'yicha taqsimot
        - Binolar bo'yicha taqsimot
        - Haftalik va oylik hisobotlar
        - Kunlik hisobot (so'nggi 30 kun)
        - Top foydalanuvchilar
        """,
        tags=['Chiqimlar'],
        parameters=[
            OpenApiParameter(name='date_from', type=str, description='Boshlanish sanasi (YYYY-MM-DD)'),
            OpenApiParameter(name='date_to', type=str, description='Tugash sanasi (YYYY-MM-DD)'),
            OpenApiParameter(name='building', type=int, description='Bino ID'),
            OpenApiParameter(name='category', type=int, description='Kategoriya ID'),
            OpenApiParameter(name='created_by', type=int, description='Foydalanuvchi ID (faqat admin)'),
        ],
        responses={200: ExpenseStatisticsSerializer}
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Umumiy chiqimlar statistikasi"""
        expenses = Expense.objects.all()
        
        # Filterlarni qo'llash
        date_from = request.query_params.get('date_from')
        if date_from:
            expenses = expenses.filter(date__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            expenses = expenses.filter(date__lte=date_to)
        
        building = request.query_params.get('building')
        if building:
            expenses = expenses.filter(building_id=building)
        
        category = request.query_params.get('category')
        if category:
            expenses = expenses.filter(category_id=category)
        
        created_by = request.query_params.get('created_by')
        if created_by and request.user.username == CEO_ADMIN_USERNAME:
            expenses = expenses.filter(created_by_id=created_by)
        
        # Umumiy statistikalar
        stats = expenses.aggregate(
            total=Sum('amount'),
            count=Count('id'),
            avg=Avg('amount'),
            max_amount=Max('amount'),
            min_amount=Min('amount')
        )
        total_expenses = stats['total'] or 0
        expenses_count = stats['count'] or 0
        avg_expense = stats['avg'] or 0
        max_expense = stats['max_amount'] or 0
        min_expense = stats['min_amount'] or 0
        
        # Kategoriya bo'yicha
        expenses_by_category = {}
        for cat in ExpenseCategory.objects.all():
            amount = expenses.filter(category=cat).aggregate(total=Sum('amount'))['total'] or 0
            expenses_by_category[cat.name] = float(amount)
        
        # Binolar bo'yicha
        expenses_by_building = list(
            expenses.values('building__name', 'building_id')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')[:10]
        )
        
        # Top foydalanuvchilar (faqat admin uchun)
        top_users = []
        if request.user.username == CEO_ADMIN_USERNAME:
            top_users = list(
                expenses.values('created_by__username', 'created_by_id')
                .annotate(total=Sum('amount'), count=Count('id'))
                .order_by('-total')[:10]
            )
        
        # Kunlik (so'nggi 30 kun)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        daily_expenses = list(
            expenses.filter(date__gte=thirty_days_ago)
            .values('date')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('date')
        )
        
        # Haftalik (oxirgi 8 hafta)
        eight_weeks_ago = timezone.now().date() - timedelta(weeks=8)
        weekly_expenses = list(
            expenses.filter(date__gte=eight_weeks_ago)
            .annotate(week=TruncWeek('date'))
            .values('week')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('week')
        )
        
        # Oylik (oxirgi 12 oy)
        twelve_months_ago = timezone.now().date() - timedelta(days=365)
        monthly_expenses = list(
            expenses.filter(date__gte=twelve_months_ago)
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('month')
        )
        
        return Response({
            'total_expenses': float(total_expenses),
            'expenses_count': expenses_count,
            'average_expense': float(avg_expense),
            'max_expense': float(max_expense),
            'min_expense': float(min_expense),
            'expenses_by_category': expenses_by_category,
            'expenses_by_building': expenses_by_building,
            'top_users': top_users,
            'daily_expenses': daily_expenses,
            'weekly_expenses': weekly_expenses,
            'monthly_expenses': monthly_expenses
        })


class DashboardStatisticsView(APIView):
    """
    Dashboard uchun umumiy statistika API
    
    Bu API orqali boshqaruv paneli uchun barcha kerakli statistik ma'lumotlarni olish mumkin.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Umumiy dashboard statistikasi",
        description="""
        Boshqaruv paneli uchun umumiy statistik ma'lumotlarni olish.
        
        **Qaytariladigan ma'lumotlar:**
        
        ### Umumiy ko'rsatkichlar
        - `total_buildings` - Jami binolar soni
        - `total_expenses` - Jami chiqimlar summasi (so'm)
        - `total_budget` - Barcha binolarga ajratilgan umumiy mablag' (so'm)
        - `total_spent` - Barcha binolarda sarflangan mablag' (so'm)
        
        ### Binolar holati
        - `buildings_by_status` - Holat bo'yicha binolar soni
        
        ### Top 5 binolar
        - `top_buildings_by_expenses` - Eng ko'p xarajat qilingan 5 ta bino
        
        ### So'nggi faoliyat
        - `recent_expenses` - So'nggi 5 ta chiqim
        """,
        tags=['Statistika']
    )
    def get(self, request):
        """Umumiy dashboard statistikasi"""
        
        # Umumiy ko'rsatkichlar
        total_buildings = Building.objects.count()
        total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0
        
        # Byudjet statistikasi
        budget_stats = Building.objects.aggregate(
            total_budget=Sum('budget'),
            total_spent=Sum('spent_amount')
        )
        
        # Binolar holati bo'yicha
        buildings_by_status = {}
        for status_choice in Building.Status.choices:
            count = Building.objects.filter(status=status_choice[0]).count()
            buildings_by_status[status_choice[1]] = count
        
        # Top 5 binolar (xarajat bo'yicha)
        top_buildings = list(
            Building.objects.annotate(
                expenses_total=Sum('expenses__amount')
            ).order_by('-expenses_total')[:5].values(
                'id', 'name', 'status', 'budget', 'spent_amount', 'expenses_total'
            )
        )
        
        # So'nggi 5 ta chiqim
        recent_expenses = list(
            Expense.objects.select_related('building', 'category').order_by('-created_at')[:5].values(
                'id', 'description', 'amount', 'category__name', 'date', 'building__name'
            )
        )
        
        # category__name ni category ga o'zgartirish (frontend uchun)
        for expense in recent_expenses:
            expense['category'] = expense.pop('category__name', 'Boshqa')
        
        return Response({
            # Umumiy ko'rsatkichlar
            'total_buildings': total_buildings,
            'total_expenses': float(total_expenses),
            'total_budget': float(budget_stats['total_budget'] or 0),
            'total_spent': float(budget_stats['total_spent'] or 0),
            'remaining_budget': float((budget_stats['total_budget'] or 0) - (budget_stats['total_spent'] or 0)),
            
            # Holat bo'yicha
            'buildings_by_status': buildings_by_status,
            
            # Top binolar
            'top_buildings_by_expenses': top_buildings,
            
            # So'nggi faoliyat
            'recent_expenses': recent_expenses
        })


class BuildingComparisonView(APIView):
    """
    Binolarni solishtirish uchun API
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Binolarni solishtirish",
        description="""
        Barcha binolarni byudjet va xarajatlar bo'yicha solishtirish.
        
        **Qaytariladigan ma'lumotlar (har bir bino uchun):**
        - Bino nomi va ID si
        - Ajratilgan byudjet
        - Sarflangan mablag'
        - Qolgan mablag'
        - Byudjet ishlatilish foizi
        - Chiqimlar soni
        """,
        tags=['Statistika']
    )
    def get(self, request):
        """Binolarni solishtirish statistikasi"""
        
        buildings = Building.objects.annotate(
            expenses_count=Count('expenses'),
            expenses_total=Sum('expenses__amount')
        ).order_by('-budget')
        
        comparison_data = []
        for building in buildings:
            budget = float(building.budget)
            spent = float(building.spent_amount)
            remaining = budget - spent
            usage_percent = (spent / budget * 100) if budget > 0 else 0
            
            comparison_data.append({
                'id': building.id,
                'name': building.name,
                'status': building.status,
                'status_display': building.get_status_display(),
                'budget': budget,
                'spent_amount': spent,
                'remaining_budget': remaining,
                'usage_percent': round(usage_percent, 2),
                'expenses_count': building.expenses_count,
                'expenses_total': float(building.expenses_total or 0)
            })
        
        return Response({
            'buildings': comparison_data,
            'total_count': len(comparison_data)
        })


class MonthlyReportView(APIView):
    """
    Oylik hisobot uchun API
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Oylik hisobot",
        description="""
        Tanlangan oy uchun batafsil hisobot olish.
        
        **Parametrlar:**
        - `year` - Yil (masalan: 2024)
        - `month` - Oy (1-12)
        
        **Qaytariladigan ma'lumotlar:**
        - Oylik umumiy chiqimlar
        - Kategoriyalar bo'yicha taqsimot
        - Binolar bo'yicha taqsimot
        - Kunlik chiqimlar grafigi
        """,
        tags=['Statistika'],
        parameters=[
            OpenApiParameter(
                name='year',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Yil (masalan: 2024)",
                required=True
            ),
            OpenApiParameter(
                name='month',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Oy (1-12)",
                required=True
            )
        ]
    )
    def get(self, request):
        """Oylik hisobot"""
        from django.db.models.functions import TruncDate
        from calendar import monthrange
        
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        if not year or not month:
            return Response(
                {"error": "year va month parametrlari majburiy"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            year = int(year)
            month = int(month)
        except ValueError:
            return Response(
                {"error": "year va month butun son bo'lishi kerak"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Oy boshi va oxiri
        from datetime import date
        start_date = date(year, month, 1)
        _, last_day = monthrange(year, month)
        end_date = date(year, month, last_day)
        
        # Oylik chiqimlar
        monthly_expenses = Expense.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        )
        
        total_amount = monthly_expenses.aggregate(total=Sum('amount'))['total'] or 0
        
        # Kategoriya bo'yicha
        by_category = {}
        for cat in ExpenseCategory.objects.all():
            amount = monthly_expenses.filter(category=cat).aggregate(total=Sum('amount'))['total'] or 0
            by_category[cat.name] = float(amount)
        
        # Binolar bo'yicha
        by_building = list(
            monthly_expenses.values('building__name')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )
        
        # Kunlik chiqimlar
        daily_expenses = list(
            monthly_expenses.annotate(day=TruncDate('date'))
            .values('day')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('day')
        )
        
        return Response({
            'period': {
                'year': year,
                'month': month,
                'start_date': str(start_date),
                'end_date': str(end_date)
            },
            'expenses': {
                'total_amount': float(total_amount),
                'count': monthly_expenses.count(),
                'by_category': by_category,
                'by_building': by_building,
                'daily': daily_expenses
            }
        })


class WeeklyReportView(APIView):
    """
    Haftalik hisobot uchun API
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Haftalik hisobot",
        description="""
        Oxirgi N hafta uchun haftalik hisobot olish.
        
        **Parametrlar:**
        - `weeks` - Necha haftalik ma'lumot kerak (default: 8)
        
        **Qaytariladigan ma'lumotlar:**
        - Har bir hafta uchun chiqimlar summasi
        - Haftalik o'rtacha
        - O'sish/pasayish foizi
        """,
        tags=['Statistika'],
        parameters=[
            OpenApiParameter(
                name='weeks',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Necha haftalik ma'lumot (default: 8)",
                required=False
            )
        ]
    )
    def get(self, request):
        """Haftalik hisobot"""
        
        weeks = request.query_params.get('weeks', 8)
        try:
            weeks = int(weeks)
        except ValueError:
            weeks = 8
        
        weeks_ago = timezone.now().date() - timedelta(weeks=weeks)
        
        weekly_data = list(
            Expense.objects.filter(date__gte=weeks_ago)
            .annotate(week=TruncWeek('date'))
            .values('week')
            .annotate(
                total=Sum('amount'),
                count=Count('id')
            )
            .order_by('week')
        )
        
        # Haftalik o'rtacha
        totals = [float(w['total'] or 0) for w in weekly_data]
        avg_weekly = sum(totals) / len(totals) if totals else 0
        
        # O'sish/pasayish
        if len(totals) >= 2:
            change = totals[-1] - totals[-2]
            change_percent = (change / totals[-2] * 100) if totals[-2] > 0 else 0
        else:
            change = 0
            change_percent = 0
        
        return Response({
            'weeks_count': weeks,
            'weekly_data': weekly_data,
            'summary': {
                'total': sum(totals),
                'average_weekly': round(avg_weekly, 2),
                'latest_week_change': round(change, 2),
                'change_percent': round(change_percent, 2)
            }
        })
