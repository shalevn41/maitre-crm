import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Zap, Calendar, Gift, Users, TrendingUp, Plus, 
  Sparkles, RefreshCw, Cake, Clock, MessageSquare, Pencil, CheckCircle2, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';

export default function Automations() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedTone, setSelectedTone] = useState('funny');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [step, setStep] = useState(1); // 1: choose type, 2: AI suggestions, 3: confirm & activate

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: automations = [] } = useQuery({
    queryKey: ['automations', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Automation.filter({ restaurant_id: user.restaurant_id });
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

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Automation.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries(['automations']),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Automation.create({
      restaurant_id: user.restaurant_id,
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['automations']);
      setSelectedAutomation(null);
      toast.success('אוטומציה נוצרה בהצלחה!');
    },
  });

  const toneOptions = [
    { value: 'funny', label: 'מצחיק', emoji: '😄' },
    { value: 'formal', label: 'רשמי', emoji: '👔' },
    { value: 'sales', label: 'מכירתי', emoji: '💰' },
  ];

  const generateAISuggestions = async (type, tone = 'funny') => {
    setLoadingAI(true);
    try {
      const toneDescriptions = {
        funny: 'מצחיק, שנון וקליט',
        formal: 'רשמי, מנומס ומכובד',
        sales: 'מכירתי, דחוף ומעורר פעולה'
      };

      const prompts = {
        holiday: `צור 5 הודעות שיווקיות לחג ישראלי במסעדה ${restaurant?.name}.
טון: ${toneDescriptions[tone]}
כל הודעה: עד 150 תווים, כולל אימוג'י, מעוררת הזמנת מקום.
החזר רשימה של 5 הודעות שונות.`,
        birthday: `צור 5 הודעות יום הולדת למסעדה ${restaurant?.name}.
טון: ${toneDescriptions[tone]}
כלול הצעת מתנה והזמנה לחגוג. עד 150 תווים.`,
        winback: `צור 5 הודעות Win-Back למסעדה ${restaurant?.name} להחזרת לקוחות שלא הגיעו 30 יום.
טון: ${toneDescriptions[tone]}
כלול מתנה מפתה. עד 150 תווים.`,
        viral_referral: `צור 4 הודעות SMS ויראליות למסעדה ${restaurant?.name} שמעודדות שיתוף עם חברים תמורת הגרלה.
טון: ${toneDescriptions[tone]}
עד 160 תווים.`
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[type] || prompts.holiday,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setAiSuggestions(result.suggestions || []);
      setStep(2);
    } catch (error) {
      toast.error('שגיאה ביצירת הצעות');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleEditSuggestion = (index) => {
    setEditingIndex(index);
    setEditedText(aiSuggestions[index]);
  };

  const saveEditedSuggestion = () => {
    const updated = [...aiSuggestions];
    updated[editingIndex] = editedText;
    setAiSuggestions(updated);
    setEditingIndex(null);
    setEditedText('');
  };

  const selectSuggestion = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setStep(3);
  };

  const confirmAndActivate = async () => {
    if (!selectedSuggestion || !selectedAutomation) return;
    
    createMutation.mutate({
      name: selectedAutomation.title,
      type: selectedAutomation.type,
      trigger: `Auto-${selectedAutomation.type}`,
      action: 'send_message',
      content: selectedSuggestion,
      is_active: true
    });
    
    // Reset states
    setSelectedAutomation(null);
    setAiSuggestions([]);
    setSelectedSuggestion(null);
    setStep(1);
    setSelectedTone('funny');
  };

  const automationTypes = [
    {
      type: 'holiday',
      icon: Calendar,
      title: 'פיילוט החגים',
      description: 'שליחה אוטומטית 6 ימים לפני חג',
      color: 'from-blue-50 to-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      type: 'birthday',
      icon: Cake,
      title: 'מנוע ימי הולדת',
      description: '3 הודעות: ראש חודש, 7 ימים לפני, 3 ימים לפני',
      color: 'from-pink-50 to-pink-100',
      iconColor: 'text-pink-600'
    },
    {
      type: 'winback',
      icon: RefreshCw,
      title: 'Win-Back חכם',
      description: 'החזרת לקוחות אחרי 30 יום',
      color: 'from-purple-50 to-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      type: 'viral_referral',
      icon: Users,
      title: 'לולאה ויראלית',
      description: 'הפוך לקוחות לשגרירים',
      color: 'from-green-50 to-green-100',
      iconColor: 'text-green-600'
    }
  ];

  const getAutomationByType = (type) => {
    return automations.find(a => a.type === type);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="מאיץ הרווחים - Profit Boosters"
        subtitle="אוטומציות שיווקיות חכמות שעובדות בשבילך 24/7"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {automationTypes.map((automationType) => {
          const automation = getAutomationByType(automationType.type);
          const Icon = automationType.icon;

          return (
            <Card key={automationType.type} className="border-gray-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className={`bg-gradient-to-br ${automationType.color} rounded-xl p-4 mb-4`}>
                  <Icon className={`w-12 h-12 ${automationType.iconColor}`} />
                </div>

                <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                  {automationType.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {automationType.description}
                </p>

                {automation ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={automation.is_active}
                          onCheckedChange={(checked) => 
                            toggleMutation.mutate({ id: automation.id, is_active: checked })
                          }
                        />
                        <span className="text-sm font-medium">
                          {automation.is_active ? 'פעיל' : 'כבוי'}
                        </span>
                      </div>
                      <Badge variant={automation.is_active ? 'default' : 'outline'}>
                        {automation.is_active ? '🟢 פועל' : '⚪ מושבת'}
                      </Badge>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-900 font-medium mb-1">תוכן ההודעה:</p>
                      <p className="text-sm text-blue-800">{automation.content}</p>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedAutomation(automationType);
                        generateAISuggestions(automationType.type);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <Sparkles className="w-4 h-4 ml-2" />
                      עדכן עם AI
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedAutomation(automationType);
                      generateAISuggestions(automationType.type);
                    }}
                    className="w-full bg-[#C5A059] hover:bg-[#B8934D] text-white"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    הפעל אוטומציה
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats Card */}
      <Card className="border-[#C5A059]/30 bg-gradient-to-br from-amber-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C5A059]" />
            השפעת האוטומציות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#0F172A]">
                {automations.filter(a => a.is_active).length}
              </p>
              <p className="text-sm text-gray-600">אוטומציות פעילות</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#0F172A]">24/7</p>
              <p className="text-sm text-gray-600">עובד בשבילך</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#0F172A]">100%</p>
              <p className="text-sm text-gray-600">אוטומטי</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Dialog */}
      <Dialog 
        open={!!selectedAutomation} 
        onOpenChange={() => {
          setSelectedAutomation(null);
          setStep(1);
          setAiSuggestions([]);
          setSelectedSuggestion(null);
          setSelectedTone('funny');
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedAutomation?.icon && <selectedAutomation.icon className="w-6 h-6 text-[#C5A059]" />}
                <DialogTitle>{selectedAutomation?.title}</DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <Badge variant="outline">{step === 2 ? 'בחירת תוכן' : 'אישור והפעלה'}</Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step 1: Choose Tone */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base mb-3 block">בחר טון להודעות:</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {toneOptions.map(({ value, label, emoji }) => (
                      <button
                        key={value}
                        onClick={() => setSelectedTone(value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedTone === value
                            ? 'border-[#C5A059] bg-[#C5A059]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{emoji}</div>
                        <p className="font-medium text-sm">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => generateAISuggestions(selectedAutomation?.type, selectedTone)}
                  disabled={loadingAI}
                  className="w-full bg-[#C5A059] hover:bg-[#B8934D] text-white"
                  size="lg"
                >
                  {loadingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      יוצר הצעות...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 ml-2" />
                      צור {toneOptions.find(t => t.value === selectedTone)?.emoji} הצעות {toneOptions.find(t => t.value === selectedTone)?.label.toLowerCase()}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: Choose or Edit Suggestion */}
            {step === 2 && !loadingAI && aiSuggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">בחר הודעה או ערוך:</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep(1);
                      setAiSuggestions([]);
                    }}
                  >
                    <RefreshCw className="w-4 h-4 ml-1" />
                    נסה טון אחר
                  </Button>
                </div>

                <div className="space-y-3">
                  {aiSuggestions.map((suggestion, i) => (
                    <div key={i} className="relative">
                      {editingIndex === i ? (
                        <div className="space-y-2 p-4 rounded-lg border-2 border-[#C5A059] bg-[#C5A059]/5">
                          <Textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            rows={3}
                            className="w-full"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={saveEditedSuggestion}
                              className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
                            >
                              <CheckCircle2 className="w-4 h-4 ml-1" />
                              שמור
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingIndex(null);
                                setEditedText('');
                              }}
                            >
                              ביטול
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg border-2 border-gray-200 hover:border-[#C5A059] transition-all">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <Badge variant="outline" className="text-xs">אופציה {i + 1}</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSuggestion(i)}
                              className="h-7"
                            >
                              <Pencil className="w-3 h-3 ml-1" />
                              התאם אישית
                            </Button>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed mb-3">{suggestion}</p>
                          <Button
                            size="sm"
                            onClick={() => selectSuggestion(suggestion)}
                            className="w-full bg-[#C5A059] hover:bg-[#B8934D] text-white"
                          >
                            בחר הודעה זו
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Confirm and Activate */}
            {step === 3 && selectedSuggestion && (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 mb-1">הודעה נבחרה!</p>
                      <p className="text-sm text-green-700">סקור את ההודעה שתישלח אוטומטית:</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-gray-800 leading-relaxed">{selectedSuggestion}</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>האוטומציה תופעל:</strong>
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1 mr-4">
                    {selectedAutomation?.type === 'holiday' && (
                      <li>• 6 ימים לפני כל חג ישראלי</li>
                    )}
                    {selectedAutomation?.type === 'birthday' && (
                      <>
                        <li>• בתחילת חודש ליום ההולדת</li>
                        <li>• 7 ימים לפני יום ההולדת</li>
                        <li>• 3 ימים לפני יום ההולדת</li>
                      </>
                    )}
                    {selectedAutomation?.type === 'winback' && (
                      <li>• 30 יום אחרי ההרשמה האחרונה של הלקוח</li>
                    )}
                    {selectedAutomation?.type === 'viral_referral' && (
                      <li>• כשתפעיל קמפיין ויראלי</li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(2);
                      setSelectedSuggestion(null);
                    }}
                    className="flex-1"
                  >
                    חזור לבחירה
                  </Button>
                  <Button
                    onClick={confirmAndActivate}
                    disabled={createMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        מפעיל...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 ml-2" />
                        אשר והפעל אוטומציה
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {loadingAI && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 animate-spin mx-auto text-[#C5A059] mb-3" />
                <p className="text-sm text-gray-600">AI יוצר הצעות מדהימות בטון {toneOptions.find(t => t.value === selectedTone)?.label}...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}