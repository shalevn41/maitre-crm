import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  MessageSquare,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  MoreHorizontal,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Users,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import AIAssistant from '@/components/campaigns/AIAssistant';
import AICampaignBuilder from '@/components/campaigns/AICampaignBuilder';
import SmartAIComposer from '@/components/campaigns/SmartAIComposer';
import { format } from 'date-fns';

export default function Campaigns() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const urlParams = new URLSearchParams(window.location.search);
  const shouldOpenNew = urlParams.get('new') === 'true';

  useEffect(() => {
    if (shouldOpenNew) {
      setShowCreateDialog(true);
    }
  }, [shouldOpenNew]);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Message.filter({ restaurant_id: user.restaurant_id }, '-created_date');
    },
    enabled: !!user?.restaurant_id,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Customer.filter({ restaurant_id: user.restaurant_id });
    },
    enabled: !!user?.restaurant_id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      const [userTemplates, globalTemplates] = await Promise.all([
        base44.entities.MessageTemplate.filter({ restaurant_id: user.restaurant_id }),
        base44.entities.MessageTemplate.filter({ is_global: true })
      ]);
      return [...userTemplates, ...globalTemplates];
    },
    enabled: !!user?.restaurant_id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create({
      ...data,
      restaurant_id: user.restaurant_id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      setShowCreateDialog(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Message.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      setEditingCampaign(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      setDeleteConfirm(null);
    },
  });

  const filteredCampaigns = campaigns.filter(c => 
    statusFilter === 'all' || c.status === statusFilter
  );

  const getStatusBadge = (status) => {
    const styles = {
      sent: 'bg-green-50 text-green-700 border-green-200',
      scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
      draft: 'bg-gray-50 text-gray-700 border-gray-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      sending: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return styles[status] || styles.draft;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="w-3 h-3" />;
      case 'scheduled': return <Clock className="w-3 h-3" />;
      case 'failed': return <AlertCircle className="w-3 h-3" />;
      case 'sending': return <Send className="w-3 h-3" />;
      default: return null;
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'sms': return <Phone className="w-4 h-4" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getChannelLabel = (channel) => {
    return { sms: 'SMS', whatsapp: 'WhatsApp', email: 'Email' }[channel] || channel;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        subtitle="Create and manage your marketing campaigns"
        actions={
          <Button 
            className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        }
      />

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-full max-w-md mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="border-gray-100">
          <EmptyState
            icon={MessageSquare}
            title={statusFilter !== 'all' ? "No campaigns found" : "No campaigns yet"}
            description={statusFilter !== 'all' 
              ? `You don't have any ${statusFilter} campaigns` 
              : "Create your first campaign to start engaging with customers"
            }
            action={
              statusFilter === 'all' && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#F5F7FA] flex items-center justify-center flex-shrink-0">
                    {getChannelIcon(campaign.channel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-[#0F172A] truncate">
                          {campaign.name || 'Untitled Campaign'}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {campaign.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={getStatusBadge(campaign.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </span>
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {campaign.status === 'draft' && (
                              <DropdownMenuItem onClick={() => setEditingCampaign(campaign)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirm(campaign)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {getChannelIcon(campaign.channel)}
                        {getChannelLabel(campaign.channel)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {campaign.recipient_count || 0} recipients
                      </span>
                      {campaign.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(campaign.scheduled_date), 'MMM d, h:mm a')}
                        </span>
                      )}
                      <span>
                        Created {format(new Date(campaign.created_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Campaign Dialog */}
      <CampaignDialog
        open={showCreateDialog || !!editingCampaign}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingCampaign(null);
          }
        }}
        campaign={editingCampaign}
        customers={customers}
        templates={templates}
        onSave={(data) => {
          if (editingCampaign) {
            updateMutation.mutate({ id: editingCampaign.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignDialog({ open, onOpenChange, campaign, customers, templates, onSave, isLoading }) {
  const [step, setStep] = useState(0); // Start at 0 for AI builder
  const [restaurant, setRestaurant] = useState(null);
  const [showAIBuilder, setShowAIBuilder] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    channel: 'sms',
    content: '',
    email_subject: '',
    recipient_type: 'all',
    recipient_ids: [],
    status: 'draft',
    scheduled_date: '',
  });

  useEffect(() => {
    const fetchRestaurant = async () => {
      const user = await base44.auth.me();
      if (user?.restaurant_id) {
        const restaurants = await base44.entities.Restaurant.filter({ id: user.restaurant_id });
        setRestaurant(restaurants[0] || null);
      }
    };
    fetchRestaurant();
  }, []);

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        channel: campaign.channel || 'sms',
        content: campaign.content || '',
        email_subject: campaign.email_subject || '',
        recipient_type: campaign.recipient_type || 'all',
        recipient_ids: campaign.recipient_ids || [],
        status: campaign.status || 'draft',
        scheduled_date: campaign.scheduled_date || '',
      });
      setShowAIBuilder(false);
      setStep(1);
    } else {
      setFormData({
        name: '',
        channel: 'sms',
        content: '',
        email_subject: '',
        recipient_type: 'all',
        recipient_ids: [],
        status: 'draft',
        scheduled_date: '',
      });
      setShowAIBuilder(true);
      setStep(0);
    }
  }, [campaign, open]);

  const handleAICampaignGenerated = (aiData) => {
    setFormData({
      ...formData,
      ...aiData
    });
    setShowAIBuilder(false);
    setStep(4); // Skip to review since AI filled everything
  };

  const skipAIBuilder = () => {
    setShowAIBuilder(false);
    setStep(1);
  };

  const handleSubmit = (sendNow = false) => {
    const recipientCount = formData.recipient_type === 'all' 
      ? customers.length 
      : formData.recipient_ids.length;

    onSave({
      ...formData,
      status: sendNow ? 'sending' : formData.scheduled_date ? 'scheduled' : 'draft',
      recipient_count: recipientCount,
    });
  };

  const loadTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        content: template.content,
        email_subject: template.email_subject || formData.email_subject,
      });
    }
  };

  const toggleRecipient = (customerId) => {
    setFormData(prev => ({
      ...prev,
      recipient_ids: prev.recipient_ids.includes(customerId)
        ? prev.recipient_ids.filter(id => id !== customerId)
        : [...prev.recipient_ids, customerId]
    }));
  };

  const recipientCount = formData.recipient_type === 'all' 
    ? customers.length 
    : formData.recipient_ids.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
          <DialogDescription>
            {step === 0 && "Use AI to generate your campaign automatically"}
            {step === 1 && "Set up your campaign details"}
            {step === 2 && "Select your recipients"}
            {step === 3 && "Compose your message"}
            {step === 4 && "Review and send"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps - only show if past AI builder */}
        {!showAIBuilder && (
          <div className="flex items-center gap-2 py-4 border-b">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <button
                  onClick={() => setStep(s)}
                  disabled={step === 0}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === s 
                      ? 'bg-[#C5A059] text-white' 
                      : step > s 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </button>
                {s < 4 && (
                  <div className={`flex-1 h-0.5 ${step > s ? 'bg-green-200' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 0: AI Builder */}
          {step === 0 && showAIBuilder && (
            <AICampaignBuilder
              restaurant={restaurant}
              customers={customers}
              onCampaignGenerated={handleAICampaignGenerated}
              onSkip={skipAIBuilder}
            />
          )}
          {/* Step 1: Campaign Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekend Special Offer"
                />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'sms', label: 'SMS', icon: Phone },
                    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                    { value: 'email', label: 'Email', icon: Mail },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, channel: value })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.channel === value 
                          ? 'border-[#C5A059] bg-[#C5A059]/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${
                        formData.channel === value ? 'text-[#C5A059]' : 'text-gray-400'
                      }`} />
                      <p className={`text-sm font-medium ${
                        formData.channel === value ? 'text-[#C5A059]' : 'text-gray-600'
                      }`}>{label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Recipients */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recipients</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recipient_type: 'all', recipient_ids: [] })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.recipient_type === 'all' 
                        ? 'border-[#C5A059] bg-[#C5A059]/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className={`w-5 h-5 mb-2 ${
                      formData.recipient_type === 'all' ? 'text-[#C5A059]' : 'text-gray-400'
                    }`} />
                    <p className="font-medium text-sm">All Customers</p>
                    <p className="text-xs text-gray-500">{customers.length} customers</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recipient_type: 'selected' })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.recipient_type === 'selected' 
                        ? 'border-[#C5A059] bg-[#C5A059]/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 mb-2 ${
                      formData.recipient_type === 'selected' ? 'text-[#C5A059]' : 'text-gray-400'
                    }`} />
                    <p className="font-medium text-sm">Select Specific</p>
                    <p className="text-xs text-gray-500">Choose customers</p>
                  </button>
                </div>
              </div>

              {formData.recipient_type === 'selected' && (
                <div className="space-y-2">
                  <Label>Select Customers ({formData.recipient_ids.length} selected)</Label>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {customers.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 text-center">No customers available</p>
                    ) : (
                      <div className="divide-y">
                        {customers.map((customer) => (
                          <label
                            key={customer.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <Checkbox
                              checked={formData.recipient_ids.includes(customer.id)}
                              onCheckedChange={() => toggleRecipient(customer.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{customer.full_name}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {customer.email || customer.phone}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Compose */}
          {step === 3 && (
            <div className="space-y-4">
              {/* AI Assistant */}
              <AIAssistant
                restaurant={restaurant}
                formData={formData}
                customers={customers}
                onApplySuggestion={(updates) => setFormData({ ...formData, ...updates })}
              />

              {/* Smart AI Composer - Rewrite with AI */}
              <SmartAIComposer
                currentMessage={formData.content}
                channel={formData.channel}
                restaurant={restaurant}
                onApply={(newContent) => setFormData({ ...formData, content: newContent })}
              />

              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label>Load Template</Label>
                  <Select onValueChange={loadTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.channel === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="email_subject">Email Subject</Label>
                  <Input
                    id="email_subject"
                    value={formData.email_subject}
                    onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                    placeholder="Enter email subject..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your message here..."
                  rows={6}
                />
                <p className="text-xs text-gray-500">
                  {formData.content.length} characters
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-[#F5F7FA] rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Campaign</span>
                  <span className="text-sm font-medium">{formData.name || 'Untitled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Channel</span>
                  <span className="text-sm font-medium capitalize">{formData.channel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Recipients</span>
                  <span className="text-sm font-medium">{recipientCount} customers</span>
                </div>
              </div>

              {/* AI Timing Suggestion */}
              {formData.ai_metadata?.suggested_timing && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 mb-1">
                        AI Recommendation: {formData.ai_metadata.suggested_timing.day} at {formData.ai_metadata.suggested_timing.time}
                      </p>
                      <p className="text-xs text-purple-700">
                        {formData.ai_metadata.suggested_timing.reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-xl p-4 bg-white">
                  {formData.channel === 'email' && formData.email_subject && (
                    <p className="text-sm font-medium mb-2">Subject: {formData.email_subject}</p>
                  )}
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.content}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Scheduling</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scheduled_date: '' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      !formData.scheduled_date 
                        ? 'border-[#C5A059] bg-[#C5A059]/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Send className="w-4 h-4 mb-1 text-[#C5A059]" />
                    <p className="text-sm font-medium">Send Now</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scheduled_date: new Date().toISOString() })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      formData.scheduled_date 
                        ? 'border-[#C5A059] bg-[#C5A059]/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Calendar className="w-4 h-4 mb-1 text-gray-400" />
                    <p className="text-sm font-medium">Schedule</p>
                  </button>
                </div>
              </div>

              {formData.scheduled_date && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Schedule Date & Time</Label>
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    value={formData.scheduled_date ? format(new Date(formData.scheduled_date), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: new Date(e.target.value).toISOString() })}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {step > 1 && !showAIBuilder && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step === 0 ? null : step < 4 ? (
            <Button 
              onClick={() => setStep(step + 1)}
              className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
              disabled={step === 2 && formData.recipient_type === 'selected' && formData.recipient_ids.length === 0}
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={isLoading || !formData.content}
              >
                Save as Draft
              </Button>
              <Button 
                onClick={() => handleSubmit(!formData.scheduled_date)}
                className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
                disabled={isLoading || !formData.content || recipientCount === 0}
              >
                {isLoading ? 'Saving...' : formData.scheduled_date ? 'Schedule' : 'Send Now'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}