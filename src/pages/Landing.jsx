import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowLeft,
  Smartphone,
  Mail,
  Phone,
  Star,
  Zap,
  Shield,
  BarChart3,
  Calendar,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Landing() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const features = [
    {
      icon: Users,
      title: "ניהול לקוחות",
      description: "בנה וניהל את מאגר הלקוחות שלך בקלות. ייבא, ייצא ומיין את האורחים שלך."
    },
    {
      icon: MessageSquare,
      title: "קמפיינים רב-ערוציים",
      description: "הגע ללקוחות דרך SMS, WhatsApp ואימייל. בחר את הערוץ המושלם לכל הודעה."
    },
    {
      icon: Calendar,
      title: "תזמון חכם",
      description: "תזמן קמפיינים מראש. תזמון מושלם לאירועים מיוחדים ומבצעים."
    },
    {
      icon: BarChart3,
      title: "לוח בקרה אנליטי",
      description: "עקוב אחר ביצועי הקמפיינים ומעורבות הלקוחות בזמן אמת."
    },
    {
      icon: Smartphone,
      title: "הרשמות דרך QR",
      description: "צור קודי QR לשולחנות ותפריטים. לקוחות יכולים להצטרף לרשימה מיידית."
    },
    {
      icon: Shield,
      title: "מאובטח ותקני",
      description: "אבטחה ברמת בנקים. תואם GDPR. המידע שלך מוגן אצלנו."
    }
  ];

  const testimonials = [
    {
      name: "שף אנטואן דובואה",
      restaurant: "לה ביסטרו פריזיאן, תל אביב",
      quote: "MAITRE שינה את הדרך שבה אנחנו מתקשרים עם האורחים שלנו. ההזמנות שלנו עלו ב-40% תוך חודשיים בלבד.",
      rating: 5
    },
    {
      name: "יוקי טנקה",
      restaurant: "סושי מאסטר טוקיו, תל אביב",
      quote: "ההודעות הרב-ערוציות מושלמות לאירועי האומקאסה שלנו. אנחנו מגיעים ללקוחות בדיוק היכן שהם נמצאים.",
      rating: 5
    },
    {
      name: "מרקו רוסיני",
      restaurant: "טרטוריה בלה ויסטה, ירושלים",
      quote: "פשוט, אלגנטי וחזק. בדיוק מה שהמסעדה שלנו הייתה צריכה. תכונת ה-QR מבריקה!",
      rating: 5
    }
  ];

  const stats = [
    { number: "+500", label: "מסעדות" },
    { number: "+50K", label: "הודעות נשלחו" },
    { number: "98%", label: "שיעור הצלחה" },
    { number: "4.9/5", label: "דירוג" }
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 40 40" className="w-10 h-10">
                <path d="M8 32 L20 8 L32 32" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 20 L20 32 L26 20" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xl font-semibold tracking-widest text-[#0F172A]">MAITRE</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-[#0F172A] transition-colors">היתרונות שלנו</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-[#0F172A] transition-colors">מחיר</a>
              <a href="#testimonials" className="text-sm text-gray-600 hover:text-[#0F172A] transition-colors">המלצות</a>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild className="bg-[#C5A059] hover:bg-[#B8934D] text-white">
                <Link to={createPageUrl('Register')}>התחל עכשיו</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0F172A] to-[#1e293b]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center"
          >
            <Badge className="mb-4 bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30">
              <Zap className="w-3 h-3 ml-1" />
              הקונסיירז' הדיגיטלי למסעדות יוקרה
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              תקשר עם האורחים שלך<br />
              <span className="text-[#C5A059]">כמו שמעולם לא חווית</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              פלטפורמת CRM ושיווק מלאה למסעדות פרימיום. 
              הגע ללקוחות דרך SMS, WhatsApp ואימייל בלוח בקרה אלגנטי אחד.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-[#C5A059] hover:bg-[#B8934D] text-white text-lg px-8 h-12">
                <Link to={createPageUrl('Register')}>
                  התחל עכשיו
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 h-12">
                <a href="#features">
                  ראה איך זה עובד
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.number}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20">
              היתרונות שלנו
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">
              כל מה שאתה צריך בפלטפורמה אחת
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              כלים חזקים שתוכננו במיוחד למסעדות יוקרה ומוסדות אוכל משובחים
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-gray-100 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-[#C5A059]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why MAITRE */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20">
                למה MAITRE?
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-6">
                המערכת שתעזור לך להכפיל את ההכנסות
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-1">הגדל את תפוסת המסעדה</h3>
                    <p className="text-gray-600">שלח הודעות אוטומטיות בחגים, ימי הולדת ואירועים מיוחדים. לקוחות שלך יחזרו שוב ושוב.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-1">הרשמות קלות דרך QR</h3>
                    <p className="text-gray-600">המלצרים שלך יכולים לאסוף הרשמות בשולחן תוך שניות. כל לקוח חדש = הזדמנות שיווקית.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-1">מעקב וניתוח בזמן אמת</h3>
                    <p className="text-gray-600">ראה בדיוק כמה לקוחות קיבלו את ההודעה, כמה פתחו וכמה הגיעו למסעדה.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-[#0F172A] to-[#1e293b] rounded-2xl p-8 shadow-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">קמפיין חג המולד</p>
                      <p className="text-gray-400 text-sm">נשלח ל-450 לקוחות</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">שיעור פתיחה</span>
                      <span className="text-white font-medium">87%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-[#C5A059] h-2 rounded-full" style={{width: '87%'}}></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white mb-1">₪67K</p>
                    <p className="text-gray-400 text-xs">הכנסה חודשית</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white mb-1">1,240</p>
                    <p className="text-gray-400 text-xs">לקוחות פעילים</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white mb-1">92%</p>
                    <p className="text-gray-400 text-xs">שביעות רצון</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Automation Examples */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20">
              אוטומציות חכמות
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">
              תן למערכת לעשות את העבודה בשבילך
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              הגדר פעם אחת, והמערכת תשלח הודעות אוטומטיות בזמן המושלם
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">יום הולדת אוטומטי</h3>
                </div>
                <p className="text-gray-600 mb-4">שלח מתנת יום הולדת (קינוח/מנה) אוטומטית ללקוחות ביום ההולדת שלהם</p>
                <div className="bg-white rounded-lg p-4 text-sm">
                  <p className="text-gray-700 italic">"🎂 מזל טוב יוסי! קבל קינוח מתנה ביום ההולדת שלך. הצג הודעה זו למלצר."</p>
                  <p className="text-xs text-gray-500 mt-2">✓ נשלח אוטומטית בבוקר יום ההולדת</p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">תוצאות ממוצעות:</span>
                  <div className="text-left">
                    <p className="text-lg font-bold text-[#C5A059]">73% מגיעים</p>
                    <p className="text-xs text-gray-500">מהלקוחות שקיבלו הודעה</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">החזרת לקוחות (Win-back)</h3>
                </div>
                <p className="text-gray-600 mb-4">לקוח לא הגיע 60 יום? המערכת תשלח לו אוטומטית הנחה מיוחדת</p>
                <div className="bg-white rounded-lg p-4 text-sm">
                  <p className="text-gray-700 italic">"היי שרה, התגעגענו! 🌟 קבלי 20% הנחה על הביקור הבא. בתוקף עד סוף החודש."</p>
                  <p className="text-xs text-gray-500 mt-2">✓ נשלח ללקוחות שלא הגיעו 60+ יום</p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">תוצאות ממוצעות:</span>
                  <div className="text-left">
                    <p className="text-lg font-bold text-[#C5A059]">41% חוזרים</p>
                    <p className="text-xs text-gray-500">מהלקוחות ה"אבודים"</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">קמפיינים לחגים</h3>
                </div>
                <p className="text-gray-600 mb-4">המערכת מזהה אוטומטית חגים ישראליים ושולחת קמפיין מותאם</p>
                <div className="bg-white rounded-lg p-4 text-sm">
                  <p className="text-gray-700 italic">"🕎 חנוכה שמח! הזמינו עכשיו את השולחן שלכם לארוחת החג המיוחדת."</p>
                  <p className="text-xs text-gray-500 mt-2">✓ נשלח אוטומטית 5 יום לפני החג</p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">תוצאות ממוצעות:</span>
                  <div className="text-left">
                    <p className="text-lg font-bold text-[#C5A059]">+156% הזמנות</p>
                    <p className="text-xs text-gray-500">בתקופת החגים</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">שיווק ויראלי</h3>
                </div>
                <p className="text-gray-600 mb-4">לקוחות מביאים חברים ומקבלים הטבות. הרשת שלך גדלה אוטומטית</p>
                <div className="bg-white rounded-lg p-4 text-sm">
                  <p className="text-gray-700 italic">"🎁 הביאו חבר וקבלו שניכם מנה ראשונה במתנה! שתפו את הקישור שלכם."</p>
                  <p className="text-xs text-gray-500 mt-2">✓ כל לקוח מקבל קישור אישי לשיתוף</p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">תוצאות ממוצעות:</span>
                  <div className="text-left">
                    <p className="text-lg font-bold text-[#C5A059]">2.3 חברים</p>
                    <p className="text-xs text-gray-500">לכל לקוח שמשתף</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20">
              תהליך פשוט
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">
              התחל תוך דקות
            </h2>
            <p className="text-lg text-gray-600">
              התחל לעבוד עם MAITRE ב-3 צעדים פשוטים
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "צור חשבון",
                description: "הירשם והגדר את פרופיל המסעדה שלך. הוסף את המיתוג שלך וחבר את הערוצים."
              },
              {
                step: "02",
                title: "בנה את הרשימה שלך",
                description: "ייבא לקוחות קיימים או השתמש בקודי QR לאיסוף הרשמות. הגדל את הקהל שלך בקלות."
              },
              {
                step: "03",
                title: "שלח קמפיינים",
                description: "צור קמפיינים יפים והגע ללקוחות דרך SMS, WhatsApp או אימייל. תזמן או שלח מיידית."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C5A059] to-[#D4B06A] flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#0F172A] mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 right-[60%] w-[80%] h-0.5 bg-gradient-to-l from-[#C5A059] to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20">
              תחשיב החזר על השקעה
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">
              כמה תרוויח עם MAITRE?
            </h2>
            <p className="text-lg text-gray-600">
              דוגמה למסעדה ממוצעת עם 500 לקוחות במאגר
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A] mb-2">הכנסה חודשית משוערת</h3>
                    <p className="text-4xl font-bold text-green-600 mb-2">₪18,750</p>
                    <p className="text-sm text-gray-600">
                      500 לקוחות × 5% שיעור חזרה × ₪150 צ'ק ממוצע × 2.5 ביקורים
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A] mb-2">עלות המערכת</h3>
                    <p className="text-4xl font-bold text-blue-600 mb-2">₪499</p>
                    <p className="text-sm text-gray-600">
                      תשלום חודשי קבוע, כל ההיתרונות שלנו כלולות
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-[#C5A059] bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-[#0F172A] mb-2">רווח נקי חודשי</h3>
              <p className="text-5xl font-bold text-[#C5A059] mb-4">₪18,251</p>
              <p className="text-lg text-gray-600 mb-6">החזר השקעה (ROI) של <span className="font-bold text-[#C5A059]">3,658%</span></p>
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 border border-[#C5A059]/20">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">המערכת משתלמת כבר מהלקוח הראשון</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20">
              המלצות
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">
              אהוב על ידי בעלי מסעדות
            </h2>
            <p className="text-lg text-gray-600">
              ראה מה הלקוחות שלנו אומרים
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#C5A059] text-[#C5A059]" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4 italic">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold text-[#0F172A]">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.restaurant}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20">
              מחיר פשוט
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">
              תוכנית אחת, הכל כלול
            </h2>
            <p className="text-lg text-gray-600">
              ללא עלויות נסתרות. ביטול בכל עת.
            </p>
          </div>

          <Card className="border-2 border-[#C5A059] relative overflow-hidden">
            <div className="absolute top-0 left-0 bg-[#C5A059] text-white text-xs font-medium px-4 py-1 rounded-br-lg">
              הכי פופולרי
            </div>
            <CardContent className="p-8 sm:p-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#0F172A] mb-2">MAITRE Pro</h3>
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-5xl font-bold text-[#0F172A]">₪499</span>
                  <span className="text-gray-500">/לחודש</span>
                </div>
                <p className="text-gray-600">14 יום ניסיון חינם • ללא כרטיס אשראי</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {[
                  "לקוחות ללא הגבלה",
                  "קמפיינים ב-SMS",
                  "קמפיינים ב-WhatsApp",
                  "קמפיינים באימייל",
                  "תבניות הודעות",
                  "יצירת קודי QR",
                  "תזמון קמפיינים",
                  "לוח בקרה אנליטי",
                  "פילוח לקוחות",
                  "תמיכה עדיפה"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button asChild className="w-full bg-[#C5A059] hover:bg-[#B8934D] text-white h-12 text-lg">
                <Link to={createPageUrl('Register')}>
                  התחל עכשיו
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Link>
              </Button>

              <p className="text-center text-sm text-gray-500 mt-4">
                הצטרף ל-500+ מסעדות שכבר משתמשות ב-MAITRE
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0F172A] to-[#1e293b]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            מוכן לשדרג את חוויית האורחים שלך?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            התחל את ניסיון ה-14 יום החינמי שלך היום. ללא כרטיס אשראי.
          </p>
          <Button asChild size="lg" className="bg-[#C5A059] hover:bg-[#B8934D] text-white text-lg px-8 h-12">
            <Link to={createPageUrl('Register')}>
              התחל עכשיו
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0F172A] border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <svg viewBox="0 0 40 40" className="w-8 h-8">
                  <path d="M8 32 L20 8 L32 32" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 20 L20 32 L26 20" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-lg font-semibold tracking-widest text-white">MAITRE</span>
              </div>
              <p className="text-gray-400 text-sm">
                הקונסיירז' הדיגיטלי למסעדות יוקרה.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">מוצר</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">היתרונות שלנו</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">מחיר</a></li>
                <li><Link to={createPageUrl('Dashboard')} className="text-gray-400 hover:text-white transition-colors">כניסה</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">החברה</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">אודות</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">בלוג</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">צור קשר</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">משפטי</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">מדיניות פרטיות</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">תנאי שימוש</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2026 MAITRE. כל הזכויות שמורות.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}