import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  MoreHorizontal,
  Copy,
  Phone,
  Mail,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';

export default function Templates() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: templates = [], isLoading } = useQuery({
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
    mutationFn: (data) => base44.entities.MessageTemplate.create({
      ...data,
      restaurant_id: user.restaurant_id,
      is_global: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setShowCreateDialog(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MessageTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setEditingTemplate(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MessageTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setDeleteConfirm(null);
    },
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'sms': return <Phone className="w-3 h-3" />;
      case 'whatsapp': return <MessageCircle className="w-3 h-3" />;
      case 'email': return <Mail className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      promotion: 'bg-purple-50 text-purple-700 border-purple-200',
      event: 'bg-blue-50 text-blue-700 border-blue-200',
      reminder: 'bg-amber-50 text-amber-700 border-amber-200',
      welcome: 'bg-green-50 text-green-700 border-green-200',
      general: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[category] || colors.general;
  };

  const myTemplates = templates.filter(t => !t.is_global);
  const globalTemplates = templates.filter(t => t.is_global);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Message Templates"
        subtitle="Save and reuse message templates"
        actions={
          <Button 
            className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        }
      />

      {/* My Templates */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-[#0F172A]">My Templates</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-gray-100">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : myTemplates.length === 0 ? (
          <Card className="border-gray-100">
            <EmptyState
              icon={FileText}
              title="No templates yet"
              description="Create message templates to save time when creating campaigns"
              action={
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTemplates.map((template) => (
              <Card key={template.id} className="border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-[#0F172A] truncate">{template.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyToClipboard(template.content)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Content
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirm(template)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                    {template.content}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                    {template.channel && template.channel !== 'all' && (
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                        {getChannelIcon(template.channel)}
                        <span className="ml-1 capitalize">{template.channel}</span>
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Global Templates */}
      {globalTemplates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-[#0F172A] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C5A059]" />
            Platform Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalTemplates.map((template) => (
              <Card key={template.id} className="border-gray-100 bg-gradient-to-br from-white to-[#F5F7FA]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-[#0F172A] truncate">{template.name}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 -mr-2"
                      onClick={() => copyToClipboard(template.content)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                    {template.content}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Platform
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Template Dialog */}
      <TemplateDialog
        open={showCreateDialog || !!editingTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingTemplate(null);
          }
        }}
        template={editingTemplate}
        onSave={(data) => {
          if (editingTemplate) {
            updateMutation.mutate({ id: editingTemplate.id, data });
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
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
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

function TemplateDialog({ open, onOpenChange, template, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    channel: 'all',
    category: 'general',
    email_subject: '',
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        content: template.content || '',
        channel: template.channel || 'all',
        category: template.category || 'general',
        email_subject: template.email_subject || '',
      });
    } else {
      setFormData({
        name: '',
        content: '',
        channel: 'all',
        category: 'general',
        email_subject: '',
      });
    }
  }, [template, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            {template ? 'Update your message template' : 'Create a reusable message template'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Weekend Special Offer"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select 
                value={formData.channel} 
                onValueChange={(value) => setFormData({ ...formData, channel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(formData.channel === 'email' || formData.channel === 'all') && (
            <div className="space-y-2">
              <Label htmlFor="email_subject">Email Subject (optional)</Label>
              <Input
                id="email_subject"
                value={formData.email_subject}
                onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                placeholder="Enter default email subject..."
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="content">Message Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your message template here..."
              rows={5}
              required
            />
            <p className="text-xs text-gray-500">
              {formData.content.length} characters
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
              disabled={isLoading || !formData.name || !formData.content}
            >
              {isLoading ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}