
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  ArrowRight, 
  Building2, 
  History, 
  Smartphone,
  User,
  Hash,
  Coins,
  Ticket,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Info,
  Copy,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { createShippingRequest, getPaginatedDocs } from '@/firebase/db-service';
import { useAuth } from '@/firebase/hooks';
import { where } from 'firebase/firestore';
import { updatePaginatedCache, getPaginatedCache } from '@/lib/pagination-store';

interface PaginatedState {
  items: any[];
  lastVisible: any | null;
  hasMore: boolean;
}

export default function AddFundsPage() {
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState<'attijari' | 'cih' | 'cashplus' | 'barid' | 'inwi' | 'orange' | null>(null);
  const [amount, setAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [shippingsState, setShippingsState] = useState<PaginatedState>(getPaginatedCache('userShippings'));
  const { toast } = useToast();
  const { user, userData } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadHistory = useCallback(async (isInitial = false) => {
    if (!user) return;
    
    setHistoryLoading(true);
    try {
      const cursor = isInitial ? null : shippingsState.lastVisible;
      const result = await getPaginatedDocs('shippings', 10, cursor, [where('userId', '==', user.uid)], null);
      
      setShippingsState((prev: PaginatedState) => {
        const currentItems = isInitial ? [] : prev.items;
        const newItems = [...currentItems, ...result.docs];
        const uniqueItems = Array.from(new Map(newItems.map(item => [item.id || Math.random().toString(), item])).values());
        const sortedItems = uniqueItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const newState = {
          items: sortedItems,
          lastVisible: result.lastVisible,
          hasMore: result.hasMore
        };
        updatePaginatedCache('userShippings', newState);
        return newState;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  }, [user, shippingsState.lastVisible]);

  const handleTabChange = (val: string) => {
    if (val === 'history' && shippingsState.items.length === 0 && !historyLoading) {
      loadHistory(true);
    }
  };

  const bankMethods = [
    { id: 'attijari', name: 'التجاري وفا بنك', logo: 'AWB', image: '/attijari.jpg', color: 'text-amber-600', bg: 'bg-white', border: 'border-amber-200', account: '007590000817230040234264', holder: 'Younes', isAvailable: true },
    { id: 'cih', name: 'CIH Bank', logo: 'CIH', image: '/cih.png', color: 'text-slate-400', bg: 'bg-white', border: 'border-gray-100', account: '', holder: '', isAvailable: false },
    { id: 'barid', name: 'بريد بنك', logo: 'AL BARID', image: '/baridbank.jpg', color: 'text-slate-400', bg: 'bg-white', border: 'border-gray-100', account: '', holder: '', isAvailable: false },
    { id: 'cashplus', name: 'كاش بليس', logo: 'CASH PLUS', image: '/cachplus.jpeg', color: 'text-orange-600', bg: 'bg-white', border: 'border-orange-200', account: '835780030017743059590126', holder: 'Younes', isAvailable: true },
  ];

  const voucherMethods = [
    { id: 'inwi', name: 'إينوي (Inwi)', image: '/inwi.png', color: 'text-purple-600', bg: 'bg-white', border: 'border-purple-200' },
    { id: 'orange', name: 'أورنج (Orange)', image: '/orange.jpg', color: 'text-orange-500', bg: 'bg-white', border: 'border-orange-200' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ variant: "success", title: "تم النسخ بنجاح" });
  };

  const validateAmount = (val: string, isVoucher: boolean = false) => {
    const num = parseFloat(val);
    const min = isVoucher ? 10 : 20;
    if (num < min) return `الحد الأدنى للشحن هو ${min} درهم`;
    if (num > 5000) return "الحد الأقصى للشحن هو 5000 درهم";
    return null;
  };

  const handleBankSubmit = async () => {
    if (!user) return;
    const error = validateAmount(amount);
    if (error) { toast({ variant: "destructive", title: error }); return; }
    if (!senderName || !senderAccount) { toast({ variant: "destructive", title: "يرجى ملء جميع البيانات" }); return; }

    setLoading(true);
    try {
      const shippingData = {
        type: 'bank',
        bankId: method,
        bankName: bankMethods.find(m => m.id === method)?.name || 'بنك',
        amount: parseFloat(amount),
        senderName,
        senderAccount,
        userId: user.uid,
        userName: userData?.name || user.email,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      const newDocId = await createShippingRequest(user.uid, shippingData);
      const dataWithId = { ...shippingData, id: newDocId };

      setShippingsState((prev: PaginatedState) => {
        const newState = { ...prev, items: [dataWithId, ...prev.items] };
        updatePaginatedCache('userShippings', newState);
        return newState;
      });
      toast({ variant: "success", title: "تم إرسال الطلب للمراجعة" });
      setAmount(''); setSenderName(''); setSenderAccount(''); setMethod(null);
    } catch (error) { 
      toast({ variant: "destructive", title: "فشل الإرسال" }); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleVoucherSubmit = async () => {
    if (!user) return;
    const error = validateAmount(amount, true);
    if (error) { toast({ variant: "destructive", title: error }); return; }
    if (!voucherCode) { toast({ variant: "destructive", title: "يرجى إدخال رمز التعبئة" }); return; }

    setLoading(true);
    try {
      const shippingData = {
        type: 'voucher',
        company: voucherMethods.find(m => m.id === method)?.name || 'تعبئة',
        amount: parseFloat(amount),
        code: voucherCode,
        userId: user.uid,
        userName: userData?.name || user.email,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      const newDocId = await createShippingRequest(user.uid, shippingData);
      const dataWithId = { ...shippingData, id: newDocId };

      setShippingsState((prev: PaginatedState) => {
        const newState = { ...prev, items: [dataWithId, ...prev.items] };
        updatePaginatedCache('userShippings', newState);
        return newState;
      });
      toast({ variant: "success", title: "تم إرسال الرمز للمراجعة" });
      setAmount(''); setVoucherCode(''); setMethod(null);
    } catch (error) { 
      toast({ variant: "destructive", title: "فشل الإرسال" }); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!mounted) return null;

  const currentBank = bankMethods.find(m => m.id === method);
  const isVoucherMethod = voucherMethods.some(v => v.id === method);
  const isBankMethod = bankMethods.some(b => b.id === method);

  const formatBalance = (val: number) => {
    return val.toFixed(2);
  };

  return (
    <div className="space-y-6 pb-24 text-right" dir="rtl">
      <div className="flex items-center gap-2">
         <Link href="/dashboard"><button className="text-gray-400 p-0 h-10 w-10 flex items-center justify-center transition-none border-none outline-none bg-transparent active:bg-transparent"><ArrowRight className="h-5 w-5" /></button></Link>
         <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-orange-500 rounded-full" />
            <h1 className="text-xl font-black text-gray-900">شحن الرصيد</h1>
         </div>
      </div>

      <div className="px-1 space-y-6">
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 flex items-center justify-between shadow-sm">
           <div className="flex flex-col gap-1.5 text-right">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">رصيدك المتاح:</span>
              <div className="flex items-baseline gap-1">
                <h2 className="text-4xl font-black text-emerald-600 leading-tight">${formatBalance(userData?.balance || 0)}</h2>
                <span className="text-xs font-black text-gray-400">USD</span>
              </div>
           </div>
           <div className="w-16 h-16 rounded-[1.8rem] bg-orange-50 flex items-center justify-center border border-white">
              <Wallet className="h-8 w-8 text-orange-500" />
           </div>
        </div>

        <Tabs defaultValue="bank" onValueChange={handleTabChange} className="w-full" dir="rtl">
          <div className="w-full px-1 overflow-x-auto scrollbar-hide flex items-center justify-start gap-2 py-2">
            <TabsList className="bg-transparent h-auto p-0 flex items-center gap-2 border-none">
              <TabsTrigger value="bank" className="rounded-xl h-10 px-6 font-black text-xs flex items-center gap-2 border transition-colors outline-none data-[state=active]:bg-orange-500 data-[state=active]:text-white bg-white text-gray-500 border-gray-100 flex-row-reverse shadow-none hover:text-orange-500 data-[state=active]:hover:text-white"><span>تحويل بنكي</span><Building2 className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="voucher" className="rounded-xl h-10 px-6 font-black text-xs flex items-center gap-2 border transition-colors outline-none data-[state=active]:bg-orange-500 data-[state=active]:text-white bg-white text-gray-500 border-gray-100 flex-row-reverse shadow-none hover:text-orange-500 data-[state=active]:hover:text-white"><span>تعبئة (Recharge)</span><Smartphone className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl h-10 px-6 font-black text-xs flex items-center gap-2 border transition-colors outline-none data-[state=active]:bg-orange-500 data-[state=active]:text-white bg-white text-gray-500 border-gray-100 flex-row-reverse shadow-none hover:text-orange-500 data-[state=active]:hover:text-white"><span>سجل العمليات</span><History className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="bank" className="space-y-6 mt-6 outline-none">
            <div className="grid grid-cols-2 gap-4 w-full">
              {bankMethods.map((m) => (
                <button 
                  key={m.id} 
                  onClick={() => m.isAvailable && setMethod(m.id as any)} 
                  className={cn(
                    "flex flex-col items-center justify-center aspect-square rounded-[2.5rem] border transition-none gap-3 p-4 outline-none relative", 
                    method === m.id ? "border-orange-500 bg-orange-50" : "bg-white border-gray-100",
                    !m.isAvailable && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className={cn("w-20 h-14 rounded-xl flex items-center justify-center border relative overflow-hidden", m.bg, m.border, !m.isAvailable && "grayscale")}>
                    <Image src={m.image} alt={m.name} fill className="object-contain p-1.5" />
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={cn("text-[11px] font-black", !m.isAvailable ? "text-slate-400" : "text-gray-900")}>{m.name}</span>
                    {!m.isAvailable && (
                      <span className="text-[8px] font-black text-orange-500 uppercase tracking-tighter">سيتوفر قريباً</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {method && isBankMethod && currentBank && currentBank.isAvailable && (
              <div className="space-y-6 animate-in slide-in-from-bottom-5">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6 space-y-5">
                  <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                    <Info className="h-5 w-5 text-orange-500" />
                    <span className="text-xs font-black text-gray-900 uppercase">بيانات الدفع الخاصة بنا</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group">
                       <div className="flex flex-col gap-1 text-right">
                         <span className="text-[10px] font-black text-gray-400">رقم الحساب</span>
                         <span className="text-sm font-black text-gray-900 font-mono tracking-tighter">{currentBank.account}</span>
                       </div>
                       <button onClick={() => handleCopy(currentBank.account, 'rib')} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 active:text-orange-500 transition-none outline-none">
                         {copiedId === 'rib' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                       </button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                       <div className="flex flex-col gap-1 text-right">
                         <span className="text-[10px] font-black text-gray-400">اسم المستفيد</span>
                         <span className="text-sm font-black text-gray-900">{currentBank.holder}</span>
                       </div>
                       <button onClick={() => handleCopy(currentBank.holder, 'holder')} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 active:text-orange-500 transition-none outline-none">
                         {copiedId === 'holder' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                       </button>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[2.8rem] border-none shadow-sm bg-white p-8 space-y-8">
                  <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-black text-orange-800 leading-relaxed">
                      يرجى القيام بعملية التحويل أولاً قبل إرسال الطلب لتجنب الرفض. الحد الأدنى للشحن هو 20 درهم.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2 text-right">
                      <div className="flex items-center gap-2 mr-1 justify-start">
                        <User className="h-4 w-4 text-gray-400" />
                        <Label className="text-sm font-black text-gray-900 font-tajawal uppercase">اسم الحساب المرسل</Label>
                      </div>
                      <input 
                        placeholder="ياسين المغربي" 
                        value={senderName} 
                        maxLength={50}
                        onChange={(e) => setSenderName(e.target.value)} 
                        className={cn("h-14 w-full rounded-2xl bg-gray-50/50 border border-gray-100 text-right px-6 font-bold text-sm focus:border-orange-500 shadow-none outline-none text-gray-600 font-tajawal", senderName.length >= 50 && "border-red-500")} 
                      />
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="flex items-center gap-2 mr-1 justify-start">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <Label className="text-sm font-black text-gray-900 font-tajawal uppercase">رقم الحساب</Label>
                      </div>
                      <input 
                        placeholder="007 810 000..." 
                        value={senderAccount} 
                        maxLength={30}
                        onChange={(e) => setSenderAccount(e.target.value)} 
                        className={cn("h-14 w-full rounded-2xl bg-gray-50/50 border border-gray-100 text-right px-6 font-bold text-sm focus:border-orange-500 shadow-none outline-none text-gray-600 font-tajawal", senderAccount.length >= 30 && "border-red-500")} 
                      />
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="flex items-center gap-2 mr-1 justify-start">
                        <Coins className="h-4 w-4 text-gray-400" />
                        <Label className="text-sm font-black text-gray-900 font-tajawal uppercase">المبلغ بالدرهم</Label>
                      </div>
                      <input 
                        type="number" 
                        placeholder="مثال: 20" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className={cn("h-14 w-full rounded-2xl bg-gray-50/50 border border-gray-100 text-right px-6 font-bold text-sm focus:border-orange-500 shadow-none outline-none text-gray-600 font-tajawal", (parseFloat(amount) < 20 || parseFloat(amount) > 5000) && amount !== '' && "border-red-500")} 
                      />
                      <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100/50 mt-2">
                         <p className="text-[10px] font-bold text-orange-800 text-center">
                            سيتم تحويل المبلغ تلقائياً إلى الدولار وفق سعر الصرف الحالي.
                         </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleBankSubmit} 
                      disabled={loading} 
                      className="w-full h-14 rounded-2xl orange-gradient text-white text-lg font-black shadow-xl shadow-orange-500/30 border-none outline-none flex items-center justify-center gap-3 active:scale-95 transition-none active:opacity-100 font-tajawal"
                    >
                      {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <Send className="h-6 w-6" />}
                      <span>تأكيد طلب الحفظ</span>
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="voucher" className="space-y-6 mt-6 outline-none">
            <div className="grid grid-cols-2 gap-4 w-full">
              {voucherMethods.map((v) => (
                <button key={v.id} onClick={() => setMethod(v.id as any)} className={cn("flex flex-col items-center justify-center aspect-square rounded-[2.5rem] border transition-none gap-3 p-4 outline-none active:bg-orange-50", method === v.id ? "border-orange-500 bg-orange-50" : "bg-white border-gray-100")}>
                  <div className={cn("w-20 h-14 rounded-xl flex items-center justify-center border relative overflow-hidden", v.bg, v.border)}>
                    <Image src={v.image} alt={v.name} fill className="object-contain p-1.5" />
                  </div>
                  <span className="text-[11px] font-black text-gray-900">{v.name}</span>
                </button>
              ))}
            </div>
            {method && isVoucherMethod && (
              <Card className="rounded-[2.8rem] border-none shadow-sm bg-white p-8 space-y-8 animate-in slide-in-from-bottom-5">
                <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-black text-orange-800 leading-relaxed">
                    المرجو تأكد من رقم تعبئة صحيح ويكون تابع لشركة اتصالات التي اخترت. الحد الأدنى للشحن هو 10 دراهم.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2 text-right">
                    <div className="flex items-center gap-2 mr-1 justify-start">
                      <Ticket className="h-4 w-4 text-gray-400" />
                      <Label className="text-sm font-black text-gray-900 font-tajawal uppercase">رمز التعبئة</Label>
                    </div>
                    <input 
                      placeholder="أدخل الرمز المكون من 14 رقم..." 
                      value={voucherCode} 
                      maxLength={20}
                      onChange={(e) => setVoucherCode(e.target.value)} 
                      className={cn("h-14 w-full rounded-2xl bg-gray-50/50 border border-gray-100 text-right px-6 font-bold text-sm focus:border-orange-500 shadow-none outline-none text-gray-600 font-tajawal", voucherCode.length >= 20 && "border-red-500")} 
                    />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="flex items-center gap-2 mr-1 justify-start">
                      <Coins className="h-4 w-4 text-gray-400" />
                      <Label className="text-sm font-black text-gray-900 font-tajawal uppercase">المبلغ بالدرهم</Label>
                    </div>
                    <input 
                      type="number" 
                      placeholder="مثال: 10" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className={cn("h-14 w-full rounded-2xl bg-gray-50/50 border border-gray-100 text-right px-6 font-bold text-sm focus:border-orange-500 shadow-none outline-none text-gray-600 font-tajawal", (parseFloat(amount) < 10 || parseFloat(amount) > 5000) && amount !== '' && "border-red-500")} 
                    />
                    <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100/50 mt-2">
                       <p className="text-[10px] font-bold text-orange-800 text-center">
                          سيتم تحويل المبلغ تلقائياً إلى الدولار وفق سعر الصرف الحالي.
                       </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleVoucherSubmit} 
                    disabled={loading} 
                    className="w-full h-14 rounded-2xl orange-gradient text-white text-lg font-black shadow-xl shadow-orange-500/30 border-none outline-none flex items-center justify-center gap-3 active:scale-95 transition-none active:opacity-100 font-tajawal"
                  >
                    {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <Send className="h-6 w-6" />}
                    <span>تأكيد طلب التعبئة</span>
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6 outline-none">
            <div className="space-y-4">
              {historyLoading && shippingsState.items.length === 0 ? (
                <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-orange-500" /></div>
              ) : shippingsState.items.length > 0 ? (
                <>
                  {shippingsState.items.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white p-5 rounded-[2.2rem] border border-gray-50 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">{item.type === 'bank' ? <Building2 className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}</div>
                          <div className="flex flex-col text-right">
                            <span className="text-xs font-black text-gray-900">{item.type === 'bank' ? item.bankName : item.company}</span>
                            <span className="text-[9px] font-bold text-gray-300">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-MA') : 'جاري المعالجة'}</span>
                          </div>
                        </div>
                        <div className={cn(
                          "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest", 
                          item.status === 'completed' ? "bg-green-50 text-green-600" : 
                          item.status === 'rejected' ? "bg-red-50 text-red-600" : 
                          "bg-orange-50 text-orange-600"
                        )}>
                          {item.status === 'completed' ? 'مكتمل' : item.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-gray-400">المبلغ</span>
                          <span className="text-base font-black text-green-600">{item.amount} درهم</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.status === 'pending' ? <Clock className="h-3 w-3 text-orange-400" /> : item.status === 'completed' ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                          <span className="text-[9px] font-black text-gray-400">{item.status === 'pending' ? 'قيد المراجعة' : item.status === 'completed' ? 'تم الشحن' : 'تم الرفض'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {shippingsState.hasMore && shippingsState.items.length >= 10 && (
                    <button 
                      onClick={() => loadHistory()} 
                      disabled={historyLoading} 
                      className="w-full py-5 bg-white rounded-[2rem] border border-orange-100 text-orange-500 font-black text-xs flex items-center justify-center gap-2 transition-all outline-none active:scale-[0.98]"
                    >
                      {historyLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span>عرض المزيد</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <Clock className="h-10 w-10 text-gray-200 mx-auto" />
                  <p className="text-xs font-black text-gray-300">لا يوجد عمليات لعرضها</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
