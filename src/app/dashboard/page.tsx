
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  Clock, 
  Plus,
  Instagram,
  Youtube,
  Facebook,
  Send,
  ArrowUpRight,
  TrendingDown,
  Loader2,
  TrendingUp,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase/hooks';
import { getUserOrdersStream } from '@/firebase/db-service';
import { syncUserOrdersStatus } from '@/firebase/finance-service';
import { getPaginatedCache, updatePaginatedCache } from '@/lib/pagination-store';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

export default function DashboardOverview() {
  const { user, userData, loading: authLoading } = useAuth();
  
  const cachedRecent = getPaginatedCache('homeRecentOrders') || [];
  const [recentOrders, setRecentOrders] = useState<any[]>(cachedRecent);
  const [dataLoading, setDataLoading] = useState(cachedRecent.length === 0);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) setDataLoading(false);
      return;
    }

    // Sync status and orders
    syncUserOrdersStatus(user.uid).catch(console.error);

    const unsubscribe = getUserOrdersStream(user.uid, (data) => {
      if (data && Array.isArray(data)) {
        updatePaginatedCache('userOrders', { items: data, lastVisible: null, hasMore: false });
        const top3 = data.slice(0, 3);
        setRecentOrders(top3);
        updatePaginatedCache('homeRecentOrders', top3);
      }
      setDataLoading(false);
    });

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      setDataLoading(false);
    }, 5000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [user?.uid, authLoading]);

  const formatBalance = (val: number) => {
    return Number(val || 0).toFixed(2);
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform?.toLowerCase() || '';
    if (p.includes('instagram') || p.includes('ig') || p.includes('insta') || p.includes('انستا') || p.includes('انستقرام')) return { icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' };
    if (p.includes('tiktok') || p.includes('تيك') || p.includes('تيكتوك')) return { icon: TikTokIcon, color: 'text-black', bg: 'bg-gray-100' };
    if (p.includes('facebook') || p.includes('فيسبوك') || p.includes('فيس')) return { icon: Facebook, color: 'text-blue-700', bg: 'bg-blue-50' };
    if (p.includes('youtube') || p.includes('يوتيوب') || p.includes('يوتوب')) return { icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' };
    if (p.includes('twitter') || p.includes(' x ') || p.includes('تويتر')) return { icon: XIcon, color: 'text-gray-900', bg: 'bg-gray-100' };
    if (p.includes('telegram') || p.includes('تليجرام') || p.includes('تلغرام')) return { icon: Send, color: 'text-blue-500', bg: 'bg-blue-50' };
    return { icon: Globe, color: 'text-orange-500', bg: 'bg-orange-50' };
  };

  const balances = [
    { label: 'أنفقت معنا', value: formatBalance(userData?.totalSpent || 0), icon: TrendingDown, textColor: 'text-orange-500', bg: 'bg-gray-50/80' },
    { label: 'جاري استخدامه', value: formatBalance(userData?.inProcessing || 0), icon: Clock, textColor: 'text-orange-500', bg: 'bg-gray-50/80' },
    { label: 'رصيدك الآن', value: formatBalance(userData?.balance || 0), icon: Wallet, textColor: 'text-orange-500', bg: 'bg-gray-50/80' },
  ];

  const platforms = [
    { id: 'instagram', name: 'انستقرام', sub: 'خدمات انستقرام', icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: 'tiktok', name: 'تيك توك', sub: 'خدمات تيك توك', icon: TikTokIcon, color: 'text-black', bg: 'bg-gray-100' },
    { id: 'facebook', name: 'فيسبوك', sub: 'خدمات فيسبوك', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'youtube', name: 'يوتيوب', sub: 'خدمات يوتيوب', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'twitter', name: 'تويتر (X)', sub: 'خدمات X', icon: XIcon, color: 'text-black', bg: 'bg-gray-100' },
    { id: 'telegram', name: 'تليجرام', sub: 'خدمات تليجرام', icon: Send, color: 'text-blue-400', bg: 'bg-blue-50' },
  ];

  const viewAllButtonStyle = "text-[13px] font-bold text-orange-500 px-5 py-2 rounded-xl border border-orange-100 bg-orange-50/20 hover:bg-orange-50/30 active:scale-95 transition-all outline-none uppercase tracking-wide inline-block";

  return (
    <div className="flex flex-col gap-8 pb-10" dir="rtl">
      <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden bg-white rounded-[2.5rem]">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-2 text-center mb-10 select-none">
            {balances.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="space-y-3">
                  <div className={cn("w-10 h-10 rounded-2xl mx-auto flex items-center justify-center mb-1 shadow-sm", item.bg)}>
                    <Icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{item.label}</p>
                    <p className={cn("text-base font-black leading-none", item.textColor)}>
                      ${authLoading ? '0.00' : item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Link href="/dashboard/add-funds" className="w-full block">
            <Button className="w-full h-14 rounded-2xl orange-gradient text-white text-lg font-black shadow-xl shadow-orange-500/30 mb-4 gap-3 transition-all active:scale-95 border-none flex items-center justify-center">
              <Plus className="h-6 w-6 stroke-[3]" />
              شحن الرصيد الآن
            </Button>
          </Link>

          <div className="flex justify-center mt-2">
            <div className="inline-flex items-center justify-center gap-1.5 text-[9px] font-black text-gray-400 bg-gray-50 px-6 py-2 rounded-full select-none border border-gray-100/50">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>أرخص الأسعار في المغرب لعام 2026</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="h-px bg-gray-200 w-full" />

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2 select-none">
          <div className="flex items-center gap-2.5">
             <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
             <h2 className="text-xl font-black text-gray-900 tracking-tight">اختر منصتك</h2>
          </div>
          <Link href="/dashboard/services" className={viewAllButtonStyle}>
            عرض الكل
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform, idx) => {
            const Icon = platform.icon;
            return (
              <Link key={idx} href={`/dashboard/platform/${platform.id}`} className="w-full outline-none">
                <Card className="border-none shadow-sm group overflow-hidden bg-white rounded-[2.2rem] hover:shadow-md active:scale-[0.98] transition-all">
                  <CardContent className="p-6 flex flex-col items-center text-center relative min-h-[140px] justify-center">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-inner", platform.bg)}>
                      <Icon className={cn("h-7 w-7", platform.color)} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900">{platform.name}</h3>
                    <p className="text-[10px] font-black text-orange-500 mt-1 uppercase tracking-tight">{platform.sub}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-gray-200 w-full" />

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2 select-none">
          <div className="flex items-center gap-2.5">
             <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
             <h2 className="text-xl font-black text-gray-900 tracking-tight">آخر الطلبات</h2>
          </div>
          <Link href="/dashboard/orders" className={viewAllButtonStyle}>
            عرض الكل
          </Link>
        </div>

        <div className="space-y-4 px-1 min-h-[100px] flex flex-col justify-center">
          {dataLoading && recentOrders.length === 0 ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : (
            <>
              {recentOrders.map((order, idx) => {
                const platformInfo = getPlatformIcon(order.platform || order.title);
                const Icon = platformInfo.icon;
                
                let displayStatus = order.status;
                if (displayStatus === 'قيد المراجعة' || displayStatus === 'Pending' || displayStatus === 'Processing') displayStatus = 'قيد المعالجة';

                return (
                  <div key={order.id || idx} className="bg-white p-5 rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", platformInfo.bg)}><Icon className={cn("h-5 w-5", platformInfo.color)} /></div>
                        <div className="flex flex-col text-right"><span className="text-[12px] font-black text-gray-900 leading-none">ID: #{order.apiOrderId || '...'}</span><span className="text-[9px] font-bold text-gray-300 mt-1">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-MA') : '...'}</span></div>
                      </div>
                      <div className={cn(
                        "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest", 
                        displayStatus === 'مكتمل' ? "bg-green-50 text-green-600" : 
                        displayStatus === 'قيد التنفيذ' ? "bg-blue-50 text-blue-600" : 
                        displayStatus === 'قيد المعالجة' ? "bg-slate-50 text-slate-600" :
                        displayStatus === 'ملغي' ? "bg-red-50 text-red-600" :
                        "bg-orange-50 text-orange-600"
                      )}>
                        {displayStatus}
                      </div>
                    </div>
                    <h4 className="text-[12px] font-black text-gray-800 leading-tight pr-1 line-clamp-1">{order.title}</h4>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex gap-6">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">الكمية</span>
                          <span className="text-sm font-black text-gray-700">{order.quantity?.toLocaleString() || '...'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">المبلغ</span>
                          <span className="text-lg font-black text-green-600">${Number(order.price || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      {order.link && (
                        <a 
                          href={order.link.startsWith('http') ? order.link : `https://${order.link}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1.5 text-orange-500 font-black text-[10px] px-3 py-2"
                        >
                          انتقال للرابط <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              {recentOrders.length === 0 && !dataLoading && <div className="py-10 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest">لا توجد طلبات سابقة لعرضها</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
