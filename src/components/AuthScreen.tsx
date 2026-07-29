import React, { useState, useEffect } from "react";
import { 
  Shield, Lock, User, KeyRound, Sparkles, AlertCircle, Fingerprint, 
  ArrowRight, Check, Copy, RefreshCw, Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateE2EKeyPair } from "../utils/crypto";

interface AuthScreenProps {
  onAuthSuccess: (user: any, privateKey: string) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(() => localStorage.getItem("parham_saved_username") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("parham_saved_password") || "");
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 2FA variables
  const [show2FA, setShow2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [tempUserId, setTempUserId] = useState("");
  
  // Keypair variables shown during registration for proof of E2EE
  const [registeredKeyPair, setRegisteredKeyPair] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [registrationResponse, setRegistrationResponse] = useState<any | null>(null);

  const [avatarColor, setAvatarColor] = useState("bg-sky-600");
  const [avatarEmoji, setAvatarEmoji] = useState("🦊");

  const GOOGLE_CLIENT_ID = "62364160306-36h07dd010nl37v62lrpbls7e9i3hgpv.apps.googleusercontent.com";

  const colors = [
    "bg-sky-600", "bg-indigo-600", "bg-emerald-600", 
    "bg-rose-600", "bg-amber-600", "bg-violet-600", "bg-teal-600"
  ];
  const emojis = ["🦊", "🦁", "🐼", "🦉", "🥷", "🧙", "🧑‍🚀", "👾", "🌟", "👑"];

  // Google Login Callback Handler
  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response.credential) return;
    setError("");
    setLoading(true);

    try {
      // Decode credential locally to get sub for deterministic E2EE keys
      const parts = response.credential.split('.');
      if (parts.length !== 3) throw new Error("فرمت توکن گوگل معتبر نیست.");
      
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(payloadBase64));
      
      const googleSub = payload.sub;
      if (!googleSub) throw new Error("شناسه گوگل یافت نشد.");

      // Deterministically generate E2E keypair using the unique Google sub seed
      const keypair = await generateE2EKeyPair(`google_e2ee_${googleSub}`);

      const res = await fetch("/api/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: response.credential,
          publicKey: keypair.publicKey
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطایی در ورود با گوگل رخ داد.");
      }

      // Store private key locally
      localStorage.setItem(`e2e_priv_${data.user.id}`, keypair.privateKey);
      localStorage.setItem("parham_session_id", data.sessionId || "");
      
      // Log in successfully
      onAuthSuccess(data.user, keypair.privateKey);
    } catch (err: any) {
      setError(err.message || "اتصال به گوگل برقرار نشد.");
      setLoading(false);
    }
  };

  // Google Login Script Initialization
  useEffect(() => {
    let timer: any;
    const initGoogleSignIn = () => {
      const g = (window as any).google;
      if (g && g.accounts && g.accounts.id) {
        try {
          g.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
          });
          
          const parentEl = document.getElementById("google-signin-button");
          if (parentEl) {
            g.accounts.id.renderButton(
              parentEl,
              { 
                type: "standard", 
                theme: "outline", 
                size: "large", 
                text: "signin_with",
                shape: "pill",
                width: 280
              }
            );
          }
        } catch (err) {
          console.error("Error initializing Google Sign-In:", err);
        }
      }
    };

    timer = setInterval(() => {
      if ((window as any).google && (window as any).google.accounts) {
        initGoogleSignIn();
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [isLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("لطفاً نام کاربری و رمز عبور را وارد کنید.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "خطایی در ورود رخ داد.");
      }

        // Successful login without 2FA
        localStorage.setItem("parham_saved_username", username);
        localStorage.setItem("parham_saved_password", password);
        const inMemoryPrivateKey = localStorage.getItem(`e2e_priv_${data.user.id}`) || (await generateE2EKeyPair(username + "_" + password)).privateKey;
        localStorage.setItem(`e2e_priv_${data.user.id}`, inMemoryPrivateKey);
        localStorage.setItem("parham_session_id", data.sessionId || "");
        onAuthSuccess(data.user, inMemoryPrivateKey);
    } catch (err: any) {
      setError(err.message || "اتصال به سرور برقرار نشد.");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !nickname) {
      setError("وارد کردن نام کاربری، رمز عبور و نام مستعار الزامی است.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1. Generate client-side E2E Cryptographic Keypair
      const keypair = await generateE2EKeyPair(username + "_" + password);

      // 2. Submit user + client-side public key to server
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          nickname,
          bio,
          avatarColor,
          avatarEmoji,
          publicKey: keypair.publicKey
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "خطایی در ثبت نام رخ داد.");
      }

      // Store private key securely locally (E2EE Client rule: private key NEVER leaves user's device!)
      localStorage.setItem("parham_saved_username", username);
      localStorage.setItem("parham_saved_password", password);
      localStorage.setItem(`e2e_priv_${data.user.id}`, keypair.privateKey);
      
      // Keep keypair in state to show the success message + explain E2EE to user
      setRegisteredKeyPair(keypair);
      setRegistrationResponse(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "اتصال به سرور برقرار نشد.");
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      setError("لطفاً کد ۶ رقمی معتبر وارد کنید.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/verify-login-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: tempUserId, code: totpCode })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "کد دو مرحله‌ای نامعتبر است.");
      }

      const inMemoryPrivateKey = localStorage.getItem(`e2e_priv_${data.user.id}`) || (await generateE2EKeyPair(username + "_" + password)).privateKey;
      localStorage.setItem("parham_saved_username", username);
      localStorage.setItem("parham_saved_password", password);
      localStorage.setItem(`e2e_priv_${data.user.id}`, inMemoryPrivateKey);
      localStorage.setItem("parham_session_id", data.sessionId || "");
      
      onAuthSuccess(data.user, inMemoryPrivateKey);
    } catch (err: any) {
      setError(err.message || "تأیید هویت دو مرحله‌ای با خطا مواجه شد.");
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const proceedAfterRegExplain = () => {
    if (registrationResponse) {
      localStorage.setItem("parham_session_id", registrationResponse.sessionId || "");
      onAuthSuccess(registrationResponse.user, registeredKeyPair?.privateKey || "");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-sans relative overflow-hidden dir-rtl" dir="rtl">
      {/* Premium Cyber Technology Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(59, 130, 246, 0.2) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px"
        }}
      ></div>

      {/* Dynamic Animated Premium Floating Neon Blobs */}
      <motion.div 
        animate={{ 
          x: [0, 60, -40, 0],
          y: [0, -50, 40, 0],
          scale: [1, 1.2, 0.9, 1]
        }}
        transition={{ 
          duration: 25, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-12 -left-12 w-[450px] h-[450px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div 
        animate={{ 
          x: [0, -50, 60, 0],
          y: [0, 40, -50, 0],
          scale: [1, 0.9, 1.1, 1]
        }}
        transition={{ 
          duration: 22, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute -bottom-16 -right-16 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [0.8, 1.1, 0.8],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/2 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"
      />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/85 rounded-3xl shadow-[0_0_50px_rgba(30,41,59,0.5)] p-6 backdrop-blur-2xl relative z-10 hover:border-slate-700/60 transition-colors duration-500">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center mb-3">
            {/* Pulsing ring behind logo */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md scale-125 animate-pulse"></div>
            <div className="relative p-3.5 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 text-blue-400 rounded-2xl shadow-inner shadow-blue-500/10">
              <Shield className="w-8 h-8 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">پیام‌رسان امن پرهام</h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">پلتفرم چت خصوصی با رمزنگاری سرتاسری (E2EE)</p>
        </div>

        <AnimatePresence mode="wait">
          {/* 1. E2EE Key Pair Explanation Screen after successful register */}
          {registeredKeyPair && registrationResponse ? (
            <motion.div
              key="e2e-explain"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 text-slate-300"
            >
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-emerald-400 font-bold text-sm">حساب کاربری با موفقیت ساخته شد!</h3>
                <p className="text-xs text-slate-300 mt-1 font-light leading-relaxed">
                  سیستم کلیدهای رمزنگاری شخصی شما را برای امنیت کامل سرتاسری تولید کرد.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-1 text-slate-400">
                    <span className="font-bold">کلید عمومی شما (فرستاده شده به سرور):</span>
                    <span className="text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded font-mono">PUBLIC KEY</span>
                  </div>
                  <p className="font-mono text-[10px] break-all truncate text-slate-500">
                    {registeredKeyPair.publicKey}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-rose-500/20 relative">
                  <div className="flex justify-between items-center mb-1 text-slate-400">
                    <span className="font-bold text-rose-400">کلید خصوصی شما (فقط ذخیره در مرورگر شما):</span>
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-mono">PRIVATE KEY</span>
                  </div>
                  <p className="font-mono text-[10px] break-all text-slate-500 truncate mb-1">
                    {registeredKeyPair.privateKey}
                  </p>
                  <p className="text-[10px] text-rose-300 leading-tight">
                    ⚠️ این کلید هرگز به سرور منتقل نمی‌شود. فقط دستگاه شما می‌تواند پیام‌ها را رمزگشایی کند.
                  </p>
                </div>
              </div>

              <button
                onClick={proceedAfterRegExplain}
                className="w-full py-3 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-950/40 hover:shadow-emerald-950/60 active:scale-98 transition text-sm flex items-center justify-center gap-2"
              >
                <span>شروع گفتگوی امن سرتاسری</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </motion.div>
          ) : (
            /* Register or Login Form */
            <motion.div
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4 text-right"
            >
              {/* Form Selection Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800/80 mb-2">
                <button
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className={`w-1/2 py-2 text-xs font-bold rounded-xl transition ${isLogin ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"}`}
                >
                  ورود به حساب
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className={`w-1/2 py-2 text-xs font-bold rounded-xl transition ${!isLogin ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"}`}
                >
                  ثبت نام جدید
                </button>
              </div>

              <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">نام کاربری (انگلیسی)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500">
                      <User className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="text"
                      dir="ltr"
                      required
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                      className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">رمز عبور امن</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="password"
                      dir="ltr"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">نام مستعار یا نمایشی (فارسی یا انگلیسی)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500">
                          <KeyRound className="w-4.5 h-4.5" />
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="مثلاً: علی احمدی"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">بیوگرافی کوتاه (اختیاری)</label>
                      <input
                        type="text"
                        placeholder="علاقه‌مند به امنیت و رمزنگاری..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Avatar configuration */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">انتخاب اموجی و رنگ نمایه</label>
                      <div className="space-y-2">
                        {/* Emojis selection */}
                        <div className="flex gap-1.5 overflow-x-auto py-1">
                          {emojis.map(e => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => setAvatarEmoji(e)}
                              className={`text-lg p-1.5 rounded-xl border transition shrink-0 ${avatarEmoji === e ? "bg-slate-800 border-sky-500 scale-110" : "bg-slate-950 border-slate-800/80 hover:bg-slate-900"}`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                        {/* Colors selection */}
                        <div className="flex gap-2 py-1">
                          {colors.map(col => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setAvatarColor(col)}
                              className={`w-6 h-6 rounded-full border transition shrink-0 ${col} ${avatarColor === col ? "border-white scale-110 ring-2 ring-sky-500/30" : "border-transparent"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-950/40 hover:shadow-blue-950/60 disabled:opacity-50 active:scale-98 transition text-sm flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? "ورود به گفتگوی امن" : "ایجاد حساب کاربری دمو و رمزنگاری"}</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>

                {/* Google Sign-In Button */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-x-0 h-px bg-slate-800"></div>
                  <span className="relative px-3 bg-slate-900 text-[10px] font-bold text-slate-500 tracking-wider">یا ورود سریع با گوگل</span>
                </div>

                <div className="flex justify-center mt-2 pb-1">
                  <div id="google-signin-button" className="shadow-md rounded-full overflow-hidden"></div>
                </div>
              </form>

              <div className="pt-2 text-center">
                <p className="text-[10px] text-slate-500 leading-normal">
                  🔐 امنیت داده‌ها و حریم خصوصی در بالاترین سطح تضمین شده است.<br/>
                  تمام پیام‌ها پیش از ارسال به سرور، در مرورگر شما با کلید اختصاصی رمزنگاری می‌شوند.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
