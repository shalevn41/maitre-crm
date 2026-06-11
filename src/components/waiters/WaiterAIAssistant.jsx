import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, TrendingUp, MessageSquare, Loader2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function WaiterAIAssistant({ waiters, customers, restaurant }) {
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('select'); // 'select', 'analysis', 'message'

  const analyzeWaiter = async (waiter) => {
    setLoading(true);
    setSelectedWaiter(waiter);
    setView('analysis');
    
    try {
      const waiterCustomers = customers.filter(c => c.referred_by === waiter.tracking_code);
      const avgSignupsPerMonth = waiter.signup_count / Math.max(1, Math.ceil((new Date() - new Date(waiter.created_date)) / (30 * 24 * 60 * 60 * 1000)));
      
      const prompt = `אתה יועץ עסקי למסעדות. נתח את ביצועי המלצר הבא ותן המלצות לשיפור:

שם המלצר: ${waiter.name}
מספר הרשמות: ${waiter.signup_count}
ממוצע הרשמות לחודש: ${avgSignupsPerMonth.toFixed(1)}
תאריך הצטרפות: ${new Date(waiter.created_date).toLocaleDateString('he-IL')}

סך לקוחות במסעדה: ${customers.length}
שם המסעדה: ${restaurant?.name || 'המסעדה'}

תן ניתוח קצר ו-3 טיפים קונקרטיים לשיפור ביצועי המלצר.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            performance_level: { type: "string" },
            summary: { type: "string" },
            tips: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setAnalysis(result);
    } catch (error) {
      toast.error('שגיאה בניתוח נתונים');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateMessage = async () => {
    if (!selectedWaiter) return;
    
    setLoading(true);
    setView('message');
    
    try {
      const waiterCustomers = customers.filter(c => c.referred_by === selectedWaiter.tracking_code);
      
      const prompt = `צור הודעת WhatsApp חמה ומעודדת למלצר ${selectedWaiter.name} במסעדה ${restaurant?.name || 'המסעדה'}.

הנתונים:
- ${selectedWaiter.signup_count} לקוחות הירשמו דרכו
- ביצועים: ${analysis?.performance_level || 'טובים'}

ההודעה צריכה:
1. להודות לו על העבודה
2. לציין את מספר ההרשמות
3. לעודד אותו להמשיך
4. להציע בונוס/הטבה אם הוא יגיע ל-${selectedWaiter.signup_count + 10} הרשמות

עד 150 תווים, עם אימוג'י.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      setGeneratedMessage(result);
    } catch (error) {
      toast.error('שגיאה ביצירת הודעה');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    const message = encodeURIComponent(generatedMessage);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    toast.success('הודעה נפתחה בוואטסאפ');
  };

  if (waiters.length === 0) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle>AI מאמן המלצרים</CardTitle>
          </div>
          {selectedWaiter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setView('select');
                setSelectedWaiter(null);
                setAnalysis(null);
                setGeneratedMessage('');
              }}
            >
              חזור לבחירה
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {view === 'select' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              בחר מלצר לקבלת ניתוח ביצועים והמלצות AI
            </p>
            <div className="grid gap-2">
              {waiters.map((waiter) => (
                <button
                  key={waiter.id}
                  onClick={() => analyzeWaiter(waiter)}
                  className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-right"
                >
                  <div>
                    <p className="font-medium text-[#0F172A]">{waiter.name}</p>
                    <p className="text-sm text-gray-500">{waiter.signup_count} הרשמות</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'analysis' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
                <p className="text-sm text-gray-600">מנתח נתונים...</p>
              </div>
            ) : analysis ? (
              <>
                <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-purple-100 text-purple-800">
                      {selectedWaiter.name}
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      {analysis.performance_level}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-medium text-[#0F172A]">טיפים לשיפור:</p>
                  </div>
                  {analysis.tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <span className="text-amber-700 font-bold text-sm">{index + 1}.</span>
                      <p className="text-sm text-amber-900">{tip}</p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={generateMessage}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <MessageSquare className="w-4 h-4 ml-2" />
                  צור הודעת עידוד אוטומטית
                </Button>
              </>
            ) : null}
          </div>
        )}

        {view === 'message' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
                <p className="text-sm text-gray-600">יוצר הודעה מותאמת אישית...</p>
              </div>
            ) : generatedMessage ? (
              <>
                <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                  <p className="text-xs text-gray-500 mb-2">הודעה ל-{selectedWaiter.name}:</p>
                  <Textarea
                    value={generatedMessage}
                    onChange={(e) => setGeneratedMessage(e.target.value)}
                    rows={4}
                    className="text-sm resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setView('analysis')}
                    variant="outline"
                    className="flex-1"
                  >
                    חזור לניתוח
                  </Button>
                  <Button
                    onClick={sendMessage}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageSquare className="w-4 h-4 ml-2" />
                    שלח בוואטסאפ
                  </Button>
                </div>

                <Button
                  onClick={generateMessage}
                  variant="ghost"
                  size="sm"
                  className="w-full text-purple-600"
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  צור הודעה חדשה
                </Button>
              </>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}