import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Ban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Users,
  MessageSquare,
  ExternalLink,
  Eye,
  Send,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';

export default function AdminRestaurants() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusChangeConfirm, setStatusChangeConfirm] = useState(null);
  const [contactDialog, setContactDialog] = useState(null);
  const [viewDetailsDialog, setViewDetailsDialog] = useState(null);

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list('-created_date'),
  });

  const { data: allCustomers = [] } = useQuery({
    queryKey: ['all-customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['all-messages'],
    queryFn: () => base44.entities.Message.list(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Restaurant.create({
      ...data,
      subscription_status: 'trial',
      signup_slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-restaurants']);
      setShowAddDialog(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Restaurant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-restaurants']);
      setEditingRestaurant(null);
      setStatusChangeConfirm(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Restaurant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-restaurants']);
      setDeleteConfirm(null);
    },
  });



  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = 
      restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.owner_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || restaurant.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCustomerCount = (restaurantId) => {
    return allCustomers.filter(c => c.restaurant_id === restaurantId).length;
  };

  const getMessageCount = (restaurantId) => {
    return allMessages.filter(m => m.restaurant_id === restaurantId).length;
  };

  const getOwnerName = (ownerEmail) => {
    const owner = allUsers.find(u => u.email === ownerEmail);
    return owner?.full_name || 'לא ידוע';
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
      trial: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
      past_due: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle },
      canceled: { color: 'bg-red-50 text-red-700 border-red-200', icon: Ban },
    };
    const config = styles[status] || styles.trial;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurants"
        subtitle={`${restaurants.length} total restaurants`}
        actions={
          <Button 
            className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Restaurant
          </Button>
        }
      />

      {/* Filters */}
      <Card className="border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Restaurants List */}
      {isLoading ? (
        <Card className="border-gray-100">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredRestaurants.length === 0 ? (
        <Card className="border-gray-100">
          <EmptyState
            icon={Building2}
            title={searchQuery || statusFilter !== 'all' ? "No restaurants found" : "No restaurants yet"}
            description={searchQuery || statusFilter !== 'all' 
              ? "Try adjusting your search or filters" 
              : "Add your first restaurant to get started"
            }
            action={
              !searchQuery && statusFilter === 'all' && (
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Restaurant
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Card className="border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F7FA] border-b border-gray-100">
                <tr>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">מסעדה</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">בעלים</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">מייל</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">סטטיסטיקות</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">סטטוס</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRestaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] flex items-center justify-center flex-shrink-0">
                          {restaurant.logo_url ? (
                            <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0F172A] truncate">{restaurant.name}</p>
                          <p className="text-xs text-gray-500 sm:hidden truncate">{restaurant.owner_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {getOwnerName(restaurant.owner_email)}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="truncate max-w-[200px]">{restaurant.owner_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {getCustomerCount(restaurant.id)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(restaurant.subscription_status)}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setViewDetailsDialog(restaurant)}
                          className="text-[#C5A059] border-[#C5A059] hover:bg-[#C5A059]/10"
                        >
                          <Eye className="w-3 h-3 ml-1" />
                          צפה
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setContactDialog(restaurant)}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Users className="w-3 h-3 ml-1" />
                          פרטי קשר
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingRestaurant(restaurant)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              ערוך
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatusChangeConfirm({ restaurant, newStatus: 'active' })}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                              הפעל
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusChangeConfirm({ restaurant, newStatus: 'canceled' })}>
                              <Ban className="w-4 h-4 mr-2 text-red-600" />
                              בטל מנוי
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirm(restaurant)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              מחק
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Restaurant Dialog */}
      <RestaurantDialog
        open={showAddDialog || !!editingRestaurant}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingRestaurant(null);
          }
        }}
        restaurant={editingRestaurant}
        onSave={(data) => {
          if (editingRestaurant) {
            updateMutation.mutate({ id: editingRestaurant.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Status Change Confirmation */}
      <Dialog open={!!statusChangeConfirm} onOpenChange={(open) => !open && setStatusChangeConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to set "{statusChangeConfirm?.restaurant?.name}" subscription status to "{statusChangeConfirm?.newStatus}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeConfirm(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateMutation.mutate({ 
                id: statusChangeConfirm.restaurant.id, 
                data: { subscription_status: statusChangeConfirm.newStatus }
              })}
              disabled={updateMutation.isPending}
              className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחק מסעדה</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את "{deleteConfirm?.name}"? פעולה זו תמחק גם את כל הלקוחות והקמפיינים הקשורים. פעולה זו אינה ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              ביטול
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Info Dialog */}
      <Dialog open={!!contactDialog} onOpenChange={(open) => !open && setContactDialog(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>פרטי בעל המסעדה</DialogTitle>
            <DialogDescription>
              פרטי קשר של {contactDialog?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-[#F5F7FA] rounded-lg">
              <Users className="w-5 h-5 text-[#C5A059]" />
              <div>
                <p className="text-xs text-gray-500">שם מלא</p>
                <p className="text-sm font-medium text-[#0F172A]">{getOwnerName(contactDialog?.owner_email)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#F5F7FA] rounded-lg">
              <Mail className="w-5 h-5 text-[#C5A059]" />
              <div>
                <p className="text-xs text-gray-500">מייל</p>
                <p className="text-sm font-medium text-[#0F172A]">{contactDialog?.owner_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#F5F7FA] rounded-lg">
              <Phone className="w-5 h-5 text-[#C5A059]" />
              <div>
                <p className="text-xs text-gray-500">טלפון</p>
                <p className="text-sm font-medium text-[#0F172A]">{contactDialog?.phone || 'לא צוין'}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialog(null)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewDetailsDialog} onOpenChange={(open) => !open && setViewDetailsDialog(null)}>
        <DialogContent dir="rtl" className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>פרטים מפורטים - {viewDetailsDialog?.name}</DialogTitle>
            <DialogDescription>
              מידע מלא על המסעדה והפעילות שלה במערכת
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-blue-600 font-medium">חברי מועדון</p>
                </div>
                <p className="text-2xl font-bold text-[#0F172A]">{getCustomerCount(viewDetailsDialog?.id)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">מסעות פרסום</p>
                </div>
                <p className="text-2xl font-bold text-[#0F172A]">{getMessageCount(viewDetailsDialog?.id)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                <span className="text-sm text-gray-600">סטטוס מנוי</span>
                <span className="font-medium text-[#0F172A]">{viewDetailsDialog?.subscription_status}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                <span className="text-sm text-gray-600">תשלום חודשי</span>
                <span className="font-medium text-[#0F172A]">₪499</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                <span className="text-sm text-gray-600">תאריך הצטרפות</span>
                <span className="font-medium text-[#0F172A]">
                  {viewDetailsDialog && format(new Date(viewDetailsDialog.created_date), 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                <span className="text-sm text-gray-600">עיר</span>
                <span className="font-medium text-[#0F172A]">{viewDetailsDialog?.city || 'לא צוין'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                <span className="text-sm text-gray-600">כתובת</span>
                <span className="font-medium text-[#0F172A]">{viewDetailsDialog?.address || 'לא צוין'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                <span className="text-sm text-gray-600">טלפון מסעדה</span>
                <span className="font-medium text-[#0F172A]">{viewDetailsDialog?.phone || 'לא צוין'}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailsDialog(null)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RestaurantDialog({ open, onOpenChange, restaurant, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    owner_email: '',
    phone: '',
    city: '',
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        owner_email: restaurant.owner_email || '',
        phone: restaurant.phone || '',
        city: restaurant.city || '',
      });
    } else {
      setFormData({
        name: '',
        owner_email: '',
        phone: '',
        city: '',
      });
    }
  }, [restaurant, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{restaurant ? 'Edit Restaurant' : 'Add Restaurant'}</DialogTitle>
          <DialogDescription>
            {restaurant ? 'Update restaurant information' : 'Add a new restaurant to the platform'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Restaurant Name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_email">Owner Email *</Label>
            <Input
              id="owner_email"
              type="email"
              value={formData.owner_email}
              onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
              placeholder="owner@restaurant.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 890"
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
              disabled={isLoading || !formData.name || !formData.owner_email}
            >
              {isLoading ? 'Saving...' : restaurant ? 'Save Changes' : 'Add Restaurant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}