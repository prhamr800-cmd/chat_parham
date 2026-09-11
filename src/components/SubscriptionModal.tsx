import React, { useState } from "react";
import { 
  X, Sparkles, Check, Zap, Crown, Shield, Star, 
  Image as ImageIcon, Mic, Brain, Languages, FileText, 
  Palette, Volume2, ArrowLeft, Lock, Heart, CheckCircle2, Copy,
  Eye, Video, Cpu, Code2, AlertTriangle, Layers, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onPurchasePlan: (plan: "monthly" | "quarterly" | "yearly") => Promise<void>;
  lockedFeatureName?: string;
  appLanguage?: 'fa' | 'en';
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentUser,
  onPurchasePlan,
  lockedFeatureName,
  appLanguage = 'fa'
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly" | "yearly">("yearly");
  const [activeTab, setActiveTab] = useState<"plans" | "ai_rates" | "comparison">("plans");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestMsg, setRequestMsg] = useState("");
  const [cardCopied, setCardCopied] = useState(false);

  if (!isOpen) return null;

  const handleBuy = async () => {
    if (!currentUser) return;
    setLoading(true);
    setRequestMsg("");
    try {
      const response = await fetch("/api/request-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          plan: selectedPlan
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(true);
        setRequestMsg(data.message || "درخواست اشتراک Plus شما ارسال شد و پس از تایید مالک فعال خواهد شد.");
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 4000);
      } else {
        alert(data.error || "خطا در ارسال درخواست اشتراک.");
      }
    } catch (e) {
      console.error(e);
      alert("خطا در ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCard = () => {
    try {
      navigator.clipboard.writeText("6037998276023370");
      setCardCopied(true);
      setTimeout(() => setCardCopied(false), 2500);
    } catch (e) {}
  };

  const isPlusUser = currentUser?.subscriptionTier === "plus" || currentUser?.role === "owner" || currentUser?.role === "admin" || currentUser?.username?.toLowerCase() === "parham";

  const getPlanName = () => {
    if (currentUser?.role === "owner" || currentUser?.username?.toLowerCase() === "parham") {
      return "اشتراک همیشگی Plus (مادام‌العمر - ویژه پرهام رضایی)";
    }
    const plan = currentUser?.subscriptionPlan;
    if (plan === "yearly") return "پلاس یک ساله (۱۲ ماهه)";
    if (plan === "quarterly") return "پلاس سه ماهه";
    if (plan === "monthly") return "پلاس یک ماهه";
    if (plan === "permanent") return "پلاس همیشگی (مادام‌العمر)";
    return "اشتراک Plus فعال ⭐";
  };

  const isGiftedByAdmin = currentUser?.grantedByAdmin || currentUser?.subscriptionPlan === "admin_grant" || currentUser?.role === "owner";

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto ${appLanguage === 'fa' ? 'dir-rtl' : 'dir-ltr'}`} dir={appLanguage === 'fa' ? 'rtl' : 'ltr'}>
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-slate-900/95 border border-purple-500/30 backdrop-blur-2xl rounded-3xl shadow-[0_0_80px_rgba(147,51,234,0.2)] overflow-hidden my-4"
        >
          {/* Header Banner */}
          <div className="relative p-5 sm:p-7 bg-gradient-to-r from-purple-950/90 via-slate-900 to-amber-950/50 border-b border-purple-500/20 text-center">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 transition"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3 shadow-inner">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>ارتقا به حساب ارشد Messenger Plus ⭐</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              {isPlusUser ? "اشتراک Plus شما فعال است ⭐" : <>تجربه بی‌مرز با <span className="bg-gradient-to-r from-amber-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Messenger Plus ⭐</span></>}
            </h2>

            {/* Creator Badge */}
            <div className="mt-2 text-[11px] text-amber-200/90 font-bold inline-flex items-center justify-center gap-1.5 bg-slate-950/70 border border-amber-500/30 px-3 py-1 rounded-full">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>توسعه، طراحی و ایده‌پردازی توسط: <strong className="text-white">پرهام رضایی (Parham Rezaei)</strong></span>
            </div>

            {lockedFeatureName && !isPlusUser && (
              <p className="mt-3 text-xs text-purple-200/90 font-medium max-w-lg mx-auto bg-purple-900/40 border border-purple-500/30 p-2.5 rounded-2xl">
                🔒 دسترسی به قابلیت <strong className="text-amber-300 font-bold">«{lockedFeatureName}»</strong> مستلزم داشتن اشتراک Plus می‌باشد.
              </p>
            )}

            {/* Modal Tabs */}
            {!isPlusUser && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-purple-500/20 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("plans")}
                  className={`px-4 py-2 rounded-2xl transition flex items-center gap-1.5 ${activeTab === "plans" ? "bg-amber-500 text-slate-950 font-black shadow-md" : "bg-slate-950/60 text-slate-300 hover:bg-slate-800"}`}
                >
                  <Crown className="w-4 h-4" />
                  <span>پلن‌ها و قیمت</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("ai_rates")}
                  className={`px-4 py-2 rounded-2xl transition flex items-center gap-1.5 ${activeTab === "ai_rates" ? "bg-purple-600 text-white font-black shadow-md" : "bg-slate-950/60 text-slate-300 hover:bg-slate-800"}`}
                >
                  <Brain className="w-4 h-4 text-purple-300" />
                  <span>نرخ و مدل‌های AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("comparison")}
                  className={`px-4 py-2 rounded-2xl transition flex items-center gap-1.5 ${activeTab === "comparison" ? "bg-indigo-600 text-white font-black shadow-md" : "bg-slate-950/60 text-slate-300 hover:bg-slate-800"}`}
                >
                  <Layers className="w-4 h-4 text-indigo-300" />
                  <span>مقایسه رایگان / پلاس</span>
                </button>
              </div>
            )}
          </div>

          {/* If User Already Has Active Plus / Pro Subscription */}
          {isPlusUser ? (
            <div className="p-6 sm:p-8 space-y-6 text-right">
              <div className="p-6 bg-gradient-to-br from-amber-500/10 via-purple-950/40 to-slate-950 border border-amber-500/30 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-4 left-4 text-4xl opacity-20 pointer-events-none select-none">👑</div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center text-amber-400 text-2xl shadow-inner">
                    ⭐
                  </div>
                  <div>
                    <span className="text-xs text-amber-400 font-bold block">وضعیت اشتراک فعال شما:</span>
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>{getPlanName()}</span>
                      <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                    </h3>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/70 border border-amber-500/20 rounded-2xl space-y-2 text-xs leading-relaxed text-slate-200">
                  {isGiftedByAdmin && (
                    <div className="flex items-center gap-2 text-amber-300 font-bold pb-2 border-b border-slate-800">
                      <span>🎁</span>
                      <span>ارتقای پلاس توسط مدیریت پلتفرم (پرهام رضایی) فعال گردیده است.</span>
                    </div>
                  )}
                  <p className="text-slate-300">
                    تمامی ابزارهای هوش مصنوعی (مدل تفکر عمیق، پردازش تصویر و ویدیو، پاسخ فوق سریع)، حاشیه‌های نئونی فانتزی، نشان ⭐ طلایی و امکانات نامحدود رسانه‌ای برای شما فعال می‌باشد.
                  </p>
                </div>
              </div>

              {/* Active Features List */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>دسترسی‌های فعال حساب Plus شما:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/50 flex items-center gap-2">
                    <span className="text-amber-400">⭐</span>
                    <span>نشان طلایی پلاس کنار نام در چت‌ها و گروه‌ها</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/50 flex items-center gap-2">
                    <span className="text-cyan-400">💡</span>
                    <span>کادرهای نئونی فانتزی، دارک زمردی و طلایی پیام‌ها</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/50 flex items-center gap-2">
                    <span className="text-purple-400">🧠</span>
                    <span>استفاده نامحدود از AI (تفکر بالا، تصویر و ویدیو)</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/50 flex items-center gap-2">
                    <span className="text-emerald-400">🎙️</span>
                    <span>چت صوتی زنده با هوش مصنوعی و تبدیل ویس به متن</span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition border border-slate-700"
                >
                  بستن پنجره
                </button>
              </div>
            </div>
          ) : success ? (
            <div className="p-12 text-center space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-black text-white">درخواست اشتراک ثبت شد!</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">{requestMsg || "درخواست شما با موفقیت به مدیریت پلتفرم (پرهام رضایی) ارسال شد. پس از بررسی، حساب شما ارتقا می‌یابد."}</p>
            </div>
          ) : (
            <div className="p-5 sm:p-7 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              {/* TAB 1: PURCHASE PLANS */}
              {activeTab === "plans" && (
                <>
                  {/* Plans Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* 1 Month Plan */}
                    <div
                      onClick={() => setSelectedPlan("monthly")}
                      className={`relative p-5 rounded-3xl border text-right cursor-pointer transition-all flex flex-col justify-between ${selectedPlan === "monthly" ? "bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-950/40" : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"}`}
                    >
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-400 block">پلاس یک ماهه</span>
                        <h3 className="text-lg font-black text-white">۱ ماهه</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">تست اولیه و دسترسی به تمام ابزارهای هوش مصنوعی و امکانات</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800/80">
                        <div className="text-xl font-black text-white">
                          ۱۵۰٬۰۰۰ <span className="text-xs font-normal text-slate-400">تومان</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">۱ ماه دسترسی کامل بدون محدودیت</span>
                      </div>
                    </div>

                    {/* 3 Months Plan (Economic) */}
                    <div
                      onClick={() => setSelectedPlan("quarterly")}
                      className={`relative p-5 rounded-3xl border text-right cursor-pointer transition-all flex flex-col justify-between ${selectedPlan === "quarterly" ? "bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-950/40" : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"}`}
                    >
                      <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-black">
                        اقتصادی و محبوب
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-bold text-blue-400 block">پلاس سه ماهه</span>
                        <h3 className="text-lg font-black text-white">۳ ماهه</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">صرفه‌جویی عالی با دسترسی فصلی به مدل‌های AI</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800/80">
                        <div className="text-xl font-black text-white">
                          ۳۵۰٬۰۰۰ <span className="text-xs font-normal text-slate-400">تومان</span>
                        </div>
                        <span className="text-[10px] text-blue-400 font-bold block mt-1">ماهی ۱۱۶ هزار تومان</span>
                      </div>
                    </div>

                    {/* 12 Months Plan (Best Value - Highlighted) */}
                    <div
                      onClick={() => setSelectedPlan("yearly")}
                      className={`relative p-5 rounded-3xl border-2 text-right cursor-pointer transition-all flex flex-col justify-between md:-translate-y-1 ${selectedPlan === "yearly" ? "bg-gradient-to-b from-purple-950/80 to-slate-950 border-amber-400 ring-4 ring-amber-400/20 shadow-xl shadow-purple-950/60" : "bg-slate-950/80 border-purple-500/60 hover:border-amber-400/80"}`}
                    >
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 text-[10px] font-black shadow-md shrink-0 whitespace-nowrap">
                        👑 پیشنهاد ویژه پلاس (۴۴٪ تخفیف)
                      </div>

                      <div className="space-y-2 mt-2">
                        <span className="text-xs font-bold text-amber-300 block">پلاس یک ساله (۱۲ ماه)</span>
                        <h3 className="text-xl font-black text-white flex items-center gap-1.5">
                          <span>۱ سال کامل</span>
                          <Crown className="w-4 h-4 text-amber-400" />
                        </h3>
                        <p className="text-xs text-purple-200/80">بیشترین تخفیف + اولویت ویژه پردازش و ساخت ویدیو/تصویر</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-purple-500/30">
                        <div className="text-2xl font-black text-amber-300">
                          ۱٬۰۰۰٬۰۰۰ <span className="text-xs font-normal text-slate-300">تومان</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold block mt-1">ارزش فوق‌العاده با اولویت سرور</span>
                      </div>
                    </div>

                  </div>

                  {/* Bank Card Payment Box */}
                  <div className="p-5 bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 border border-amber-500/40 rounded-3xl space-y-3.5 text-right shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <span className="text-xs font-black text-amber-300 flex items-center gap-2">
                        💳 شماره کارت جهت واریز وجه اشتراک
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">به نام مهناز محمدی</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30">
                      <div className="font-mono text-base sm:text-lg font-black text-amber-400 tracking-wider dir-ltr select-all">
                        6037 - 9982 - 7602 - 3370
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCard}
                        className="w-full sm:w-auto px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {cardCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">شماره کارت کپی شد!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>کپی شماره کارت</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
                      <span className="text-base shrink-0 mt-0.5">📌</span>
                      <span>
                        <strong>نحوه فعال‌سازی:</strong> پس از کارت به کارت مبلغ اشتراک، دکمه ثبت درخواست زیر را بفشارید یا فیش واریز را برای مدیریت ارسال نمایید.
                      </span>
                    </div>
                  </div>

                  {/* Purchase Action Button */}
                  <div className="pt-1">
                    <button
                      onClick={handleBuy}
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 hover:from-purple-500 hover:via-pink-500 hover:to-amber-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-950/80 hover:shadow-purple-950 flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Crown className="w-5 h-5 text-amber-300" />
                          <span>
                            ثبت درخواست اشتراک {selectedPlan === "monthly" ? "۱ ماهه (۱۵۰,۰۰۰ تومان)" : selectedPlan === "quarterly" ? "۳ ماهه (۳۵۰,۰۰۰ تومان)" : "سالانه (۱,۰۰۰,۰۰۰ تومان)"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* TAB 2: AI MODELS RATES & QUOTAS EXPLANATION */}
              {activeTab === "ai_rates" && (
                <div className="space-y-4 text-right">
                  <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl">
                    <h3 className="text-sm font-black text-amber-300 flex items-center gap-2 mb-1">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span>توضیح کامل نرخ‌ها، توکن‌ها و سقف مدل‌های هوش مصنوعی</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      پیام‌رسان پرهام از پیشرفته‌ترین مدل‌های هوش مصنوعی جهان (Gemini 3 Series & Veo) برای پاسخ‌دهی، استدلال منطقی و پردازش چندرسانه‌ای بهره می‌برد.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Model 1: Reasoning & High Thinking */}
                    <div className="p-4 bg-slate-950/80 border border-purple-500/40 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-purple-400" />
                          <h4 className="text-xs font-bold text-white">۱. مدل تفکر بالا و استدلال عمیق (Gemini Thinking / Reasoning)</h4>
                        </div>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-lg font-mono">Up to 4,000 Thinking Tokens</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        طراحی شده برای حل مسائل پیچیده کدنویسی، ریاضیات، تحلیل منطقی گام‌به‌گام و تصمیم‌گیری‌های حساس. این مدل قبل از ارائه پاسخ نهایی، مرحله تفکر عمیق (Thinking Chain) طی می‌کند.
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 font-medium">
                        <span>سقف حساب رایگان: <strong className="text-rose-400">۱ درخواست در روز</strong></span>
                        <span>اشتراک Plus: <strong className="text-emerald-400">نامحدود + اولویت پردازش Pro</strong></span>
                      </div>
                    </div>

                    {/* Model 2: Multimodal Vision & Video */}
                    <div className="p-4 bg-slate-950/80 border border-cyan-500/40 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-xs font-bold text-white">۲. پردازش تصویر و ویدیو (Multimodal Vision & Video)</h4>
                        </div>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-lg font-mono">Image & Video Understanding</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        توانایی خواندن متن از روی تصاویر (OCR)، تحلیل رویدادهای فریم به فریم در ویدیوها، تشخیص اشیاء، خلاصه‌سازی اسناد تصویری و پاسخ به سوالات از روی فایل‌های رسانه‌ای.
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 font-medium">
                        <span>سقف حساب رایگان: <strong className="text-rose-400">غیرفعال</strong></span>
                        <span>اشتراک Plus: <strong className="text-emerald-400">نامحدود (فایل‌های تصویر و ویدیو)</strong></span>
                      </div>
                    </div>

                    {/* Model 3: Ultra Fast Model */}
                    <div className="p-4 bg-slate-950/80 border border-amber-500/40 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white">۳. پاسخ فوق سریع و گفتگوهای روزمره (Gemini 3.6 Flash Fast)</h4>
                        </div>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-mono">Sub-500ms Latency</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        پاسخ‌دهی صمیمی و آنی به سوالات عمومی، ترجمه متون، ساخت خلاصه‌ها و گفتگوهای روزمره با سرعت فوق‌العاده بالا.
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 font-medium">
                        <span>سقف حساب رایگان: <strong className="text-amber-400">۱۰ درخواست در روز</strong></span>
                        <span>اشتراک Plus: <strong className="text-emerald-400">نامحدود</strong></span>
                      </div>
                    </div>

                    {/* Model 4: Image & Video Generation */}
                    <div className="p-4 bg-slate-950/80 border border-pink-500/40 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-pink-400" />
                          <h4 className="text-xs font-bold text-white">۴. ساخت و ویرایش تصویر و ویدیو (Gemini Flash Image & Veo)</h4>
                        </div>
                        <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-lg font-mono">1K/2K High Res</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        تولید عکس‌های هنری دیجیتال، طراحی تصاویر بندانگشتی و ویرایش عکس‌ها با نسبت ابعاد متغیر 1:1، 16:9 و 9:16.
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 font-medium">
                        <span>سقف حساب رایگان: <strong className="text-rose-400">۲ عکس در روز</strong></span>
                        <span>اشتراک Plus: <strong className="text-emerald-400">نامحدود با بالاترین کیفیت</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DETAILED FREE VS PLUS FEATURE COMPARISON TABLE */}
              {activeTab === "comparison" && (
                <div className="space-y-4 text-right">
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
                    <h3 className="text-xs font-black text-white flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>جدول کامل مقایسه قابلیت‌های حساب رایگان با اشتراک Plus ⭐</span>
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-2 px-3 text-right">قابلیت و ابزار</th>
                            <th className="py-2 px-3 text-center text-slate-400">حساب رایگان</th>
                            <th className="py-2 px-3 text-center text-amber-400 font-bold">اشتراک Plus ⭐</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/60 text-slate-300">
                          <tr>
                            <td className="py-2.5 px-3 font-medium text-white">مدل‌های AI استدلال عمیق (Reasoning)</td>
                            <td className="py-2.5 px-3 text-center text-rose-400">محدود (۱ بار/روز)</td>
                            <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">نامحدود (پشتیبانی Pro)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-medium text-white">پردازش تصویر و ویدیو با AI</td>
                            <td className="py-2.5 px-3 text-center text-slate-500">غیرفعال</td>
                            <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">نامحدود</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-medium text-white">نشان طلایی ⭐ کنار اسم در چت‌ها</td>
                            <td className="py-2.5 px-3 text-center text-slate-500">ندارد</td>
                            <td className="py-2.5 px-3 text-center text-amber-300 font-bold">فعال با ستاره درخشان ⭐</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-medium text-white">حاشیه‌های نئونی و فانتزی پیام‌ها</td>
                            <td className="py-2.5 px-3 text-center text-slate-400">حاشیه معمولی</td>
                            <td className="py-2.5 px-3 text-center text-cyan-300 font-bold">نئون بنفش، زمردی، سایبرپانک و طلایی</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-medium text-white">تبدیل ویس به متن و چت صوتی</td>
                            <td className="py-2.5 px-3 text-center text-rose-400">۲ بار در روز</td>
                            <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">نامحدود</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-medium text-white">تولید تصویر با کیفیت با Gemini Image</td>
                            <td className="py-2.5 px-3 text-center text-rose-400">۲ عکس در روز</td>
                            <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">نامحدود با رزولوشن high</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-medium text-white">پیام‌رسانی انبوه و گروهی</td>
                            <td className="py-2.5 px-3 text-center text-slate-300">استاندارد</td>
                            <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">اولویت بالادستگاهی بدون تاخیر</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Developer Attribution Box */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-base">👨‍💻</span>
                  <span>طراح و سازنده پلتفرم: <strong className="text-white font-bold">پرهام رضایی</strong></span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Developed by Parham Rezaei</span>
              </div>

            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
