import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, 
  Calendar, 
  Gift, 
  TrendingUp, 
  Send, 
  Edit2,
  X,
  Loader2,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, addDays, isWithinInterval } from 'date-fns';

export default function AICampaignSuggestions({ restaurantId, restaurantName }) {
  const queryClient = useQueryClient();
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', restaurantId],
    queryFn: () => base44.entities.Customer.filter({ restaurant_id: restaurantId }),
    enabled: !!restaurantId
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => base44.entities.Holiday.list()
  });

  const { data: suggestions, isLoading, refetch } = useQuery({
    queryKey: ['campaign-suggestions', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const opportunities = [];
      const today = new Date();
      const nextWeek = addDays(today, 7);

      // Check for upcoming holidays
      const upcomingHolidays = holidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return isWithinInterval(holidayDate, { start: today, end: addDays(today, 14) }) && holiday.is_active;
      });

      for (const holiday of upcomingHolidays) {
        opportunities.push({
          id: `holiday-${holiday.id}`,
          type: 'holiday',
          title: `קמפיין ${holiday.hebrew_name || holiday.name}`,
          description: `שלח ברכה ללקוחות ל${holiday.hebrew_name || holiday.name}`,
          date: holiday.date,
          icon: Calendar,
          urgency: 'high',
          estimatedReach: customers.length,
          holiday: holiday
        });
      }

      // Check for birthdays this week
      const birthdaysThisWeek = customers.filter(customer => {
        if (!customer.date_of_birth) return false;
        const birthday = new Date(customer.date_of_birth);
        const birthdayThisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        return isWithinInterval(birthdayThisYear, { start: today, end: nextWeek });
      });

      if (birthdaysThisWeek.length > 0) {
        opportunities.push({
          id: 'birthday-week',
          type: 'birthday',
          title: 'קמפיין ימי הולדת',
          description: `${birthdaysThisWeek.length} לקוחות חוגגים השבוע`,
          icon: Gift,
          urgency: 'medium',
          estimatedReach: birthdaysThisWeek.length,
          customers: birthdaysThisWeek
        });
      }

      // Check for inactive customers (win-back)
      const inactiveCustomers = customers.filter(customer => {
        const lastContact = customer.last_contacted ? new Date(customer.last_contacted) : new Date(customer.created_date);
        const daysSinceContact = Math.floor((today - lastContact) / (1000 * 60 * 60 * 24));
        return daysSinceContact > 90;
      });

      if (inactiveCustomers.length > 10) {
        opportunities.push({
          id: 'winback',
          type: 'winback',
          title: 'קמפיין החזרת לקוחות',
          description: `${inactiveCustomers.length} לקוחות לא היו במגע מזמן`,
          icon: TrendingUp,
          urgency: 'low',
          estimatedReach: inactiveCustomers.length,
          customers: inactiveCustomers
        });
      }

      return opportunities;
    },
    enabled: !!restaurantId && holidays.length > 0
  });

  const generateCampaign = async (suggestion) => {
    setIsGenerating(true);
    setSelectedSuggestion(suggestion);
    setShowDialog(true);

    try {
      let prompt = '';
      
      if (suggestion.type === 'holiday') {
        prompt = `צור הודעת קמפיין שיווקי למסעדה בשם "${restaurantName}" לרגל ${suggestion.holiday.hebrew_name || suggestion.holiday.name}.
        ההודעה צריכה להיות חמה, מזמינה ומעודדת הזמנות.
        כלול ברכה מתאימה והצעה מיוחדת לחג.
        הודעה בעברית, עד 160 תווים, בסגנון ידידותי ומקצועי.`;
      } else if (suggestion.type === 'birthday') {
        prompt = `צור הודעת ברכה ליום הולדת למסעדה בשם "${restaurantName}".
        ההודעה צריכה להיות אישית, חמה ולכלול הנחה או מתנה מיוחדת ליום ההולדת.
        הודעה בעברית, עד 160 תווים, בסגנון ידידותי.`;
      } else if (suggestion.type === 'winback') {
        prompt = `צור הודעת "חסר לנו אותך" למסעדה בשם "${restaurantName}" ללקוחות שלא ביקרו מזמן.
        ההודעה צריכה להיות נוסטלגית, מזמינה ולכלול הצעה מיוחדת לעידוד חזרה.
        הודעה בעברית, עד 160 תווים, בסגנון חם ואישי.`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setEditedContent(response);
    } catch (error) {
      console.error('Error generating campaign:', error);
      toast.error('שגיאה ביצירת הקמפיין');
      setShowDialog(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const suggestion = selectedSuggestion;
      let recipientIds = [];

      if (suggestion.type === 'holiday') {
        recipientIds = customers.map(c => c.id);
      } else if (suggestion.type === 'birthday' || suggestion.type === 'winback') {
        recipientIds = suggestion.customers.map(c => c.id);
      }

      return await base44.entities.Message.create({
        restaurant_id: restaurantId,
        name: suggestion.title,
        content: editedContent,
        channel: 'whatsapp',
        status: 'draft',
        recipient_type: 'selected',
        recipient_ids: recipientIds,
        recipient_count: recipientIds.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      toast.success('קמפיין נוצר בהצלחה!');
      setShowDialog(false);
      setSelectedSuggestion(null);
    },
    onError: () => {
      toast.error('שגיאה ביצירת קמפיין');
    }
  });

  if (isLoading) {
    return (
      <Card className="border-gray-100">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className="border-gray-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C5A059]" />
            <CardTitle>הצעות קמפיינים חכמות</CardTitle>
          </div>
          <CardDescription>אין הצעות חדשות כרגע</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            המערכת תזהה אוטומטית הזדמנויות שיווקיות ותציע קמפיינים מותאמים
          </p>
        </CardContent>
      </Card>
    );
  }

  const getUrgencyColor = (urgency) => {
    const colors = {
      high: 'bg-red-50 text-red-700 border-red-200',
      medium: 'bg-amber-50 text-amber-700 border-amber-200',
      low: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return colors[urgency] || colors.low;
  };

  const getUrgencyLabel = (urgency) => {
    const labels = {
      high: 'דחוף',
      medium: 'בינוני',
      low: 'רגיל'
    };
    return labels[urgency] || '';
  };

  return (
    <>
      <Card className="border-[#C5A059]/30 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C5A059]" />
              <CardTitle>הצעות קמפיינים חכמות</CardTitle>
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              {suggestions.length} הזדמנויות
            </Badge>
          </div>
          <CardDescription>AI זיהה הזדמנויות שיווקיות - צור קמפיין בלחיצה</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <div 
                key={suggestion.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-[#C5A059] transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-[#C5A059]/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#C5A059]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-[#0F172A]">{suggestion.title}</h4>
                      <Badge variant="outline" className={getUrgencyColor(suggestion.urgency)}>
                        {getUrgencyLabel(suggestion.urgency)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{suggestion.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      הקף משוער: {suggestion.estimatedReach} לקוחות
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => generateCampaign(suggestion)}
                  className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  צור קמפיין
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Edit Campaign Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent dir="rtl" className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C5A059]" />
              {selectedSuggestion?.title}
            </DialogTitle>
          </DialogHeader>

          {isGenerating ? (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#C5A059] mb-4" />
              <p className="text-gray-600">AI יוצר עבורך קמפיין מותאם אישית...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">תוכן ההודעה</label>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    נוצר על ידי AI
                  </Badge>
                </div>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={6}
                  placeholder="תוכן ההודעה..."
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editedContent.length} תווים
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">טיפ AI</p>
                    <p className="text-sm text-blue-700">
                      ערוך את ההודעה כרצונך לפני השליחה. תוכל להוסיף פרטים ספציפיים למסעדה שלך או להתאים את הטון.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">ערוץ משלוח:</span>
                  <Badge variant="outline">WhatsApp</Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">נמענים:</span>
                  <Badge variant="outline">{selectedSuggestion?.estimatedReach} לקוחות</Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDialog(false);
                setSelectedSuggestion(null);
              }}
              disabled={isGenerating || createMutation.isPending}
            >
              ביטול
            </Button>
            <Button 
              onClick={() => createMutation.mutate()}
              disabled={isGenerating || !editedContent.trim() || createMutation.isPending}
              className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  יוצר...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 ml-2" />
                  צור קמפיין
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}