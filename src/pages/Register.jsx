import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Building2,
  User,
  Phone,
  MapPin,
  Mail,
  Utensils,
  CheckCircle2,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hasRestaurant, setHasRestaurant] = useState(false);

  const [formData, setFormData] = useState({
    // Personal info
    full_name: '',
    phone: '',
    email: '',
    // Restaurant info
    restaurant_name: '',
    restaurant_type: '',
    restaurant_phone: '',
    address: '',
    city: '',
    description: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          full_name: userData.full_name || '',
          email: userData.email || ''
        }));

        // Check if user already has a restaurant
        if (userData.restaurant_id) {
          const restaurants = await base44.entities.Restaurant.filter({ id: userData.restaurant_id });
          if (restaurants.length > 0) {
            setHasRestaurant(true);
          }
        }
      } catch (error) {
        // Not authenticated - redirect to login
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    checkAuth();
  }, []);

  const registerMutation = useMutation({
    mutationFn: async () => {
      // Create restaurant
      const restaurant = await base44.entities.Restaurant.create({
        name: formData.restaurant_name,
        owner_email: user.email,
        phone: formData.restaurant_phone,
        address: formData.address,
        city: formData.city,
        subscription_status: 'trial',
        total_customers: 0,
        total_messages_sent: 0
      });

      // Update user with restaurant_id
      await base44.auth.updateMe({
        restaurant_id: restaurant.id,
        full_name: formData.full_name,
        phone: formData.phone
      });

      return restaurant;
    },
    onSuccess: async () => {
      toast.success('נרשמת בהצלחה! מעביר אותך למערכת...');
      // Full page reload to refresh all app state
      setTimeout(() => {
        window.location.href = window.location.origin + '/Dashboard';
      }, 1000);
    },
    onError: (error) => {
      console.error('Registration error:', error);
      toast.error('שגיאה ברישום. נסה שוב');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate all required fields
    if (!formData.full_name || !formData.phone || !formData.restaurant_name || !formData.city) {
      toast.error('אנא מלא את כל השדות החובה');
      return;
    }
    registerMutation.mutate();
  };

  if (hasRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F7FA] to-gray-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md border-gray-100">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-[#0F172A] mb-2">כבר רשום!</h2>
            <p className="text-gray-600 mb-6">המסעדה שלך כבר רשומה במערכת</p>
            <Button
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="bg-[#C5A059] hover:bg-[#B8934D] text-white w-full"
            >
              עבור ללוח הבקרה
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7FA] to-gray-100 py-12 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-16 h-16">
                <path d="M8 32 L20 8 L32 32" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 20 L20 32 L26 20" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-[#0F172A]">MAITRE</h1>
          </div>
          <h2 className="text-2xl font-semibold text-[#0F172A] mb-2">הרשמה למערכת</h2>
          <p className="text-gray-600">הצטרף למערכת הניהול המתקדמת למסעדות</p>
        </div>



        {/* Form */}
        <Card className="border-gray-100">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>פרטי הרישום</CardTitle>
            <CardDescription>מלא את הפרטים שלך ושל המסעדה</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-[#0F172A] border-b pb-2">פרטים אישיים</h3>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">שם מלא *</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="שם מלא"
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">אימייל *</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="pr-10 bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">טלפון נייד *</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="050-1234567"
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-[#0F172A] border-b pb-2">פרטי העסק</h3>
                  <div className="space-y-2">
                    <Label htmlFor="restaurant_name">שם המסעדה *</Label>
                    <div className="relative">
                      <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="restaurant_name"
                        value={formData.restaurant_name}
                        onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                        placeholder="שם המסעדה"
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restaurant_phone">טלפון מסעדה</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="restaurant_phone"
                        value={formData.restaurant_phone}
                        onChange={(e) => setFormData({ ...formData, restaurant_phone: e.target.value })}
                        placeholder="03-1234567"
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">עיר *</Label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="תל אביב"
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">כתובת</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="רחוב 123"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">תיאור המסעדה (אופציונלי)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="ספר לנו קצת על המסעדה שלך..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="bg-[#C5A059] hover:bg-[#B8934D] text-white w-full sm:w-auto"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        שומר...
                      </>
                    ) : (
                      'השלם רישום והתחל'
                    )}
                  </Button>
                </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="mt-6 border-blue-100 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-[#0F172A] mb-1">מה הלאה?</h4>
                <p className="text-sm text-gray-600">
                  לאחר השלמת הרישום, תיכנס ישירות למערכת. 
                  תוכל להשלים את התשלום בהמשך מדף החיובים כדי להפעיל את כל התכונות.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}