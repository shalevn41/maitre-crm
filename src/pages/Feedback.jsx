import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Star, ThumbsUp, ThumbsDown, ExternalLink, MessageCircle, CheckCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function Feedback() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['feedbacks', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Feedback.filter({ restaurant_id: user.restaurant_id }, '-created_date');
    },
    enabled: !!user?.restaurant_id,
  });

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return null;
      const restaurants = await base44.entities.Restaurant.filter({ id: user.restaurant_id });
      return restaurants[0];
    },
    enabled: !!user?.restaurant_id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Feedback.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(['feedbacks']),
  });

  const handleCompensate = (feedback) => {
    const message = encodeURIComponent(`שלום ${feedback.customer_name}, תודה על הפניה. נשמח לפצות ולארח אותך שוב! 🙏`);
    window.open(`https://wa.me/${feedback.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    updateMutation.mutate({ id: feedback.id, status: 'handled' });
  };

  const handleLeverageToGoogle = (feedback) => {
    if (!restaurant?.google_review_link) {
      alert('נא להגדיר קישור Google Review בהגדרות המסעדה');
      return;
    }
    const message = encodeURIComponent(`היי ${feedback.customer_name}! תודה רבה על המשוב החיובי! 🌟\n\nנשמח מאוד אם תוכל/י לשתף את החוויה שלך גם ב-Google:\n${restaurant.google_review_link}\n\nתודה! 💛`);
    window.open(`https://wa.me/${feedback.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    updateMutation.mutate({ id: feedback.id, status: 'handled' });
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filter === 'positive') return f.is_positive;
    if (filter === 'negative') return !f.is_positive;
    if (filter === 'new') return f.status === 'new';
    return true;
  });

  const feedbackUrl = `${window.location.origin}${window.location.pathname}#/PublicFeedback?restaurant=${user?.restaurant_id}`;

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="מגן המוניטין - Feedback Shield"
        subtitle="ניהול פידבקים והגנה על המוניטין שלך"
      />

      {/* QR Code Card */}
      <Card className="border-[#C5A059]/30 bg-gradient-to-br from-amber-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#C5A059]" />
            <CardTitle>קוד QR - קו חם למנהל</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            הצב את קוד ה-QR הזה בשולחנות כדי שלקוחות יוכלו לשתף פידבק ישירות איתך
          </p>
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(feedbackUrl)}`}
              alt="Feedback QR Code"
              className="w-48 h-48"
            />
          </div>
          <Button
            onClick={() => {
              const a = document.createElement('a');
              a.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(feedbackUrl)}`;
              a.download = 'feedback-qr.png';
              a.click();
            }}
            variant="outline"
            className="mt-4"
          >
            הורד QR
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="all">הכל</TabsTrigger>
          <TabsTrigger value="new">חדש</TabsTrigger>
          <TabsTrigger value="positive">חיובי</TabsTrigger>
          <TabsTrigger value="negative">שלילי</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Feedbacks List */}
      {isLoading ? (
        <div className="text-center py-8">טוען...</div>
      ) : filteredFeedbacks.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquare}
            title="אין פידבקים עדיין"
            description="כשלקוחות ישתפו פידבק, הוא יופיע כאן"
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id} className={`border-gray-100 ${feedback.status === 'new' ? 'border-r-4 border-r-[#C5A059]' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    feedback.is_positive ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {feedback.is_positive ? (
                      <ThumbsUp className="w-6 h-6 text-green-600" />
                    ) : (
                      <ThumbsDown className="w-6 h-6 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-[#0F172A]">{feedback.customer_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(feedback.created_date), 'dd MMM yyyy', { locale: he })}
                          </span>
                        </div>
                      </div>
                      {feedback.status === 'new' && (
                        <Badge className="bg-[#C5A059] text-white">חדש</Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{feedback.content}</p>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <span>{feedback.phone}</span>
                      {feedback.email && <span>• {feedback.email}</span>}
                    </div>

                    {feedback.status === 'new' && (
                      <div className="flex gap-2">
                        {feedback.is_positive ? (
                          <Button
                            onClick={() => handleLeverageToGoogle(feedback)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <ExternalLink className="w-4 h-4 ml-2" />
                            העבר ל-Google Review
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleCompensate(feedback)}
                            size="sm"
                            className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
                          >
                            <MessageCircle className="w-4 h-4 ml-2" />
                            פצה בוואטסאפ
                          </Button>
                        )}
                        <Button
                          onClick={() => updateMutation.mutate({ id: feedback.id, status: 'handled' })}
                          size="sm"
                          variant="outline"
                        >
                          <CheckCircle className="w-4 h-4 ml-2" />
                          סמן כטופל
                        </Button>
                      </div>
                    )}

                    {feedback.status === 'handled' && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>טופל</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}