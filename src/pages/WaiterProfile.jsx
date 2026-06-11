import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowRight,
  Edit2,
  Save,
  X,
  User,
  Calendar,
  TrendingUp,
  Users,
  Loader2,
  FileText,
  BarChart3
} from 'lucide-react';
import WaiterAnalytics from '@/components/waiters/WaiterAnalytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import WaiterGoalCard from '@/components/waiters/WaiterGoalCard';

export default function WaiterProfile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    notes: ''
  });

  const urlParams = new URLSearchParams(window.location.search);
  const waiterId = urlParams.get('id');

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: waiter, isLoading } = useQuery({
    queryKey: ['waiter', waiterId],
    queryFn: async () => {
      if (!waiterId) return null;
      const waiters = await base44.entities.Waiter.filter({ id: waiterId });
      return waiters[0] || null;
    },
    enabled: !!waiterId,
  });

  const { data: signups = [] } = useQuery({
    queryKey: ['waiter-signups', waiterId],
    queryFn: async () => {
      if (!waiterId) return [];
      return await base44.entities.Customer.filter({ referred_by: waiterId }, '-created_date');
    },
    enabled: !!waiterId,
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['waiter-feedbacks', waiterId, user?.restaurant_id],
    queryFn: async () => {
      if (!waiterId || !user?.restaurant_id) return [];
      const waiterCustomerIds = signups.map(s => s.id);
      if (waiterCustomerIds.length === 0) return [];
      
      const allFeedbacks = await base44.entities.Feedback.filter({ 
        restaurant_id: user.restaurant_id 
      }, '-created_date');
      
      return allFeedbacks.filter(f => 
        signups.some(s => s.full_name === f.customer_name || s.phone === f.phone)
      );
    },
    enabled: !!waiterId && !!user?.restaurant_id && signups.length > 0,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['waiter-goals', waiterId, user?.restaurant_id],
    queryFn: async () => {
      if (!waiterId || !user?.restaurant_id) return [];
      return base44.entities.WaiterGoal.filter({ 
        restaurant_id: user.restaurant_id,
        waiter_id: waiterId,
        is_active: true
      });
    },
    enabled: !!waiterId && !!user?.restaurant_id,
  });

  const getCurrentPeriodSignups = (goal) => {
    if (!goal || !signups.length) return 0;
    
    try {
      const now = new Date();
      if (goal.goal_type === 'weekly') {
        const weekStart = startOfWeek(now, { locale: he });
        const weekEnd = endOfWeek(now, { locale: he });
        return signups.filter(s => {
          try {
            const date = new Date(s.created_date);
            return !isNaN(date.getTime()) && date >= weekStart && date <= weekEnd;
          } catch {
            return false;
          }
        }).length;
      } else if (goal.goal_type === 'monthly') {
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        return signups.filter(s => {
          try {
            const date = new Date(s.created_date);
            return !isNaN(date.getTime()) && date >= monthStart && date <= monthEnd;
          } catch {
            return false;
          }
        }).length;
      }
      return signups.length;
    } catch (error) {
      console.error('Error calculating period signups:', error);
      return 0;
    }
  };

  const activeGoal = goals[0];
  const currentSignups = activeGoal ? getCurrentPeriodSignups(activeGoal) : 0;

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Waiter.update(waiterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['waiter', waiterId]);
      queryClient.invalidateQueries(['waiters']);
      setIsEditing(false);
      toast.success('פרטי מלצר עודכנו בהצלחה!');
    },
    onError: (error) => {
      toast.error('שגיאה בעדכון פרטים');
      console.error(error);
    }
  });

  useEffect(() => {
    if (waiter) {
      setFormData({
        name: waiter.name || '',
        notes: waiter.notes || ''
      });
    }
  }, [waiter]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('שם המלצר הוא שדה חובה');
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: waiter?.name || '',
      notes: waiter?.notes || ''
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const [showAnalytics, setShowAnalytics] = useState(false);

  if (!waiter) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Waiters')}>
            <Button variant="outline" size="icon">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-[#0F172A]">מלצר לא נמצא</h1>
        </div>
        <Card className="border-gray-100">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">המלצר המבוקש לא נמצא במערכת</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Waiters')}>
            <Button variant="outline" size="icon">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#C5A059] flex items-center justify-center">
              <span className="text-white text-xl font-medium">
                {waiter.name?.[0]?.toUpperCase() || 'M'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#0F172A]">{waiter.name}</h1>
              <p className="text-sm text-gray-500">
                הצטרף ב-{format(new Date(waiter.created_date), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAnalytics(!showAnalytics)}
            variant={showAnalytics ? "default" : "outline"}
            className={showAnalytics ? "bg-[#C5A059] hover:bg-[#B8934D] text-white" : ""}
          >
            <BarChart3 className="w-4 h-4 ml-2" />
            {showAnalytics ? 'סגור אנליטיקס' : 'הצג אנליטיקס'}
          </Button>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                <X className="w-4 h-4 ml-2" />
                ביטול
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    שמור שינויים
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
            >
              <Edit2 className="w-4 h-4 ml-2" />
              ערוך פרופיל
            </Button>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <WaiterAnalytics 
          waiter={waiter}
          customers={signups}
          feedbacks={feedbacks}
        />
      )}

      {/* Goal Card */}
      {!showAnalytics && activeGoal && (
        <WaiterGoalCard goal={activeGoal} currentSignups={currentSignups} />
      )}

      {/* Stats Cards */}
      {!showAnalytics && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">סה"כ הרשמות</p>
                <p className="text-3xl font-semibold text-[#0F172A]">{waiter.signup_count || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">לקוחות פעילים</p>
                <p className="text-3xl font-semibold text-[#0F172A]">{signups.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">תקופת פעילות</p>
                <p className="text-3xl font-semibold text-[#0F172A]">
                  {Math.floor((new Date() - new Date(waiter.created_date)) / (1000 * 60 * 60 * 24))} ימים
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <Card className="border-gray-100">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              פרטי מלצר
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם המלצר</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="שם המלצר"
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="הערות או תגיות למלצר זה..."
                rows={5}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card className="border-gray-100">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              הרשמות אחרונות
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {signups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">אין הרשמות עדיין</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {signups.slice(0, 10).map((signup) => (
                  <div key={signup.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {signup.full_name?.[0]?.toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">{signup.full_name}</p>
                        <p className="text-xs text-gray-500">{signup.phone || signup.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {format(new Date(signup.created_date), 'dd/MM/yyyy')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}

      {/* All Signups Table */}
      {!showAnalytics && signups.length > 0 && (
        <Card className="border-gray-100">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>כל ההרשמות ({signups.length})</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F7FA] border-b border-gray-100">
                <tr>
                  <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">לקוח</th>
                  <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">טלפון</th>
                  <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">אימייל</th>
                  <th className="text-right text-sm font-semibold text-[#0F172A] px-6 py-4">תאריך הרשמה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {signups.map((signup) => (
                  <tr key={signup.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">
                            {signup.full_name?.[0]?.toUpperCase() || 'C'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[#0F172A]">{signup.full_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{signup.phone || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{signup.email || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {format(new Date(signup.created_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}