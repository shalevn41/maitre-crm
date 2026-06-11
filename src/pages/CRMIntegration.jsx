import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Cloud, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  RefreshCw, 
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import { format } from 'date-fns';

export default function CRMIntegration() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedCRM, setSelectedCRM] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: integrations = [] } = useQuery({
    queryKey: ['crm-integrations', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.CRMIntegration.filter({ restaurant_id: user.restaurant_id });
    },
    enabled: !!user?.restaurant_id,
  });

  const connectMutation = useMutation({
    mutationFn: async (crmType) => {
      const existing = integrations.find(i => i.crm_type === crmType);
      const data = {
        is_connected: true,
        connection_details: { connected_at: new Date().toISOString() }
      };
      
      if (existing) {
        return await base44.entities.CRMIntegration.update(existing.id, data);
      }
      return await base44.entities.CRMIntegration.create({
        restaurant_id: user.restaurant_id,
        crm_type: crmType,
        ...data,
        sync_fields: {
          full_name: true,
          phone: true,
          email: true,
          source: true,
          referred_by: true
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['crm-integrations']);
      setWizardStep(2);
      toast.success('החיבור הושלם בהצלחה!');
    },
    onError: (error) => {
      console.error('Connection error:', error);
      toast.error('שגיאה בחיבור ל-CRM. נסה שוב.');
    }
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async ({ crmType, data }) => {
      const existing = integrations.find(i => i.crm_type === crmType);
      if (existing) {
        return await base44.entities.CRMIntegration.update(existing.id, data);
      }
      return await base44.entities.CRMIntegration.create({
        restaurant_id: user.restaurant_id,
        crm_type: crmType,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['crm-integrations']);
      toast.success('הגדרות עודכנו בהצלחה');
    },
  });

  const handleFieldToggle = (field, value) => {
    const integration = integrations.find(i => i.crm_type === selectedCRM);
    const newSyncFields = {
      ...(integration?.sync_fields || {}),
      [field]: value
    };
    
    createOrUpdateMutation.mutate({
      crmType: selectedCRM,
      data: { sync_fields: newSyncFields }
    });
  };

  const handleAutoSyncToggle = (value) => {
    createOrUpdateMutation.mutate({
      crmType: selectedCRM,
      data: { auto_sync: value }
    });
  };

  const handleSyncDirectionChange = (value) => {
    createOrUpdateMutation.mutate({
      crmType: selectedCRM,
      data: { sync_direction: value }
    });
  };

  const handleConnect = () => {
    connectMutation.mutate(selectedCRM);
  };

  const crmPlatforms = [
    {
      type: 'hubspot',
      name: 'HubSpot',
      description: 'מערכת CRM מקצועית לניהול לקוחות ושיווק',
      icon: '🟠',
      color: 'orange',
      features: ['ניהול אנשי קשר', 'אוטומציות שיווק', 'דוחות ואנליטיקס']
    },
    {
      type: 'salesforce',
      name: 'Salesforce',
      description: 'פלטפורמת CRM מובילה בעולם למכירות ושירות',
      icon: '⚡',
      color: 'blue',
      features: ['ניהול מכירות', 'שירות לקוחות', 'אינטגרציות רבות']
    }
  ];

  const syncFields = [
    { key: 'full_name', label: 'שם מלא' },
    { key: 'phone', label: 'טלפון' },
    { key: 'email', label: 'אימייל' },
    { key: 'city', label: 'עיר' },
    { key: 'address', label: 'כתובת' },
    { key: 'date_of_birth', label: 'תאריך לידה' },
    { key: 'source', label: 'מקור הרשמה' },
    { key: 'referred_by', label: 'הופנה על ידי' }
  ];

  const currentIntegration = integrations.find(i => i.crm_type === selectedCRM);
  const isConnected = currentIntegration?.is_connected || false;

  // If there are connected integrations and wizard is closed, show management view
  const connectedIntegrations = integrations.filter(i => i.is_connected);
  if (connectedIntegrations.length > 0 && wizardStep === 0 && !selectedCRM) {
    return (
      <div className="space-y-6" dir="rtl">
        <PageHeader
          title="אינטגרציית CRM"
          subtitle="ניהול חיבורי CRM והגדרות סנכרון"
          actions={
            <Button 
              onClick={() => setWizardStep(0)}
              className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
            >
              <Cloud className="w-4 h-4 ml-2" />
              חבר CRM נוסף
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connectedIntegrations.map((integration) => {
            const platform = crmPlatforms.find(p => p.type === integration.crm_type);
            
            return (
              <Card key={integration.id} className="border-gray-100">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{platform?.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{platform?.name}</CardTitle>
                        <Badge className="bg-green-100 text-green-700 border-green-200 mt-2">
                          <CheckCircle2 className="w-3 h-3 ml-1" />
                          מחובר
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedCRM(integration.crm_type);
                        setWizardStep(2);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="w-4 h-4 ml-2" />
                      הגדרות
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">סנכרון אוטומטי</Label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {integration.auto_sync ? 'פעיל' : 'כבוי'}
                      </p>
                    </div>
                    <Badge variant={integration.auto_sync ? "default" : "outline"}>
                      {integration.auto_sync ? 'מופעל' : 'מושבת'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">כיוון סנכרון</Label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {integration.sync_direction === 'two_way' ? 'דו-כיווני' : 'חד-כיווני'}
                      </p>
                    </div>
                  </div>

                  {integration.last_sync_date && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        סנכרון אחרון: {format(new Date(integration.last_sync_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="חיבור מערכת CRM"
        subtitle="חבר את המערכת ל-CRM שלך לסנכרון אוטומטי של לקוחות"
      />

      {/* Progress Steps */}
      <Card className="border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {['בחירת CRM', 'חיבור', 'הגדרות'].map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index < wizardStep 
                      ? 'bg-green-500 text-white' 
                      : index === wizardStep 
                        ? 'bg-[#C5A059] text-white' 
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index < wizardStep ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={`text-sm font-medium ${
                    index <= wizardStep ? 'text-[#0F172A]' : 'text-gray-400'
                  }`}>
                    {step}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    index < wizardStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select CRM */}
      {wizardStep === 0 && (
        <div className="space-y-6">
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle>בחר את מערכת ה-CRM שלך</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crmPlatforms.map((platform) => (
                  <button
                    key={platform.type}
                    onClick={() => {
                      setSelectedCRM(platform.type);
                      setWizardStep(1);
                    }}
                    className="p-6 rounded-xl border-2 border-gray-200 hover:border-[#C5A059] hover:bg-[#C5A059]/5 transition-all text-right"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{platform.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-[#0F172A] mb-2">
                          {platform.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {platform.description}
                        </p>
                        <div className="space-y-1">
                          {platform.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Connect */}
      {wizardStep === 1 && selectedCRM && (
        <div className="space-y-6">
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle>
                חיבור ל-{crmPlatforms.find(p => p.type === selectedCRM)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Info about connection */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      מה יקרה עכשיו?
                    </p>
                    <p className="text-sm text-blue-700">
                      נפתח חלון חדש לאישור החיבור ל-{crmPlatforms.find(p => p.type === selectedCRM)?.name}.
                      תצטרך להתחבר לחשבון שלך ולאשר את ההרשאות.
                    </p>
                  </div>
                </div>
              </div>

              {/* What will be synced */}
              <div>
                <h4 className="font-medium text-[#0F172A] mb-3">מה יסונכרן?</h4>
                <div className="space-y-2">
                  {syncFields.slice(0, 5).map((field) => (
                    <div key={field.key} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      {field.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Connect Button */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={() => setWizardStep(0)}
                  variant="outline"
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  חזור
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={connectMutation.isPending}
                  className="flex-1 bg-[#C5A059] hover:bg-[#B8934D] text-white"
                >
                  {connectMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      מתחבר...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4 ml-2" />
                      התחבר ל-{crmPlatforms.find(p => p.type === selectedCRM)?.name}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Configure Sync Settings */}
      {wizardStep === 2 && selectedCRM && currentIntegration && (
        <div className="space-y-6">
          <Card className="border-gray-100">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle>הגדרות סנכרון</CardTitle>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 ml-1" />
                  מחובר
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Sync Direction */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">כיוון סנכרון</Label>
                <div className="space-y-2">
                  <button
                    onClick={() => handleSyncDirectionChange('one_way')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-right ${
                      currentIntegration.sync_direction === 'one_way'
                        ? 'border-[#C5A059] bg-[#C5A059]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm text-[#0F172A] mb-1">חד-כיווני</p>
                    <p className="text-xs text-gray-500">סנכרון מהמערכת ל-CRM בלבד</p>
                  </button>
                  <button
                    onClick={() => handleSyncDirectionChange('two_way')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-right ${
                      currentIntegration.sync_direction === 'two_way'
                        ? 'border-[#C5A059] bg-[#C5A059]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm text-[#0F172A] mb-1">דו-כיווני</p>
                    <p className="text-xs text-gray-500">סנכרון בשני הכיוונים</p>
                  </button>
                </div>
              </div>

              {/* Auto Sync */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">סנכרון אוטומטי</Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    סנכרן לקוחות חדשים באופן אוטומטי
                  </p>
                </div>
                <Switch
                  checked={currentIntegration.auto_sync || false}
                  onCheckedChange={handleAutoSyncToggle}
                />
              </div>

              {/* Sync Fields */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">שדות לסנכרון</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {syncFields.map((field) => (
                    <div 
                      key={field.key} 
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                    >
                      <Label htmlFor={`field-${field.key}`} className="text-sm cursor-pointer">
                        {field.label}
                      </Label>
                      <Switch
                        id={`field-${field.key}`}
                        checked={currentIntegration.sync_fields?.[field.key] || false}
                        onCheckedChange={(checked) => handleFieldToggle(field.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <Button
                  onClick={() => {
                    setWizardStep(0);
                    setSelectedCRM(null);
                  }}
                  variant="outline"
                >
                  סיים
                </Button>
                <div className="flex-1 text-sm text-gray-500 text-center">
                  ההגדרות נשמרות אוטומטית
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}