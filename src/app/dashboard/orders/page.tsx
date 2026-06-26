"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Instagram, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  ListFilter, 
  Loader2, 
  Youtube, 
  Facebook, 
  Send, 
  AlertCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase/hooks';
import { getUserOrdersStream } from '@/firebase/db-service';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
);

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending_review' | 'processing' | 'completed' | 'canceled'>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = getUserOrdersStream(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredOrders = orders.filter((order: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending_review') return order.status === 'قيد المراجعة';
    if (activeTab === 'processing') return order.status === 'قيد التنفيذ' || order.status === 'قيد الانتظار';
    if (activeTab === 'completed') return order.status === 'مكتمل';
    if (activeTab === 'canceled') return order.status === 'ملغي';
    return true;
  });

  const getPlatformIcon = (platform: string) => {
    const p = platform?.toLowerCase() || '';
    if (p.includes('instagram')) return { icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' };
    if (p.includes('tiktok')) return { icon: TikTokIcon, color: 'text-gray-900', bg: 'bg-gray-100' };
    if (p.includes('facebook')) return { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' };
    if (p.includes('youtube')) return { icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' };
    if (p.includes('twitter') || p.includes(' x ')) return { icon: XIcon, color: 'text-gray-900', bg: 'bg-gray-100' };
    if (p.includes('telegram')) return { icon: Send, color: 'text-blue-400', bg: 'bg-blue-50' };
    return { icon: Instagram, color: 'text-orange-500', bg: 'bg-orange-50' };
  };

  const getTabButtonStyle = (tab: typeof activeTab) => {
    return cn(
      "rounded-xl h-10 px-6 font-black text-xs shrink-0 flex items-center gap-2 border transition-all outline-none focus:outline-none ring-0",
      activeTab === tab 
        ? "bg-orange-500 text-white border-orange-500 shadow-md" 
        : "bg-white text-gray-500 border-gray-100 hover:text-orange-500 hover:bg-orange-50/50"
    );
  };

  return (
    <div className="space-y-6 pb-24 text-right" dir="rtl">
      <div className="flex items-center gap-2">
         <Link href="/dashboard"><button className="text-gray-400 p-0 h-10 w-10 flex items-center justify-center transition-none outline-none"><ArrowRight className="h-5 w-5" /></button></Link>
         <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-orange-500 rounded-full" />
            <h1 className="text-xl font-black text-gray-900">طلباتي</h1>
         </div>
      </div>

      <div className="w-full px-1 overflow-x-auto scrollbar-hide flex items-center justify-start gap-2 mb-6 py-2">
        <button onClick={() => setActiveTab('all')} className={getTabButtonStyle('all')}><ListFilter className="h-4 w-4" /> الكل</button>
        <button onClick={() => setActiveTab('pending_review')} className={getTabButtonStyle('pending_review')}><AlertCircle className="h-4 w-4" /> قيد المراجعة</button>
        <button onClick={() => setActiveTab('processing')} className={getTabButtonStyle('processing')}><Clock className="h-4 w-4" /> قيد التنفيذ</button>
        <button onClick={() => setActiveTab('completed')} className={getTabButtonStyle('completed')}><CheckCircle2 className="h-4 w-4" /> المكتملة</button>
        <button onClick={() => setActiveTab('canceled')} className={getTabButtonStyle('canceled')}><XCircle className="h-4 w-4" /> ملغي</button>
      </div>

      <div className="space-y-4 px-1">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-orange-500" /></div>
        ) : filteredOrders.length > 0 ? (
          <>
            {filteredOrders.map((order, idx) => {
              const platformInfo = getPlatformIcon(order.platform);
              const Icon = platformInfo.icon;
              return (
                <div key={idx} className="bg-white p-5 rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", platformInfo.bg)}><Icon className={cn("h-5 w-5", platformInfo.color)} /></div>
                      <div className="flex flex-col text-right"><span className="text-[12px] font-black text-gray-900 leading-none">ID: #{order.apiOrderId || '...'}</span><span className="text-[9px] font-bold text-gray-300 mt-1">{new Date(order.createdAt).toLocaleDateString('ar-MA')}</span></div>
                    </div>
                    <div className={cn(
                      "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest", 
                      order.status === 'مكتمل' ? "bg-green-50 text-green-600" : 
                      order.status === 'قيد التنفيذ' ? "bg-blue-50 text-blue-600" : 
                      order.status === 'قيد المراجعة' ? "bg-slate-50 text-slate-600" :
                      order.status === 'ملغي' ? "bg-red-50 text-red-600" :
                      "bg-orange-50 text-orange-600"
                    )}>
                      {order.status}
                    </div>
                  </div>
                  <h4 className="text-[12px] font-black text-gray-800 leading-tight pr-1 line-clamp-1">{order.title}</h4>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div className="flex flex-col"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">المبلغ الإجمالي</span><span className="text-lg font-black text-green-600">${order.price.toFixed(2)}</span></div>
                    <a href={order.link.startsWith('http') ? order.link : `https://${order.link}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-orange-500 font-black text-[10px] px-3 py-2">انتقال للرابط <ArrowUpRight className="h-3 w-3" /></a>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="py-20 text-center space-y-3">
            <Clock className="h-10 w-10 text-gray-200 mx-auto" />
            <p className="text-sm font-black text-gray-400">لا توجد طلبات حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
