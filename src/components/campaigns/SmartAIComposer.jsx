import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Zap, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SmartAIComposer({ currentMessage, channel, restaurant, onApply }) {
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState(null);

  const generateVariations = async () => {
    if (!currentMessage || currentMessage.trim().length < 10) {
      toast.error('אנא כתוב הודעה לפני השימוש ב-AI');
      return;
    }

    setLoading(true);
    try {
      const channelLabel = { sms: 'SMS', whatsapp: 'WhatsApp', email: 'אימייל' }[channel] || channel;
      
      const prompt = `אתה כותב מקצועי לשיווק מסעדות יוקרה בעברית.

מסעדה: ${restaurant?.name || 'מסעדה יוקרתית'}
ערוץ: ${channelLabel}
הודעה מקורית: "${currentMessage}"

צור 3 גרסאות שונות של ההודעה בעברית, כל אחת בסגנון שונו:

1. **קצר** - תמציתי ולעניין (עד 100 תווים)
2. **חם** - אישי ומזמין (עד 150 תווים)
3. **דחוף** - יוצר תחושת דחיפות ו-FOMO (עד 150 תווים)

כל הודעה חייבת:
- להיות בעברית מושלמת
- לשמור על המסר המקורי
- להתאים לערוץ ${channelLabel}
- להיות מקצועית ומעוררת פעולה
- לכלול אימוג'י רלוונטי אחד או שניים

החזר JSON בפורמט:
{
  "short": "הודעה קצרה...",
  "warm": "הודעה חמה...",
  "urgent": "הודעה דחופה..."
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            short: { type: "string" },
            warm: { type: "string" },
            urgent: { type: "string" }
          }
        }
      });

      setVariations(result);
      toast.success('נוצרו 3 גרסאות מלוטשות!');
    } catch (error) {
      toast.error('שגיאה ביצירת גרסאות');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const variationTypes = [
    { key: 'short', label: 'קצר', icon: Zap, color: 'from-blue-50 to-blue-100', badge: 'bg-blue-100 text-blue-700' },
    { key: 'warm', label: 'חם', icon: Heart, color: 'from-pink-50 to-pink-100', badge: 'bg-pink-100 text-pink-700' },
    { key: 'urgent', label: 'דחוף', icon: Clock, color: 'from-orange-50 to-orange-100', badge: 'bg-orange-100 text-orange-700' }
  ];

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-[#0F172A]">Smart AI Composer</h3>
        </div>
        <Button
          onClick={generateVariations}
          disabled={loading || !currentMessage}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              יוצר גרסאות...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 ml-2" />
              שכתב עם AI
            </>
          )}
        </Button>
      </div>

      {!variations && !loading && (
        <p className="text-sm text-gray-600">
          כתוב הודעה ראשונית ואז לחץ על "שכתב עם AI" כדי לקבל 3 גרסאות מלוטשות: קצר, חם ודחוף.
        </p>
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
          <p className="text-sm text-gray-600">AI מלטש את ההודעה שלך...</p>
        </div>
      )}

      {variations && !loading && (
        <div className="space-y-3">
          <p className="text-xs text-gray-600 mb-2">בחר אחת מהגרסאות או השתמש כהשראה:</p>
          {variationTypes.map(({ key, label, icon: Icon, color, badge }) => (
            <button
              key={key}
              onClick={() => {
                onApply(variations[key]);
                toast.success(`הוחל סגנון "${label}"`);
              }}
              className={`w-full text-right p-4 rounded-xl border-2 border-transparent hover:border-purple-400 transition-all bg-gradient-to-br ${color}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge className={badge}>
                  <Icon className="w-3 h-3 ml-1" />
                  {label}
                </Badge>
                <span className="text-xs text-gray-500">{variations[key]?.length || 0} תווים</span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">{variations[key]}</p>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}