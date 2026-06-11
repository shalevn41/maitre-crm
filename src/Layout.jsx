import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  CreditCard,
  FileText,
  BarChart3,
  Crown,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Pages that don't need the dashboard layout
const PUBLIC_PAGES = ['CustomerSignup', 'Landing', 'Register'];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
    document.body.dir = 'rtl';
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!mounted) return;
        setIsAuthenticated(authed);
        if (authed) {
          const userData = await base44.auth.me();
          if (!mounted) return;
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth error:', error);
        if (!mounted) return;
        setIsAuthenticated(false);
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, []);

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return null;
      const restaurants = await base44.entities.Restaurant.filter({ id: user.restaurant_id });
      return restaurants[0] || null;
    },
    enabled: !!user?.restaurant_id,
  });

  const isSuperAdmin = user?.user_type === 'super_admin' || user?.role === 'admin';

  // Public pages - no layout
  if (PUBLIC_PAGES.includes(currentPageName)) {
    return <>{children}</>;
  }

  // Not authenticated - redirect to login or register
  if (!isAuthenticated) {
    // If on public page, show it
    if (PUBLIC_PAGES.includes(currentPageName)) {
      return <>{children}</>;
    }
    // Otherwise show auth prompt
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        {children}
      </div>
    );
  }

  // Check if user has restaurant - if not, redirect to register (skip for super admin and Dashboard)
  if (isAuthenticated && user && !user.restaurant_id && !isSuperAdmin && !['Register', 'Profile', 'AdminDashboard', 'AdminRestaurants', 'AdminTemplates', 'AdminSettings'].includes(currentPageName)) {
    if (currentPageName !== 'Dashboard') {
      window.location.href = createPageUrl('Register');
      return null;
    }
  }

  const ownerNavItems = [
    { name: 'לוח בקרה', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'לקוחות', icon: Users, page: 'Customers' },
    { name: 'שיווק ופרסום', icon: MessageSquare, page: 'Campaigns' },
    { name: 'צוות המלצרים', icon: Users, page: 'Waiters' },
    { name: 'מערכת תגמול', icon: TrendingUp, page: 'WaiterIncentives' },
    { name: 'פידבקים', icon: MessageSquare, page: 'Feedback' },
    { name: 'אוטומציות', icon: BarChart3, page: 'Automations' },
    { name: 'אינטגרציית CRM', icon: Building2, page: 'CRMIntegration' },
    { name: 'בונה דפי נחיתה', icon: LayoutDashboard, page: 'LandingPageBuilder' },
    { name: 'הגדרות מסעדה', icon: Settings, page: 'RestaurantSettings' },
  ];

  const adminNavItems = [
    { name: 'ניהול מערכת', icon: Crown, page: 'AdminDashboard' },
    { name: 'מסעדות', icon: Building2, page: 'AdminRestaurants' },
    { name: 'תבניות גלובליות', icon: FileText, page: 'AdminTemplates' },
    { name: 'הגדרות פלטפורמה', icon: Settings, page: 'AdminSettings' },
  ];

  const navItems = isSuperAdmin ? adminNavItems : ownerNavItems;

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Landing'));
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <style>{`
        :root {
          --color-primary: #0F172A;
          --color-accent: #C5A059;
          --color-accent-hover: #B8934D;
          --color-bg: #F5F7FA;
          --color-card: #FFFFFF;
        }
        .accent-gradient {
          background: linear-gradient(135deg, #C5A059 0%, #D4B06A 100%);
        }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-100 z-50 flex items-center justify-between px-4">
        <div className="w-10" />
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#0F172A] tracking-wide">MAITRE</span>
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-8 h-8">
              <path d="M8 32 L20 8 L32 32" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 20 L20 32 L26 20" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="w-6 h-6 text-[#0F172A]" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-full w-64 bg-white border-l border-gray-100 z-50 transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-lg text-[#0F172A] tracking-widest">MAITRE</span>
              <div className="w-10 h-10 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-10 h-10">
                  <path d="M8 32 L20 8 L32 32" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 20 L20 32 L26 20" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Restaurant Info (for owners) */}
          {!isSuperAdmin && restaurant && (
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3 px-2">
                {restaurant.logo_url ? (
                  <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] truncate">{restaurant.name}</p>
                  <p className={cn(
                    "text-xs",
                    restaurant.subscription_status === 'active' ? 'text-green-600' : 'text-amber-600'
                  )}>
                    {restaurant.subscription_status === 'active' ? 'פעיל' : 'נדרש מנוי'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-[#0F172A] text-white" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#0F172A]"
                  )}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  {item.name}
                </Link>
              );
            })}

            {/* Super Admin: Switch to Owner View */}
            {isSuperAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Owner Tools</p>
                </div>
                {ownerNavItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        isActive 
                          ? "bg-[#0F172A] text-white" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-[#0F172A]"
                      )}
                    >
                      <item.icon className="w-5 h-5" strokeWidth={1.5} />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-gray-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-[#C5A059] flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{user?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Profile')} className="cursor-pointer">
                    <Users className="w-4 h-4 ml-2" />
                    פרופיל
                  </Link>
                </DropdownMenuItem>
                {!isSuperAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Billing')} className="cursor-pointer">
                      <CreditCard className="w-4 h-4 ml-2" />
                      חיובים
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 ml-2" />
                  יציאה
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}