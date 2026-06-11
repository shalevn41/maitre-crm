import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, DollarSign, TrendingUp } from 'lucide-react';

export default function WaiterGoalCard({ goal, currentSignups }) {
  if (!goal || !goal.target_signups) return null;

  const progress = goal.target_signups > 0 
    ? Math.min((currentSignups / goal.target_signups) * 100, 100)
    : 0;
  const isAchieved = currentSignups >= goal.target_signups;
  const remainingSignups = Math.max(0, goal.target_signups - currentSignups);

  const totalBonus = goal.bonus_type === 'fixed' 
    ? goal.bonus_amount 
    : goal.bonus_amount * currentSignups;

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A]">היעד שלך</h3>
              <p className="text-xs text-gray-500">
                {goal.goal_type === 'weekly' ? 'שבועי' : goal.goal_type === 'monthly' ? 'חודשי' : 'כללי'}
              </p>
            </div>
          </div>
          {isAchieved && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              הושג! 🎉
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {/* Target */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Target className="w-4 h-4" />
              <span>יעד הרשמות</span>
            </div>
            <span className="font-semibold text-[#0F172A]">{goal.target_signups}</span>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">התקדמות</span>
              <span className="font-medium text-[#0F172A]">
                {currentSignups} / {goal.target_signups} ({Math.round(progress)}%)
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  isAchieved ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Bonus */}
          <div className={`p-3 rounded-lg ${
            isAchieved ? 'bg-green-100' : 'bg-amber-100'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${
                  isAchieved ? 'text-green-600' : 'text-amber-600'
                }`} />
                <span className={`text-sm font-medium ${
                  isAchieved ? 'text-green-700' : 'text-amber-700'
                }`}>
                  {isAchieved ? 'בונוס זכאי' : 'בונוס פוטנציאלי'}
                </span>
              </div>
              <span className={`font-bold ${
                isAchieved ? 'text-green-700' : 'text-amber-700'
              }`}>
                ₪{isAchieved ? totalBonus : goal.bonus_amount}
              </span>
            </div>
            {goal.bonus_type === 'per_signup' && !isAchieved && (
              <p className="text-xs text-amber-600 mt-1">
                ₪{goal.bonus_amount} לכל הרשמה
              </p>
            )}
          </div>

          {/* Remaining */}
          {!isAchieved && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>נותרו עוד {remainingSignups} הרשמות ליעד</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}