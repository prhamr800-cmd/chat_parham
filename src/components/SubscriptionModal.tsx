import React, { useState } from "react";
import { 
  X, Sparkles, Check, Zap, Crown, Shield, Star, 
  Image as ImageIcon, Mic, Brain, Languages, FileText, 
  Palette, Volume2, ArrowLeft, Lock, Heart, CheckCircle2, Copy
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
      return "اشتراک همیشگی Plus (مادام‌العمر)";
    }
    const plan = currentUser?.subscriptionPlan;
    if (plan === "yearly") return "پلاس یک ساله (۱۲ ماهه)";
    if (plan === "quarterly") return "پلاس سه ماهه";
    if (plan === "monthly") return "پلاس یک ماهه";
    if (plan === "permanent") return "پلاس همیشگی (مادام‌العمر)";
    return "اشتراک Plus فعال";
  };

  const isGiftedByAdmin = currentUser?.grantedByAdmin || currentUser?.subscriptionPlan === "admin_grant" || currentUser?.role === "owner";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md dir-rtl overflow-y-auto" dir="rtl">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-slate-900/95 border border-purple-500/30 backdrop-blur-2xl rounded-3xl shadow-[0_0_80px_rgba(147,51,234,0.15)] overflow-hidden my-6"
        >
          {/* Header Banner */}
          <div className="relative p-6 sm:p-8 bg-gradient-to-r from-purple-950/80 via-slate-900 to-amber-950/40 border-b border-purple-500/20 text-center">
            <button
              onClick={onClose}
              className="absolute top-5 left-5 p-2 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 transition"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3 shadow-inner">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>وضعیت اشتراک ویژه Messenger Plus ⭐</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isPlusUser ? "اشتراک Plus شما فعال می‌باشد ⭐" : <>تجربه بی‌مرز با <span className="bg-gradient-to-r from-amber-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Messenger Plus ⭐</span></>}
            </h2>

            {lockedFeatureName && !isPlusUser && (
              <p className="mt-2 text-xs sm:text-sm text-purple-200/90 font-medium max-w-lg mx-auto bg-purple-900/30 border border-purple-500/30 p-2.5 rounded-2xl">
                🔒 قابلیت <strong className="text-amber-300 font-bold">«{lockedFeatureName}»</strong> نیاز به اشتراک Plus دارد. با دریافت Plus فوراً دسترسی پیدا کنید.
              </p>
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
                    <span className="text-xs text-amber-400 font-bold block">اشتراک فعال شما:</span>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <span>{getPlanName()}</span>
                      <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                    </h3>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/70 border border-amber-500/20 rounded-2xl space-y-2 text-xs leading-relaxed text-slate-200">
                  {isGiftedByAdmin && (
                    <div className="flex items-center gap-2 text-amber-300 font-bold pb-2 border-b border-slate-800">
                      <span>🎁</span>
                      <span>مدیریت این اشتراک را به شما اهدا کرده است.</span>
                    </div>
                  )}
                  <p className="text-slate-300">
                    با داشتن این اشتراک، تمامی ابزارهای هوش مصنوعی، کادرهای نئونی فانتزی، نشان طلایی ⭐ در چت‌ها و تمامی قابلیت‌های اختصاصی پلتفرم برای شما فعال است.
                  </p>
                </div>
              </div>

              {/* Active Features */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>دسترسی‌های فعال حساب کاربری Plus شما:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/50 flex items-center gap-2">
                    <span className="text-amber-400">⭐</span>
                    <span>ستاره طلایی پلاس در کنار نام شما</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/50 flex items-center gap-2">
                    <span className="text-cyan-400">💡</span>
                    <span>حاشیه‌های نئونی و سیاه فانتزی حباب پیام‌ها</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/50 flex items-center gap-2">
                    <span className="text-purple-400">🤖</span>
                    <span>استفاده نامحدود از هوش مصنوعی و گفتگوی صوتی</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/50 flex items-center gap-2">
                    <span className="text-emerald-400">🎨</span>
                    <span>پوسته‌های ویژه و اختصاصی سیستم</span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
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
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">{requestMsg || "درخواست شما با موفقیت به مدیریت پلتفرم ارسال شد. پس از تایید فیش واریزی، حساب شما ارتقا خواهد یافت."}</p>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1 Month Plan */}
                <div
                  onClick={() => setSelectedPlan("monthly")}
                  className={`relative p-5 rounded-3xl border text-right cursor-pointer transition-all flex flex-col justify-between ${selectedPlan === "monthly" ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-950/40" : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"}`}
                >
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">پلاس یک ماهه</span>
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
                    <span className="text-xs font-bold text-blue-400 block">پلاس سه ماهه</span>
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
                    👑 پلاس یک ساله (محبوب‌ترین)
                  </div>

                  <div className="space-y-2 mt-2">
                    <span className="text-xs font-bold text-amber-300 block">پلاس یک ساله (۱۲ ماه)</span>
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

              {/* Bank Card Payment Box */}
              <div className="p-5 bg-gradient-to-r from-slate-950 via-purple-950/30 to-slate-950 border border-amber-500/40 rounded-3xl space-y-3.5 text-right shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-2">
                    💳 شماره کارت جهت واریز مبلغ اشتراک
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
                    <strong>راهنما:</strong> پس از پرداخت، رسید خود را برای مدیریت ارسال کرده و اشتراک خود را دریافت کنید
                  </span>
                </div>
              </div>

              {/* Purchase Action Button */}
              <div className="pt-2">
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
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
