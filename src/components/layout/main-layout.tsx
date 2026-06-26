"use client";

import { useState, useEffect } from 'react';
import { Menu, Home, Grid, History, User, Heart, Mail, Settings, LogOut, ShieldCheck, X, Wallet } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from '@/firebase/hooks';
import { logoutUser } from '@/firebase/auth-service';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const navItems = [
    { label: 'الرئيسية', href: '/dashboard', icon: Home },
    { label: 'الخدمات', href: '/dashboard/services', icon: Grid },
    { label: 'طلباتي', href: '/dashboard/orders', icon: History },
    { label: 'الدعم', href: '/dashboard/support', icon: Mail },
  ];

  const sidebarLinks = [
    { label: 'الرئيسية', href: '/dashboard', icon: Home },
    { label: 'دليل الخدمات', href: '/dashboard/services', icon: Grid },
    { label: 'سجل الطلبات', href: '/dashboard/orders', icon: History },
    { label: 'شحن الرصيد', href: '/dashboard/add-funds', icon: Wallet },
    { label: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
    { label: 'الدعم الفني', href: '/dashboard/support', icon: Mail },
  ];

  const headerLogoUrl = "/logo1.png";
  const sidebarLogoUrl = "/logo2.png";

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const formatBalance = (val: number) => {
    if (val === undefined || val === null) return "0.00";
    return Number(val).toFixed(2);
  };

  const getAvatarUrl = () => {
    if (loading || !userData?.gender) return null;
    
    if (userData.gender === 'female') {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=female_jomhorak_v3&skinColor=fbe0d0&topType=longHair,bob,curly,curvy,hijab,turban&accessoriesType=none&clotheType=overall,blazerAndShirt&eyeType=default&mouthType=smile`;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=male_jomhorak_v3&skinColor=fbe0d0&topType=shortHair,shaved,frizzle,dreads,sideburns&accessoriesType=none&clotheType=graphicShirt,shirtVNeck,blazerAndShirt&eyeType=default&mouthType=default`;
  };

  const avatarUrl = getAvatarUrl();

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8F9FA] pb-24 text-right" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
        <header className="h-16 px-4 flex items-center justify-between sticky top-0 bg-white z-40 border-b border-gray-100">
           <div className="text-orange-500 h-[38px] w-[38px] flex items-center justify-center bg-white border border-orange-100 rounded-xl"><Menu className="h-6 w-6" /></div>
           <div className="flex items-center gap-2">
             <Image src={headerLogoUrl} alt="جمهورك" width={38} height={38} className="object-contain" />
             <span className="text-[22px] font-bold text-orange-500">جمهورك</span>
           </div>
           <div className="w-20" />
        </header>
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] pb-24 text-right" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <header className="h-16 px-4 flex items-center justify-between sticky top-0 bg-white z-40 border-b border-gray-100">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="text-orange-500 h-[38px] w-[38px] flex items-center justify-center bg-white border border-orange-100 rounded-xl outline-none focus:outline-none cursor-pointer active:scale-95 transition-transform">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] p-0 border-none rounded-l-[2.5rem] bg-white overflow-hidden outline-none shadow-2xl" dir="rtl">
            <SheetTitle className="sr-only">جمهورك - قائمة التنقل</SheetTitle>
            <SheetDescription className="sr-only">قائمة الروابط السريعة والإعدادات لمنصة جمهورك</SheetDescription>
            <div className="h-full flex flex-col font-tajawal relative">
              <div className="p-8 orange-gradient relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute top-[-20%] left-[-10%] w-40 h-40 rounded-full bg-white blur-3xl"></div>
                </div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl p-1.5">
                    <Image src={sidebarLogoUrl} alt="جمهورك" width={40} height={40} className="object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-white leading-tight">جمهورك</span>
                    <span className="text-[9px] font-black text-white/70 uppercase tracking-widest leading-none">Jomhorak.com</span>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md py-4 px-5 rounded-[2.2rem] border border-white/20 relative z-10 shadow-lg w-full max-w-[270px] mx-auto min-h-[90px] flex items-center">
                  <div className="flex items-center gap-4 w-full">
                    <Avatar className="h-14 w-14 border-2 border-white/30 shadow-sm shrink-0">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={userData?.name} key={userData?.gender} />
                      ) : null}
                      <AvatarFallback className="bg-white text-orange-600 font-black text-base">
                        {userData?.name?.charAt(0) || <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden text-right">
                      <span className="text-sm font-black text-white truncate">{userData?.name || 'مستخدم'}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Wallet className="h-4 w-4 text-white/60" />
                        <span className="text-sm font-black text-white leading-none">${formatBalance(userData?.balance || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto bg-white">
                {userData?.isAdmin && (
                  <Link 
                    href="/dashboard/admin"
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 rounded-2xl mb-6 border-2 group transition-all",
                      pathname === '/dashboard/admin' 
                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20" 
                        : "bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-900"
                    )}
                  >
                    <ShieldCheck className={cn("h-5 w-5", pathname === '/dashboard/admin' ? "text-orange-400" : "text-slate-400")} />
                    <span className="text-sm font-black">لوحة تحكم المشرف</span>
                  </Link>
                )}

                {sidebarLinks.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 rounded-2xl group transition-all mb-1",
                        isActive 
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" 
                          : "text-gray-500 hover:text-orange-500 hover:bg-orange-50/50"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-gray-400 group-hover:text-orange-500")} />
                      <span className="text-sm font-black">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="p-6 border-t border-gray-50 bg-white">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-red-500 bg-red-50 hover:bg-red-100 transition-colors border-none cursor-pointer outline-none"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-black">تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 outline-none">
             <Image src={headerLogoUrl} alt="جمهورك" width={38} height={38} className="object-contain" />
             <span className="text-[22px] font-bold text-orange-500">جمهورك</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/settings" className="outline-none">
            <button className="h-[38px] px-4 rounded-xl border border-orange-100 text-orange-500 font-black text-[11px] flex items-center gap-2 bg-transparent select-none active:scale-95 transition-transform">
              <User className="h-4 w-4" />
              حسابي
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col">
        <div className="flex-1">
          {children}
        </div>

        <footer className="mt-20 border-t border-slate-100 bg-white rounded-t-[3rem] pt-16 pb-10 px-6 font-tajawal -mx-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center gap-2">
                <Image src={headerLogoUrl} alt="جمهورك" width={38} height={38} className="object-contain" />
                <span className="text-xl font-black text-slate-900">جمهورك</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-bold max-w-xs mx-auto">
                المنصة الأسرع والأرخص لخدمات التسويق الرقمي في الوطن العربي. جودة مضمونة ودعم فني على مدار الساعة.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 max-w-xs mx-auto">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 justify-start">
                  <div className="w-1 h-3 bg-orange-500 rounded-full" />
                  القانونية
                </h4>
                <ul className="space-y-2 text-[11px] font-black text-slate-400 text-right">
                  <li><Link href="/dashboard/privacy" className="hover:text-orange-500 transition-colors">سياسة الخصوصية</Link></li>
                  <li><Link href="/dashboard/terms" className="hover:text-orange-500 transition-colors">شروط الخدمة</Link></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 justify-start">
                  <div className="w-1 h-3 bg-orange-500 rounded-full" />
                  المساعدة
                </h4>
                <ul className="space-y-2 text-[11px] font-black text-slate-400 text-right">
                  <li><Link href="/dashboard/support" className="hover:text-orange-500 transition-colors">مركز الدعم</Link></li>
                  <li><Link href="/dashboard/support" className="hover:text-orange-500 transition-colors">الأسئلة الشائعة</Link></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 flex flex-col items-center gap-4 text-center">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                <span>صنع بكل</span>
                <Heart className="h-3 w-3 text-rose-500 fill-rose-500 animate-pulse" />
                <span>للمستخدم العربي</span>
              </div>
              <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
                &copy; 2026 جميع الحقوق محفوظة لجمهورك (JOMHORAK.COM)
              </p>
            </div>
          </div>
        </footer>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white h-20 flex items-center justify-around px-2 bottom-nav-shadow z-50 rounded-t-[2rem] border-t border-gray-100">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 min-w-[70px] outline-none transition-none">
              <Icon className={cn("h-6 w-6 transition-none", isActive ? "text-orange-500" : "text-gray-400")} />
              <span className={cn("text-[10px] font-bold transition-none", isActive ? "text-orange-500" : "text-gray-400")}>{item.label}</span>
              {isActive && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-0.5 animate-pulse"></div>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
