import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Star, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicFeedback() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('restaurant');

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    content: '',
    rating: 0
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      const restaurants = await base44.entities.Restaurant.filter({ id: restaurantId });
      return restaurants[0];
    },
    enabled: !!restaurantId,
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Feedback.create({
        restaurant_id: restaurantId,
        ...data,
        is_positive: data.rating >= 4,
        status: 'new'
      });
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  if (!restaurantId || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">מסעדה לא נמצאה</p>
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
          className="max-w-md w-full"
        >
          <Card className="border-[#C5A059]/30">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">תודה רבה!</h2>
              <p className="text-gray-600">המשוב שלך התקבל בהצלחה</p>
              <p className="text-sm text-gray-500 mt-4">נחזור אליך בהקדם</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
              <img src={restaurant.logo_url} alt={restaurant.name} className="w-20 h-20 object-contain mx-auto mb-4" />
            )}
            <CardTitle className="text-3xl font-bold text-[#0F172A]">
              קו חם למנהל
            </CardTitle>
            <p className="text-gray-600 mt-2">{restaurant.name}</p>
            <p className="text-sm text-gray-500 mt-2">
              שתפו אותנו בחוויה שלכם - המשוב שלכם חשוב לנו!
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>דירוג החוויה *</Label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= formData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא *</Label>
                  <Input
                    id="name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="לדוגמה: יוסי כהן"
                    required
                  />
                </div>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">אימייל (אופציונלי)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">ספרו לנו על החוויה *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="מה היה טוב? מה אפשר לשפר?"
                  rows={5}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitMutation.isPending || !formData.rating || !formData.customer_name || !formData.phone || !formData.content}
                className="w-full bg-[#C5A059] hover:bg-[#B8934D] text-white py-6 text-lg"
              >
                {submitMutation.isPending ? (
                  'שולח...'
                ) : (
                  <>
                    <Send className="w-5 h-5 ml-2" />
                    שלח משוב
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          המידע שלך מאובטח ולא ישותף עם צד שלישי
        </p>
      </motion.div>
    </div>
  );
}