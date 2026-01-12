from rest_framework import serializers
from django.contrib.auth.models import User, Group
from drf_spectacular.utils import extend_schema_field
from .models import Building, Expense


class UserSerializer(serializers.ModelSerializer):
    """
    Foydalanuvchi serializeri
    
    Foydalanuvchi ma'lumotlarini JSON formatga o'girish uchun ishlatiladi.
    """
    role = serializers.SerializerMethodField(help_text="Foydalanuvchi roli")
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active']
        read_only_fields = ['id', 'role']
    
    @extend_schema_field(serializers.CharField())
    def get_role(self, obj):
        """Foydalanuvchi rolini olish"""
        groups = obj.groups.all()
        if groups.exists():
            return groups.first().name
        return 'Viewer'


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Yangi foydalanuvchi yaratish serializeri
    """
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        help_text="Parol (kamida 8 ta belgi)"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        help_text="Parolni tasdiqlang"
    )
    role = serializers.ChoiceField(
        choices=['Admin', 'Accountant', 'Viewer'],
        help_text="Foydalanuvchi roli: Admin, Accountant yoki Viewer"
    )
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'role']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Parollar mos kelmaydi"})
        return attrs
    
    def create(self, validated_data):
        role = validated_data.pop('role')
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # Rolni tayinlash
        group, _ = Group.objects.get_or_create(name=role)
        user.groups.add(group)
        
        return user


class BuildingListSerializer(serializers.ModelSerializer):
    """
    Binolar ro'yxati serializeri
    
    Binolar ro'yxatini ko'rsatish uchun qisqacha ma'lumot.
    """
    remaining_budget = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        read_only=True,
        help_text="Qolgan mablag' (so'm)"
    )
    expenses_count = serializers.SerializerMethodField(help_text="Chiqimlar soni")
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True,
        help_text="Holat (o'zbek tilida)"
    )
    
    class Meta:
        model = Building
        fields = [
            'id', 'name', 'status', 'status_display', 'budget', 
            'spent_amount', 'remaining_budget', 'start_date', 
            'end_date', 'expenses_count', 'created_at'
        ]
    
    @extend_schema_field(serializers.IntegerField())
    def get_expenses_count(self, obj):
        """Binoga tegishli chiqimlar soni"""
        return obj.expenses.count()


class BuildingDetailSerializer(serializers.ModelSerializer):
    """
    Bino tafsilotlari serializeri
    
    Bitta binoning to'liq ma'lumotlarini ko'rsatish uchun.
    """
    remaining_budget = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        read_only=True,
        help_text="Qolgan mablag' (so'm)"
    )
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True,
        help_text="Holat (o'zbek tilida)"
    )
    
    class Meta:
        model = Building
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class BuildingCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Bino yaratish/yangilash serializeri
    """
    
    class Meta:
        model = Building
        fields = ['name', 'status', 'budget', 'spent_amount', 'start_date', 'end_date', 'description']


class ExpenseListSerializer(serializers.ModelSerializer):
    """
    Chiqimlar ro'yxati serializeri
    """
    building_name = serializers.CharField(
        source='building.name', 
        read_only=True,
        help_text="Bino nomi"
    )
    category_display = serializers.CharField(
        source='get_category_display', 
        read_only=True,
        help_text="Kategoriya (o'zbek tilida)"
    )
    created_by_name = serializers.CharField(
        source='created_by.username', 
        read_only=True,
        help_text="Kim tomonidan qo'shilgan"
    )
    
    class Meta:
        model = Expense
        fields = [
            'id', 'building', 'building_name',
            'category', 'category_display', 'description', 
            'amount', 'date', 'created_by', 'created_by_name', 'created_at'
        ]


class ExpenseDetailSerializer(serializers.ModelSerializer):
    """
    Chiqim tafsilotlari serializeri
    """
    building_name = serializers.CharField(
        source='building.name', 
        read_only=True,
        help_text="Bino nomi"
    )
    category_display = serializers.CharField(
        source='get_category_display', 
        read_only=True,
        help_text="Kategoriya (o'zbek tilida)"
    )
    
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class ExpenseCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Chiqim yaratish/yangilash serializeri
    """
    
    class Meta:
        model = Expense
        fields = ['building', 'category', 'description', 'amount', 'date']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ExpenseStatisticsSerializer(serializers.Serializer):
    """
    Chiqimlar statistikasi serializeri
    """
    total_expenses = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2,
        help_text="Umumiy chiqimlar summasi"
    )
    expenses_by_category = serializers.DictField(
        child=serializers.DecimalField(max_digits=15, decimal_places=2),
        help_text="Kategoriyalar bo'yicha chiqimlar"
    )
    expenses_by_building = serializers.ListField(
        child=serializers.DictField(),
        help_text="Binolar bo'yicha chiqimlar"
    )
    weekly_expenses = serializers.ListField(
        child=serializers.DictField(),
        help_text="Haftalik chiqimlar"
    )
    monthly_expenses = serializers.ListField(
        child=serializers.DictField(),
        help_text="Oylik chiqimlar"
    )
