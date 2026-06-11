import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Plus, Trash2, Edit2, Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, QrCode, Download, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import WaiterQRDialog from '@/components/waiters/WaiterQRDialog';
import { format } from 'date-fns';

export default function Waiters() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [waiterName, setWaiterName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('created_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedWaiterForQR, setSelectedWaiterForQR] = useState(null);
  const [showMonthlyStats, setShowMonthlyStats] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: waiters = [], isLoading, refetch } = useQuery({
    queryKey: ['waiters', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Waiter.filter({ restaurant_id: user.restaurant_id }, '-signup_count');
    },
    enabled: !!user?.restaurant_id,
  });

  const { data: monthlyStats = [] } = useQuery({
    queryKey: ['waiter-monthly-stats', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.WaiterMonthlyStats.filter({ restaurant_id: user.restaurant_id }, '-year,-month');
    },
    enabled: !!user?.restaurant_id,
  });

  const addWaiterMutation = useMutation({
    mutationFn: async (waiterData) => {
      return await base44.entities.Waiter.create(waiterData);
    },
    onSuccess: async () => {
      await refetch();
      setWaiterName('');
      setShowAddDialog(false);
      toast.success('מלצר נוסף בהצלחה!');
    },
    onError: (error) => {
      console.error('Error creating waiter:', error);
      toast.error('שגיאה ביצירת מלצר');
    }
  });

  const handleAddWaiter = () => {
    if (!waiterName.trim() || !user?.restaurant_id) {
      toast.error('אנא הזן שם מלצר');
      return;
    }
    
    addWaiterMutation.mutate({
      restaurant_id: user.restaurant_id,
      name: waiterName.trim(),
      signup_count: 0
    });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Waiter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['waiters']);
      setShowEditDialog(false);
      setSelectedWaiter(null);
      toast.success('פרטי מלצר עודכנו בהצלחה!');
    },
    onError: (error) => {
      toast.error('שגיאה בעדכון פרטים');
      console.error(error);
    }
  });

  const handleEditWaiter = (updatedData) => {
    if (!selectedWaiter) return;
    updateMutation.mutate({ id: selectedWaiter.id, data: updatedData });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Waiter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['waiters']);
      toast.success('מלצר הוסר בהצלחה');
    },
  });

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return null;
      const restaurants = await base44.entities.Restaurant.filter({ id: user.restaurant_id });
      return restaurants[0] || null;
    },
    enabled: !!user?.restaurant_id,
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 mr-1" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 mr-1" /> 
      : <ArrowDown className="w-4 h-4 mr-1" />;
  };

  const filteredAndSortedWaiters = waiters
    .filter(waiter => 
      waiter.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let compareA, compareB;
      
      // Always sort by signup_count first (descending)
      const signupDiff = (b.signup_count || 0) - (a.signup_count || 0);
      if (signupDiff !== 0) return signupDiff;
      
      // Then apply user's sort preference as secondary sort
      if (sortField === 'name') {
        compareA = a.name.toLowerCase();
        compareB = b.name.toLowerCase();
      } else if (sortField === 'created_date') {
        compareA = new Date(a.created_date);
        compareB = new Date(b.created_date);
      } else if (sortField === 'signup_count') {
        compareA = a.signup_count || 0;
        compareB = b.signup_count || 0;
      }
      
      if (sortDirection === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="ניהול צוות"
        subtitle="ניהול רשימת מלצרים ומעקב אחר ביצועים"
        actions={
          <div className="flex gap-2">
            {monthlyStats.length > 0 && (
              <Button 
                onClick={() => setShowMonthlyStats(!showMonthlyStats)}
                variant="outline"
                className="border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10"
              >
                סטטיסטיקות חודשיות
              </Button>
            )}
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
            >
              <Plus className="w-4 h-4 ml-2" />
              הוסף מלצר חדש
            </Button>
          </div>
        }
      />

      {/* Search Bar */}
      <Card className="border-gray-100">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="חיפוש מלצר לפי שם..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Waiters Table */}
      <Card className="border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F7FA] border-b border-gray-100">
              <tr>
                <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center hover:text-[#C5A059] transition-colors"
                  >
                    {getSortIcon('name')}
                    שם המלצר
                  </button>
                </th>
                <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">
                  <button 
                    onClick={() => handleSort('created_date')}
                    className="flex items-center hover:text-[#C5A059] transition-colors"
                  >
                    {getSortIcon('created_date')}
                    תאריך הצטרפות
                  </button>
                </th>
                <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">
                  <button 
                    onClick={() => handleSort('signup_count')}
                    className="flex items-center hover:text-[#C5A059] transition-colors"
                  >
                    {getSortIcon('signup_count')}
                    כמות הרשמות
                  </button>
                </th>
                <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : filteredAndSortedWaiters.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center">
                    <p className="text-sm text-gray-500">
                      {searchQuery ? 'לא נמצאו מלצרים התואמים לחיפוש' : 'אין מלצרים להצגה'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedWaiters.map((waiter) => (
                  <tr key={waiter.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={createPageUrl('WaiterProfile') + '?id=' + waiter.id} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">
                            {waiter.name?.[0]?.toUpperCase() || 'M'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[#0F172A]">{waiter.name}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {format(new Date(waiter.created_date), 'dd/MM/yyyy')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {waiter.signup_count}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={createPageUrl('WaiterProfile') + '?id=' + waiter.id}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white hover:bg-[#C5A059]/10 hover:border-[#C5A059] hover:text-[#C5A059]"
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            פרופיל
                          </Button>
                        </Link>
                        <Button
                          onClick={() => setSelectedWaiterForQR(waiter)}
                          size="sm"
                          variant="outline"
                          className="bg-white hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
                        >
                          <QrCode className="w-4 h-4 ml-2" />
                          QR
                        </Button>
                        <Button
                          onClick={() => deleteMutation.mutate(waiter.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Waiter Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>הוסף מלצר חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם המלצר</Label>
              <Input
                id="name"
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                placeholder="לדוגמה: יוסי כהן"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && waiterName.trim()) {
                    handleAddWaiter();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleAddWaiter}
              disabled={!waiterName.trim() || addWaiterMutation.isPending}
              className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
            >
              {addWaiterMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מוסיף...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Waiter Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ערוך פרטי מלצר</DialogTitle>
          </DialogHeader>
          <EditWaiterForm
            waiter={selectedWaiter}
            onSave={handleEditWaiter}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      {selectedWaiterForQR && (
        <WaiterQRDialog 
          waiter={selectedWaiterForQR}
          restaurant={restaurant}
          onClose={() => setSelectedWaiterForQR(null)}
        />
      )}

      {/* Monthly Stats */}
      {showMonthlyStats && monthlyStats.length > 0 && (
        <Card className="border-gray-100 mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0F172A]">סטטיסטיקות חודשיות</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowMonthlyStats(false)}>
                סגור
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F7FA] border-b border-gray-100">
                  <tr>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">חודש</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">מלצר</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">כמות הרשמות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthlyStats.map((stat) => {
                    const waiter = waiters.find(w => w.id === stat.waiter_id);
                    return (
                      <tr key={stat.id}>
                        <td className="px-4 py-3 text-sm text-gray-600">{stat.month_label}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#0F172A]">{waiter?.name || 'לא ידוע'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {stat.signup_count}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EditWaiterForm({ waiter, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: waiter?.name || '',
    notes: waiter?.notes || ''
  });

  useEffect(() => {
    if (waiter) {
      setFormData({
        name: waiter.name || '',
        notes: waiter.notes || ''
      });
    }
  }, [waiter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">שם המלצר</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="שם המלצר"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-notes">הערות</Label>
        <Textarea
          id="edit-notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="הערות או תגיות למלצר זה..."
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button 
          type="submit" 
          className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
          disabled={!formData.name.trim()}
        >
          שמור שינויים
        </Button>
      </DialogFooter>
    </form>
  );
}