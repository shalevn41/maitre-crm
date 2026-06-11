import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trophy, TrendingUp, Target, DollarSign, Calendar, Edit2, Trash2, Loader2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';

export default function WaiterIncentives() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    waiter_id: '',
    goal_type: 'weekly',
    target_signups: 10,
    bonus_amount: 200,
    bonus_type: 'fixed'
  });

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: waiters = [] } = useQuery({
    queryKey: ['waiters', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Waiter.filter({ restaurant_id: user.restaurant_id });
    },
    enabled: !!user?.restaurant_id,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['waiter-goals', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.WaiterGoal.filter({ restaurant_id: user.restaurant_id }, '-created_date');
    },
    enabled: !!user?.restaurant_id,
  });

  const { data: allCustomers = [] } = useQuery({
    queryKey: ['customers', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return [];
      return base44.entities.Customer.filter({ restaurant_id: user.restaurant_id });
    },
    enabled: !!user?.restaurant_id,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData) => {
      const { period_start, period_end } = calculatePeriodDates(goalData.goal_type);
      return await base44.entities.WaiterGoal.create({
        ...goalData,
        restaurant_id: user.restaurant_id,
        period_start,
        period_end,
        current_signups: 0,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['waiter-goals']);
      setShowDialog(false);
      resetForm();
      toast.success('יעד חדש נוצר בהצלחה!');
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WaiterGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['waiter-goals']);
      setShowDialog(false);
      setEditingGoal(null);
      resetForm();
      toast.success('יעד עודכן בהצלחה!');
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.WaiterGoal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['waiter-goals']);
      toast.success('יעד נמחק בהצלחה');
    },
  });

  const calculatePeriodDates = (goalType) => {
    const now = new Date();
    if (goalType === 'weekly') {
      return {
        period_start: format(startOfWeek(now, { locale: he }), 'yyyy-MM-dd'),
        period_end: format(endOfWeek(now, { locale: he }), 'yyyy-MM-dd')
      };
    } else if (goalType === 'monthly') {
      return {
        period_start: format(startOfMonth(now), 'yyyy-MM-dd'),
        period_end: format(endOfMonth(now), 'yyyy-MM-dd')
      };
    }
    return { period_start: null, period_end: null };
  };

  const resetForm = () => {
    setFormData({
      waiter_id: '',
      goal_type: 'weekly',
      target_signups: 10,
      bonus_amount: 200,
      bonus_type: 'fixed'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.waiter_id || !formData.target_signups || !formData.bonus_amount) {
      toast.error('נא למלא את כל השדות');
      return;
    }

    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data: formData });
    } else {
      createGoalMutation.mutate(formData);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      waiter_id: goal.waiter_id,
      goal_type: goal.goal_type,
      target_signups: goal.target_signups,
      bonus_amount: goal.bonus_amount,
      bonus_type: goal.bonus_type
    });
    setShowDialog(true);
  };

  const calculateProgress = (goal) => {
    const waiterCustomers = allCustomers.filter(c => c.referred_by === goal.waiter_id);
    
    let signupsInPeriod = 0;
    if (goal.goal_type === 'total') {
      signupsInPeriod = waiterCustomers.length;
    } else if (goal.period_start && goal.period_end) {
      try {
        const periodStart = new Date(goal.period_start);
        const periodEnd = new Date(goal.period_end);
        
        signupsInPeriod = waiterCustomers.filter(c => {
          const createdDate = new Date(c.created_date);
          return createdDate >= periodStart && createdDate <= periodEnd;
        }).length;
      } catch (error) {
        console.error('Error calculating period signups:', error);
        signupsInPeriod = 0;
      }
    }

    const progress = goal.target_signups > 0 
      ? Math.min((signupsInPeriod / goal.target_signups) * 100, 100) 
      : 0;
    const isAchieved = signupsInPeriod >= goal.target_signups;
    
    return { signupsInPeriod, progress, isAchieved };
  };

  const getWaiterName = (waiterId) => {
    const waiter = waiters.find(w => w.id === waiterId);
    return waiter?.name || 'לא ידוע';
  };

  const getTotalBonusEarned = () => {
    return goals
      .filter(g => g.is_achieved)
      .reduce((sum, g) => {
        const { signupsInPeriod } = calculateProgress(g);
        return sum + (g.bonus_type === 'fixed' ? g.bonus_amount : g.bonus_amount * signupsInPeriod);
      }, 0);
  };

  const activeGoals = goals.filter(g => g.is_active);
  const achievedGoals = goals.filter(g => g.is_achieved);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="מערכת תגמול למלצרים"
        subtitle="הגדר יעדים ובונוסים למלצרים להגברת המוטיבציה"
        actions={
          <Button 
            onClick={() => {
              resetForm();
              setEditingGoal(null);
              setShowDialog(true);
            }}
            className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
          >
            <Plus className="w-4 h-4 ml-2" />
            הוסף יעד חדש
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">יעדים פעילים</p>
                <p className="text-3xl font-semibold text-[#0F172A]">{activeGoals.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">יעדים שהושגו</p>
                <p className="text-3xl font-semibold text-[#0F172A]">{achievedGoals.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">סה"כ בונוסים</p>
                <p className="text-3xl font-semibold text-[#0F172A]">₪{getTotalBonusEarned()}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      <Card className="border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <CardTitle>יעדים פעילים</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {activeGoals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">אין יעדים פעילים כרגע</p>
              <Button 
                onClick={() => setShowDialog(true)}
                variant="outline"
                className="border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10"
              >
                <Plus className="w-4 h-4 ml-2" />
                צור יעד ראשון
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeGoals.map((goal) => {
                const { signupsInPeriod, progress, isAchieved } = calculateProgress(goal);
                const totalBonus = goal.bonus_type === 'fixed' 
                  ? goal.bonus_amount 
                  : goal.bonus_amount * signupsInPeriod;

                return (
                  <Card key={goal.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-medium">
                              {getWaiterName(goal.waiter_id)[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-[#0F172A]">{getWaiterName(goal.waiter_id)}</h3>
                              {isAchieved && (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  <Award className="w-3 h-3 ml-1" />
                                  הושג!
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {goal.goal_type === 'weekly' ? 'שבועי' : goal.goal_type === 'monthly' ? 'חודשי' : 'כללי'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                יעד: {goal.target_signups} הרשמות
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                בונוס: ₪{goal.bonus_amount}
                                {goal.bonus_type === 'per_signup' && ' לכל הרשמה'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(goal)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteGoalMutation.mutate(goal.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">התקדמות</span>
                          <span className="font-medium text-[#0F172A]">
                            {signupsInPeriod} / {goal.target_signups} ({Math.round(progress)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              isAchieved ? 'bg-green-500' : 'bg-[#C5A059]'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {isAchieved && (
                          <div className="flex items-center justify-between text-sm mt-2 p-2 bg-green-50 rounded-lg">
                            <span className="text-green-700 font-medium">בונוס זכאי</span>
                            <span className="text-green-700 font-bold">₪{totalBonus}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'ערוך יעד' : 'הוסף יעד חדש'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="waiter">מלצר</Label>
              <Select
                value={formData.waiter_id}
                onValueChange={(value) => setFormData({ ...formData, waiter_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מלצר" />
                </SelectTrigger>
                <SelectContent>
                  {waiters.map((waiter) => (
                    <SelectItem key={waiter.id} value={waiter.id}>
                      {waiter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal_type">סוג יעד</Label>
              <Select
                value={formData.goal_type}
                onValueChange={(value) => setFormData({ ...formData, goal_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">שבועי</SelectItem>
                  <SelectItem value="monthly">חודשי</SelectItem>
                  <SelectItem value="total">כללי</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_signups">יעד הרשמות</Label>
              <Input
                id="target_signups"
                type="number"
                value={formData.target_signups}
                onChange={(e) => setFormData({ ...formData, target_signups: parseInt(e.target.value) })}
                placeholder="10"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus_type">סוג בונוס</Label>
              <Select
                value={formData.bonus_type}
                onValueChange={(value) => setFormData({ ...formData, bonus_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">סכום קבוע</SelectItem>
                  <SelectItem value="per_signup">לפי כל הרשמה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus_amount">
                סכום בונוס (₪) {formData.bonus_type === 'per_signup' && '- לכל הרשמה'}
              </Label>
              <Input
                id="bonus_amount"
                type="number"
                value={formData.bonus_amount}
                onChange={(e) => setFormData({ ...formData, bonus_amount: parseFloat(e.target.value) })}
                placeholder="200"
                min="1"
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDialog(false);
                  setEditingGoal(null);
                  resetForm();
                }}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
              >
                {(createGoalMutation.isPending || updateGoalMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 ml-2" />
                    {editingGoal ? 'עדכן יעד' : 'צור יעד'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}