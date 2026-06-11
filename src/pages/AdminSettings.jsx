import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  DollarSign,
  Bell,
  Shield,
  Save,
  CreditCard,
  Mail,
  Plus,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pricing');
  const [newEmail, setNewEmail] = useState('');

  const { data: systemSettings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const settings = await base44.entities.SystemSettings.list();
      if (settings.length > 0) {
        return settings[0];
      }
      // Create default settings if none exist
      return await base44.entities.SystemSettings.create({
        notification_emails: [],
        notify_new_signup: true,
        notify_payment_failed: true,
        notify_subscription_upgrade: true,
        notify_subscription_canceled: true,
        subscription_price: 499,
        currency: 'ILS',
        trial_days: 14
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemSettings.update(systemSettings.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['system-settings']);
      toast.success('הגדרות נשמרו בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בשמירת הגדרות');
    }
  });

  const handleSave = () => {
    if (systemSettings) {
      updateMutation.mutate(systemSettings);
    }
  };

  const handleAddEmail = () => {
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
      toast.error('אנא הזן כתובת מייל תקינה');
      return;
    }
    const emails = systemSettings.notification_emails || [];
    if (emails.includes(newEmail)) {
      toast.error('כתובת מייל זו כבר קיימת');
      return;
    }
    updateMutation.mutate({
      ...systemSettings,
      notification_emails: [...emails, newEmail]
    });
    setNewEmail('');
  };

  const handleRemoveEmail = (emailToRemove) => {
    const emails = systemSettings.notification_emails || [];
    updateMutation.mutate({
      ...systemSettings,
      notification_emails: emails.filter(e => e !== emailToRemove)
    });
  };

  const updateSetting = (key, value) => {
    updateMutation.mutate({
      ...systemSettings,
      [key]: value
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader 
        title="הגדרות מערכת" 
        subtitle="ניהול הגדרות גלובליות של הפלטפורמה"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            תמחור
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            התראות
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            אבטחה
          </TabsTrigger>
        </TabsList>

        {/* Pricing Settings */}
        <TabsContent value="pricing" className="mt-6">
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle>תמחור מנוי</CardTitle>
              <CardDescription>הגדר את תמחור המנוי למסעדות</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">מחיר חודשי</Label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₪</span>
                    <Input
                      id="price"
                      type="number"
                      value={systemSettings?.subscription_price || 499}
                      onChange={(e) => updateSetting('subscription_price', parseInt(e.target.value))}
                      className="pr-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">מטבע</Label>
                  <Input
                    id="currency"
                    value={systemSettings?.currency || 'ILS'}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="trial_days">תקופת ניסיון (ימים)</Label>
                <Input
                  id="trial_days"
                  type="number"
                  value={systemSettings?.trial_days || 14}
                  onChange={(e) => updateSetting('trial_days', parseInt(e.target.value))}
                  className="max-w-[200px]"
                />
                <p className="text-xs text-gray-500">
                  מספר ימים לתקופת ניסיון חינם
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 mt-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Stripe Configuration</CardTitle>
                  <CardDescription>Payment gateway settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Stripe integration requires backend functions to be enabled. 
                  Once enabled, you can configure your Stripe API keys and webhook endpoints.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="border-gray-100">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-[#C5A059]" />
                <div>
                  <CardTitle>כתובות מייל להתראות</CardTitle>
                  <CardDescription>הגדר את כתובות המייל שיקבלו התראות מערכת</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="admin@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                />
                <Button 
                  onClick={handleAddEmail}
                  disabled={updateMutation.isPending}
                  className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 ml-2" />
                      הוסף
                    </>
                  )}
                </Button>
              </div>

              {systemSettings?.notification_emails && systemSettings.notification_emails.length > 0 ? (
                <div className="space-y-2">
                  {systemSettings.notification_emails.map((email, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEmail(email)}
                        disabled={updateMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">לא הוגדרו כתובות מייל</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-100 mt-6">
            <CardHeader>
              <CardTitle>סוגי התראות</CardTitle>
              <CardDescription>בחר אילו אירועים יפעילו שליחת התראות</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-[#0F172A]">הרשמת מסעדה חדשה</p>
                  <p className="text-sm text-gray-500">
                    קבל התראה כאשר מסעדה חדשה מצטרפת לפלטפורמה
                  </p>
                </div>
                <Switch
                  checked={systemSettings?.notify_new_signup || false}
                  onCheckedChange={(checked) => updateSetting('notify_new_signup', checked)}
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-[#0F172A]">כישלון בתשלום</p>
                  <p className="text-sm text-gray-500">
                    קבל התראה כאשר תשלום מנוי נכשל
                  </p>
                </div>
                <Switch
                  checked={systemSettings?.notify_payment_failed || false}
                  onCheckedChange={(checked) => updateSetting('notify_payment_failed', checked)}
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-[#0F172A]">ניסיון שדרוג מנוי</p>
                  <p className="text-sm text-gray-500">
                    קבל התראה כאשר מסעדה מנסה לשדרג או לשנות מנוי
                  </p>
                </div>
                <Switch
                  checked={systemSettings?.notify_subscription_upgrade || false}
                  onCheckedChange={(checked) => updateSetting('notify_subscription_upgrade', checked)}
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[#0F172A]">ביטול מנוי</p>
                  <p className="text-sm text-gray-500">
                    קבל התראה כאשר מסעדה מבטלת את המנוי שלה
                  </p>
                </div>
                <Switch
                  checked={systemSettings?.notify_subscription_canceled || false}
                  onCheckedChange={(checked) => updateSetting('notify_subscription_canceled', checked)}
                  disabled={updateMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">איך זה עובד?</p>
                  <p className="text-sm text-blue-700">
                    כאשר אירוע מתרחש (כגון כישלון בתשלום או ניסיון שדרוג), המערכת תשלח אוטומטית מייל לכל הכתובות שהוגדרו למעלה.
                    ההתראות מגיעות בזמן אמת ומכילות את כל הפרטים הרלוונטיים.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6">
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle>הגדרות אבטחה</CardTitle>
              <CardDescription>הגדרות אבטחה של הפלטפורמה</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">סטטוס אבטחה: פעיל</p>
                    <p className="text-sm text-green-700">
                      כל המידע מוצפן ומועבר בצורה מאובטחת דרך HTTPS.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-[#0F172A]">בקרת גישה</h3>
                <p className="text-sm text-gray-500">
                  רק משתמשים עם הרשאת "admin" יכולים לגשת ללוח הניהול ולנהל הגדרות פלטפורמה.
                  בעלי מסעדות יכולים לראות ולנהל רק את הנתונים שלהם.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}