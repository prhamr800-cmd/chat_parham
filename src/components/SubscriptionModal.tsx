import React, { useState } from "react";
import { 
  X, Sparkles, Check, Zap, Crown, Shield, Star, 
  Image as ImageIcon, Mic, Brain, Languages, FileText, 
  Palette, Volume2, ArrowLeft, Lock, Heart, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onPurchasePlan: (plan: "monthly" | "quarterly" | "yearly") => Promise<void>;
  lockedFeatureName?: string;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentUser,
  onPurchasePlan,
  lockedFeatureName
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestMsg, setRequestMsg] = useState("");

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
        }, 3000);
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

  const isPlus = currentUser?.subscriptionTier === "plus";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md dir-rtl overflow-y-auto" dir="rtl">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-2xl rounded-3xl shadow-[0_0_80px_rgba(147,51,234,0.15)] overflow-hidden my-6"
        >
          {/* Header Banner */}
          <div className="relative p-6 sm:p-8 bg-gradient-to-r from-purple-950/80 via-slate-900 to-blue-950/80 border-b border-purple-500/20 text-center">
            <button
              onClick={onClose}
              className="absolute top-5 left-5 p-2 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 transition"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-3 shadow-inner">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>ارتقا به حساب کاربری ویژه Messenger Plus</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              تجربه بی‌مرز و هوشمند با <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">Plus ⭐</span>
            </h2>

            {lockedFeatureName ? (
              <p className="mt-2 text-xs sm:text-sm text-purple-200/90 font-medium max-w-lg mx-auto bg-purple-900/30 border border-purple-500/30 p-2.5 rounded-2xl">
                🔒 قابلیت <strong className="text-amber-300 font-bold">«{lockedFeatureName}»</strong> نیاز به اشتراک Plus دارد. با فعال‌سازی Plus فوراً به این قابلیت و تمامی امکانات پیشرفته دسترسی پیدا کنید.
              </p>
            ) : (
              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                دسترسی کامل و بدون محدودیت به تمام ابزارهای هوش مصنوعی، گفتگوی صوتی، تولید تصویر و شخصی‌سازی حرفه‌ای کادر پیام‌ها
              </p>
            )}
          </div>

          {success ? (
            <div className="p-12 text-center space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-black text-white">درخواست اشتراک ثبت شد!</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">{requestMsg || "درخواست شما با موفقیت به مالک پلتفرم ارسال شد. به محض تایید، حساب شما ارتقا خواهد یافت."}</p>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1 Month Plan */}
                <div
                  onClick={() => setSelectedPlan("monthly")}
                  className={`relative p-5 rounded-3xl border text-right cursor-pointer transition-all flex flex-col justify-between ${selectedPlan === "monthly" ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-950/40" : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"}`}
                >
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">پلن ماهانه</span>
                    <h3 className="text-lg font-black text-white">۱ ماهه</h3>
                    <p className="text-xs text-slate-400">مناسب برای تست و استفاده کوتاه‌مدت</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80">
                    <div className="text-xl font-black text-white">
                      ۱۵۰٬۰۰۰ <span className="text-xs font-normal text-slate-400">تومان</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">۱ ماه دسترسی کامل Plus</span>
                  </div>
                </div>

                {/* 3 Months Plan (Economic) */}
                <div
                  onClick={() => setSelectedPlan("quarterly")}
                  className={`relative p-5 rounded-3xl border text-right cursor-pointer transition-all flex flex-col justify-between ${selectedPlan === "quarterly" ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-950/40" : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"}`}
                >
                  <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-black">
                    اقتصادی‌تر
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-blue-400 block">پلن سه ماهه</span>
                    <h3 className="text-lg font-black text-white">۳ ماهه</h3>
                    <p className="text-xs text-slate-400">صرفه‌جویی مناسب با دسترسی فصلی</p>
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
                  className={`relative p-5 rounded-3xl border-2 text-right cursor-pointer transition-all flex flex-col justify-between md:-translate-y-2 ${selectedPlan === "yearly" ? "bg-gradient-to-b from-purple-950/80 to-slate-950 border-amber-400 ring-4 ring-amber-400/20 shadow-xl shadow-purple-950/60" : "bg-slate-950/80 border-purple-500/60 hover:border-amber-400/80"}`}
                >
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 text-[10px] font-black shadow-md shrink-0 whitespace-nowrap">
                    👑 بهترین ارزش خرید (محبوب‌ترین)
                  </div>

                  <div className="space-y-2 mt-2">
                    <span className="text-xs font-bold text-amber-300 block">پلن سالانه (۱۲ ماه)</span>
                    <h3 className="text-xl font-black text-white flex items-center gap-1.5">
                      <span>۱ سال کامل</span>
                      <Crown className="w-4 h-4 text-amber-400" />
                    </h3>
                    <p className="text-xs text-purple-200/80">بیشترین تخفیف + اولویت ویژه پردازش AI</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-purple-500/30">
                    <div className="text-2xl font-black text-amber-300">
                      ۱٬۰۰۰٬۰۰۰ <span className="text-xs font-normal text-slate-300">تومان</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold block mt-1">۴۴٪ تخفیف ویژه سالانه</span>
                  </div>
                </div>

              </div>

              {/* Comparison Features List */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>جدول امکانات اختصاصی Plus در مقایسه با رایگان</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800/50">
                    <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200 block">استفاده نامحدود از چتبات AI</span>
                      <span className="text-[10px] text-slate-400">بدون سقف ۱۰ پیام روزانه</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800/50">
                    <ImageIcon className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200 block">تولید تصویر با AI</span>
                      <span className="text-[10px] text-slate-400">ساخت تصاویر با کیفیت فوق‌العاده با متن</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800/50">
                    <Mic className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200 block">گفتگوی صوتی تعاملی</span>
                      <span className="text-[10px] text-slate-400">مکالمه مستقیم صوتی زنده با هوش مصنوعی</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800/50">
                    <Palette className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200 block">شخصی‌سازی کادر پیام‌ها</span>
                      <span className="text-[10px] text-slate-400">تغییر رنگ، گرادیان، حاشیه، سایه و افکت شیشه‌ای</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800/50">
                    <Brain className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200 block">حافظه و ابزارهای پیشرفته</span>
                      <span className="text-[10px] text-slate-400">ترجمه، خلاصه‌سازی و تبدیل وویس به متن</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800/50">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200 block">نشان Plus کنار اسم شما</span>
                      <span className="text-[10px] text-slate-400">نمایش وضعیت ویژه در تمامی گفتگوها</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleBuy}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-950/80 hover:shadow-purple-950 flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Crown className="w-5 h-5 text-amber-300" />
                      <span>
                        خرید اشتراک {selectedPlan === "monthly" ? "۱ ماهه (۱۵۰,۰۰۰ تومان)" : selectedPlan === "quarterly" ? "۳ ماهه (۳۵۰,۰۰۰ تومان)" : "سالانه (۱,۰۰۰,۰۰۰ تومان)"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
