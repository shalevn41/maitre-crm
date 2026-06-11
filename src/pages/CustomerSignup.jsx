import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle, Send, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';

export default function CustomerSignup() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantParam = urlParams.get('restaurant');
  const waiterId = urlParams.get('waiter');
  const viralCode = urlParams.get('ref');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    date_of_birth: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant-signup', restaurantParam],
    queryFn: async () => {
      if (!restaurantParam) return null;
      
      // Try to find by ID first, then by slug
      let restaurants = await base44.entities.Restaurant.filter({ id: restaurantParam });
      if (!restaurants || restaurants.length === 0) {
        restaurants = await base44.entities.Restaurant.filter({ signup_slug: restaurantParam });
      }
      
      return restaurants && restaurants.length > 0 ? restaurants[0] : null;
    },
    enabled: !!restaurantParam,
  });

  const signupMutation = useMutation({
    mutationFn: async (data) => {
      const customer = await base44.entities.Customer.create({
        restaurant_id: restaurant.id,
        ...data,
        source: waiterId ? 'waiter' : viralCode ? 'viral_link' : 'signup_form',
        referred_by: waiterId || viralCode || null,
        opted_in: true,
        viral_share_code: `VRL${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase()
      });

      // Update waiter signup count if applicable
      if (waiterId) {
        const waiter = await base44.entities.Waiter.filter({ id: waiterId });
        if (waiter[0]) {
          await base44.entities.Waiter.update(waiter[0].id, {
            signup_count: (waiter[0].signup_count || 0) + 1
          });
        }
      }

      // Update restaurant total customers
      await base44.entities.Restaurant.update(restaurant.id, {
        total_customers: (restaurant.total_customers || 0) + 1
      });

      // Auto-sync to CRM if enabled
      try {
        await base44.functions.invoke('autoSyncCustomer', {
          customer_id: customer.id,
          restaurant_id: restaurant.id
        });
      } catch (error) {
        console.log('CRM sync failed (non-critical):', error);
      }

      return customer;
    },
    onSuccess: (customer) => {
      const expiryDate = addDays(new Date(), 20);
      const welcomeGift = restaurant.welcome_gift || 'מנה ראשונה מתנה';
      
      const message = `${restaurant.welcome_message || `ברוכים הבאים ל${restaurant.name}!`}

🎁 ${welcomeGift}

תקף לארוחה הראשונה בלבד. חובה להציג הודעה זו למלצר. בתוקף עד: ${format(expiryDate, 'dd/MM/yyyy', { locale: he })}

קוד לקוח: ${customer.id.substr(-6).toUpperCase()}`;

      setCouponMessage(message);
      setSubmitted(true);

      // In real implementation, send SMS via Twilio here
      // await sendSMS(formData.phone, message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    signupMutation.mutate(formData);
  };

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C5A059]" />
            <p className="text-gray-600 mt-4">טוען...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!restaurantParam || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">מסעדה לא נמצאה</p>
            <p className="text-xs text-gray-400 mt-2">אנא ודא שהקישור תקין</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <Card className="border-[#C5A059]/30">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-3xl font-bold text-[#0F172A] mb-3">ברוכים הבאים! 🎉</h2>
              <p className="text-gray-600 mb-6">נשלחה אליך SMS עם המתנה שלך</p>
              
              <div className="bg-gradient-to-br from-[#C5A059]/10 to-[#C5A059]/5 rounded-xl p-6 border-2 border-dashed border-[#C5A059] mb-6">
                <Gift className="w-12 h-12 text-[#C5A059] mx-auto mb-4" />
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {couponMessage}
                </p>
              </div>

              <p className="text-sm text-gray-500">
                שמרו על ההודעה - תצטרכו להציג אותה למלצר!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Parse custom landing page design
  const customBlocks = restaurant?.landing_page_design 
    ? (() => { try { return JSON.parse(restaurant.landing_page_design); } catch { return null; } })()
    : null;

  if (customBlocks && customBlocks.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white" dir="rtl">
        {customBlocks.map((block, index) => {
          if (block.type === 'hero') {
            return (
              <div 
                key={block.id}
                className="relative py-20 px-6 text-center"
                style={{
                  backgroundImage: block.content.backgroundImage ? `url(${block.content.backgroundImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {block.content.backgroundImage && <div className="absolute inset-0 bg-black/40" />}
                <div className="relative z-10">
                  {restaurant.logo_url && (
                    <motion.img 
                      src={restaurant.logo_url} 
                      alt={restaurant.name}
                      className="w-24 h-24 object-contain mx-auto mb-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    />
                  )}
                  <h1 className="text-4xl font-bold text-white mb-3" style={block.content.backgroundImage ? {} : { color: '#0F172A' }}>
                    {block.content.title}
                  </h1>
                  <p className="text-lg" style={block.content.backgroundImage ? { color: 'white' } : { color: '#666' }}>
                    {block.content.subtitle}
                  </p>
                </div>
              </div>
            );
          }
          if (block.type === 'text') {
            return (
              <div key={block.id} className="py-12 px-6 max-w-3xl mx-auto">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{block.content.text}</p>
              </div>
            );
          }
          if (block.type === 'image') {
            return block.content.url ? (
              <div key={block.id} className="py-8 px-6">
                <img 
                  src={block.content.url} 
                  alt={block.content.alt} 
                  className="max-w-2xl mx-auto rounded-xl shadow-lg"
                />
              </div>
            ) : null;
          }
          if (block.type === 'gift') {
            return (
              <div key={block.id} className="py-12 px-6 max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-[#C5A059]/10 to-[#C5A059]/5 rounded-xl p-8 text-center border-2 border-dashed border-[#C5A059]">
                  <Gift className="w-16 h-16 text-[#C5A059] mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-[#0F172A] mb-2">{block.content.title}</h3>
                  <p className="text-gray-700">{block.content.description}</p>
                  {restaurant.welcome_gift && (
                    <div className="mt-4 inline-block bg-[#C5A059] text-white px-6 py-2 rounded-full font-medium">
                      {restaurant.welcome_gift}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          if (block.type === 'form') {
            return (
              <div key={block.id} className="py-12 px-6 max-w-2xl mx-auto">
                <Card className="border-[#C5A059]/30">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{block.content.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">שם מלא *</Label>
                        <Input
                          id="name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          placeholder="לדוגמה: יוסי כהן"
                          required
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="phone">טלפון *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="050-1234567"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">אימייל</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="example@email.com"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="city">עיר</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="תל אביב"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dob">תאריך לידה</Label>
                          <Input
                            id="dob"
                            type="date"
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">כתובת</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="רחוב 123, תל אביב"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={signupMutation.isPending || !formData.full_name || !formData.phone}
                        className="w-full bg-[#C5A059] hover:bg-[#B8934D] text-white py-6 text-lg"
                      >
                        {signupMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                            שומר...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 ml-2" />
                            הצטרף עכשיו וקבל את המתנה
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        בהרשמה אתם מסכימים לקבל עדכונים שיווקיים מ{restaurant.name}
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  // Default design if no custom blocks
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-[#C5A059]/30">
          <CardHeader className="text-center border-b border-gray-100 pb-6">
            {restaurant.logo_url && (
              <motion.img 
                src={restaurant.logo_url} 
                alt={restaurant.name}
                className="w-24 h-24 object-contain mx-auto mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              />
            )}
            <CardTitle className="text-3xl font-bold text-[#0F172A]">
              הצטרפו למועדון האקסקלוסיבי
            </CardTitle>
            <p className="text-gray-600 mt-2">{restaurant.name}</p>
            {restaurant.welcome_gift && (
              <div className="mt-4 inline-block bg-[#C5A059] text-white px-6 py-2 rounded-full">
                <Gift className="w-4 h-4 inline ml-2" />
                {restaurant.welcome_gift}
              </div>
            )}
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">שם מלא *</Label>
                <Input
                  id="name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="לדוגמה: יוסי כהן"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="050-1234567"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">עיר</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="תל אביב"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">תאריך לידה</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">כתובת</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="רחוב 123, תל אביב"
                />
              </div>

              <Button
                type="submit"
                disabled={signupMutation.isPending || !formData.full_name || !formData.phone}
                className="w-full bg-[#C5A059] hover:bg-[#B8934D] text-white py-6 text-lg"
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 ml-2" />
                    הצטרף עכשיו וקבל את המתנה
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                בהרשמה אתם מסכימים לקבל עדכונים שיווקיים מ{restaurant.name}
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}