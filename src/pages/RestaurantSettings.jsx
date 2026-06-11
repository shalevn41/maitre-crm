import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Building2,
  Key,
  Link as LinkIcon,
  Save,
  Copy,
  ExternalLink,
  QrCode,
  Eye,
  EyeOff,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export default function RestaurantSettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showApiKeys, setShowApiKeys] = useState({});
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['my-restaurant', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return null;
      const restaurants = await base44.entities.Restaurant.filter({ id: user.restaurant_id });
      return restaurants[0] || null;
    },
    enabled: !!user?.restaurant_id,
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    welcome_message: '',
    api_keys: {
      twilio_sid: '',
      twilio_auth_token: '',
      twilio_phone_number: '',
      sendgrid_api_key: '',
      sendgrid_from_email: '',
    }
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        city: restaurant.city || '',
        welcome_message: restaurant.welcome_message || "Welcome to our exclusive club! You'll receive special offers and updates.",
        api_keys: {
          twilio_sid: restaurant.api_keys?.twilio_sid || '',
          twilio_auth_token: restaurant.api_keys?.twilio_auth_token || '',
          twilio_phone_number: restaurant.api_keys?.twilio_phone_number || '',
          sendgrid_api_key: restaurant.api_keys?.sendgrid_api_key || '',
          sendgrid_from_email: restaurant.api_keys?.sendgrid_from_email || '',
        }
      });
    }
  }, [restaurant]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Restaurant.update(restaurant.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-restaurant']);
      toast.success('Settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const signupUrl = restaurant?.signup_slug 
    ? `${window.location.origin}/CustomerSignup?r=${restaurant.signup_slug}`
    : `${window.location.origin}/CustomerSignup?id=${restaurant?.id}`;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleApiKeyVisibility = (key) => {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" subtitle="Manage your restaurant settings" />
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" subtitle="Set up your restaurant" />
        <Card className="border-gray-100">
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-2">No Restaurant Found</h3>
            <p className="text-gray-500">
              Your account isn't linked to a restaurant yet. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your restaurant settings and integrations"
        actions={
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="signup" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Sign-up Link
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6">
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle>Restaurant Information</CardTitle>
              <CardDescription>Basic details about your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your Restaurant Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                />
              </div>

              <Separator className="my-6" />

              <div className="space-y-2">
                <Label htmlFor="welcome_message">Welcome Message</Label>
                <Textarea
                  id="welcome_message"
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  placeholder="Message shown to customers after sign-up..."
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  This message is displayed when customers sign up via your public link
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="mt-6 space-y-6">
          {/* Twilio */}
          <Card className="border-gray-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-sm">T</span>
                </div>
                <div>
                  <CardTitle>Twilio</CardTitle>
                  <CardDescription>For SMS and WhatsApp messaging</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twilio_sid">Account SID</Label>
                <div className="relative">
                  <Input
                    id="twilio_sid"
                    type={showApiKeys.twilio_sid ? 'text' : 'password'}
                    value={formData.api_keys.twilio_sid}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      api_keys: { ...formData.api_keys, twilio_sid: e.target.value }
                    })}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => toggleApiKeyVisibility('twilio_sid')}
                  >
                    {showApiKeys.twilio_sid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilio_auth_token">Auth Token</Label>
                <div className="relative">
                  <Input
                    id="twilio_auth_token"
                    type={showApiKeys.twilio_auth_token ? 'text' : 'password'}
                    value={formData.api_keys.twilio_auth_token}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      api_keys: { ...formData.api_keys, twilio_auth_token: e.target.value }
                    })}
                    placeholder="Your Auth Token"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => toggleApiKeyVisibility('twilio_auth_token')}
                  >
                    {showApiKeys.twilio_auth_token ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilio_phone_number">Twilio Phone Number</Label>
                <Input
                  id="twilio_phone_number"
                  value={formData.api_keys.twilio_phone_number}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    api_keys: { ...formData.api_keys, twilio_phone_number: e.target.value }
                  })}
                  placeholder="+1234567890"
                />
              </div>
              <p className="text-xs text-gray-500">
                <a 
                  href="https://www.twilio.com/console" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#C5A059] hover:underline inline-flex items-center gap-1"
                >
                  Get your Twilio credentials
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </CardContent>
          </Card>

          {/* SendGrid */}
          <Card className="border-gray-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">SG</span>
                </div>
                <div>
                  <CardTitle>SendGrid</CardTitle>
                  <CardDescription>For email campaigns</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sendgrid_api_key">API Key</Label>
                <div className="relative">
                  <Input
                    id="sendgrid_api_key"
                    type={showApiKeys.sendgrid_api_key ? 'text' : 'password'}
                    value={formData.api_keys.sendgrid_api_key}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      api_keys: { ...formData.api_keys, sendgrid_api_key: e.target.value }
                    })}
                    placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => toggleApiKeyVisibility('sendgrid_api_key')}
                  >
                    {showApiKeys.sendgrid_api_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sendgrid_from_email">From Email</Label>
                <Input
                  id="sendgrid_from_email"
                  type="email"
                  value={formData.api_keys.sendgrid_from_email}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    api_keys: { ...formData.api_keys, sendgrid_from_email: e.target.value }
                  })}
                  placeholder="noreply@yourrestaurant.com"
                />
              </div>
              <p className="text-xs text-gray-500">
                <a 
                  href="https://app.sendgrid.com/settings/api_keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#C5A059] hover:underline inline-flex items-center gap-1"
                >
                  Get your SendGrid API key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sign-up Link */}
        <TabsContent value="signup" className="mt-6">
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle>Customer Sign-up Link</CardTitle>
              <CardDescription>
                Share this link with your customers or print it as a QR code for table displays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Your Sign-up Page URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={signupUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(signupUrl, 'URL')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                  >
                    <a href={signupUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Preview
                    </a>
                  </Button>
                </div>
              </div>

              <div className="bg-[#F5F7FA] rounded-xl p-6 text-center">
                <QrCode className="w-32 h-32 mx-auto text-[#0F172A] mb-4" strokeWidth={1} />
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code to access the sign-up page
                </p>
                <Button variant="outline" onClick={() => copyToClipboard(signupUrl, 'URL')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link for QR Generator
                </Button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Pro Tip</p>
                    <p className="text-sm text-amber-700">
                      Use a free QR code generator like qr-code-generator.com to create printable QR codes 
                      for table tents, menus, or receipts.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}