import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Users, MessageSquare, BarChart3, Sparkles } from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await base44.auth.isAuthenticated();
      setIsAuthenticated(authed);
      
      if (authed) {
        // Check if has restaurant
        try {
          const user = await base44.auth.me();
          if (user.restaurant_id) {
            window.location.href = createPageUrl('Dashboard');
          } else {
            window.location.href = createPageUrl('Register');
          }
        } catch (error) {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-gray-900" dir="rtl">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <svg viewBox="0 0 40 40" className="w-20 h-20">
                <path d="M8 32 L20 8 L32 32" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 20 L20 32 L26 20" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-6xl font-bold text-white tracking-wider">MAITRE</h1>
            </div>

            {/* Headline */}
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              מערכת ניהול מתקדמת למסעדות
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              נהל את הלקוחות, הצוות והשיווק שלך במקום אחד. התחל היום וראה תוצאות מיידיות.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Link to={createPageUrl('Register')}>
                <Button className="bg-[#C5A059] hover:bg-[#B8934D] text-white text-lg px-8 py-6 h-auto">
                  התחל עכשיו בחינם
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="text-lg px-8 py-6 h-auto border-white text-white hover:bg-white/10"
                onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
              >
                התחבר למערכת
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F172A] pointer-events-none" />
      </div>

      {/* Features Section */}
      <div className="bg-[#0F172A] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-white mb-4">למה MAITRE?</h3>
            <p className="text-gray-400 text-lg">כל מה שצריך כדי לנהל מסעדה מצליחה</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: 'ניהול לקוחות',
                description: 'מעקב אחר לקוחות, הרשמות וסגמנטציה חכמה'
              },
              {
                icon: MessageSquare,
                title: 'מסעות פרסום',
                description: 'שלח הודעות ממוקדות ב-SMS, WhatsApp ואימייל'
              },
              {
                icon: BarChart3,
                title: 'דוחות וניתוחים',
                description: 'מעקב ביצועים בזמן אמת ותובנות עסקיות'
              },
              {
                icon: Sparkles,
                title: 'AI מובנה',
                description: 'יצירת תוכן אוטומטית והמלצות חכמות'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-[#C5A059]/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#C5A059]" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-b from-[#0F172A] to-gray-900 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-white mb-4">היתרונות שלנו</h3>
          </div>

          <div className="space-y-6">
            {[
              'התקנה מהירה - התחל לעבוד תוך דקות',
              'ממשק פשוט ואינטואיטיבי בעברית',
              'תמיכה מלאה בכל הפלטפורמות',
              'אבטחת מידע ברמה הגבוהה ביותר',
              'תמיכה טכנית מקצועית בעברית',
              'עדכונים ושיפורים קבועים'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-white text-lg">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-[#C5A059] to-[#B8934D] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">מוכנים להתחיל?</h3>
          <p className="text-white/90 text-lg mb-8">
            הצטרף למסעדות מובילות שכבר משתמשות ב-MAITRE
          </p>
          <Link to={createPageUrl('Register')}>
            <Button className="bg-[#0F172A] hover:bg-gray-900 text-white text-lg px-8 py-6 h-auto">
              התחל עכשיו בחינם
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#0F172A] border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400">
            © 2026 MAITRE. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}