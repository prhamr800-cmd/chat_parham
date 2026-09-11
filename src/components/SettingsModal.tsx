import React, { useState, useEffect } from "react";
import { 
  X, User, Smartphone, ShieldAlert, Palette, Shield, Check, Copy, Trash, Save, LogOut, Lock, Laptop,
  Code, Key, Cpu, Terminal, RefreshCw, Download, Database, Globe
} from "lucide-react";
import { themes, ThemeStyle } from "../utils/theme";

interface SettingsModalProps {
  currentUser: any;
  currentTheme: string;
  onClose: () => void;
  onUpdateProfile: (updatedData: any) => void;
  onLogout: () => void;
  users: { [id: string]: any };
  onUnblockUser: (blockedId: string) => void;
  isLowRamMode?: boolean;
  onToggleLowRamMode?: () => void;
  onOpenSubscription?: (featureName?: string) => void;
  appLanguage?: 'fa' | 'en';
  onToggleLanguage?: (lang: 'fa' | 'en') => void;
}

export default function SettingsModal({ 
  currentUser, currentTheme, onClose, onUpdateProfile, onLogout, users, onUnblockUser,
  isLowRamMode = false, onToggleLowRamMode, onOpenSubscription, appLanguage = 'fa', onToggleLanguage
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'privacy' | 'security' | 'blocks' | 'password'>('profile');
  const isRedTheme = currentTheme === 'telegram';
  
  // Profile state
  const [nickname, setNickname] = useState(currentUser.nickname);
  const [bio, setBio] = useState(currentUser.bio || "");
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor);
  const [avatarEmoji, setAvatarEmoji] = useState(currentUser.avatarEmoji);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || "");
  const [bubbleBorderFrame, setBubbleBorderFrame] = useState(currentUser.bubbleBorderFrame || "default");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const handleBubbleBorderSelect = async (frameId: string) => {
    if (frameId !== 'default' && currentUser?.subscriptionTier !== 'plus' && currentUser?.role !== 'owner') {
      if (onOpenSubscription) {
        onOpenSubscription("کادرهای نئونی و فانتزی پیام‌ها");
      }
      return;
    }
    setBubbleBorderFrame(frameId);
    try {
      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          bubbleBorderFrame: frameId
        })
      });
      const data = await response.json();
      if (response.ok) {
        onUpdateProfile(data.user);
      }
    } catch (e) {
      console.error("Bubble border select error", e);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("حداکثر حجم فایل تصویر باید ۵ مگابایت باشد.");
      return;
    }

    setIsUploadingAvatar(true);
    setProfileMessage("در حال آپلود تصویر پروفایل جدید...");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileData: base64data,
            userId: currentUser.id
          })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setAvatarUrl(data.fileUrl);
          setProfileMessage("تصویر آپلود شد! دکمه ذخیره تغییرات را در پایین بزنید.");
        } else {
          setProfileMessage(`خطا در آپلود عکس: ${data.error || "خطای ناشناخته"}`);
        }
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Avatar upload error:", err);
      setProfileMessage("خطا در ارتباط با سرور برای آپلود.");
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatarUrl = () => {
    setAvatarUrl("");
    setProfileMessage("تصویر سفارشی برداشته شد. برای تایید ذخیره کنید.");
  };

  // Privacy states
  const [privacyLastSeen, setPrivacyLastSeen] = useState(currentUser.privacyLastSeen || 'everyone');
  const [privacyOnlineStatus, setPrivacyOnlineStatus] = useState(currentUser.privacyOnlineStatus || 'everyone');
  const [privacyProfilePhoto, setPrivacyProfilePhoto] = useState(currentUser.privacyProfilePhoto || 'everyone');
  const [privacyAllowMessages, setPrivacyAllowMessages] = useState(currentUser.privacyAllowMessages || 'everyone');
  const [privacyAllowGroups, setPrivacyAllowGroups] = useState(currentUser.privacyAllowGroups || 'everyone');
  const [privacySendSeen, setPrivacySendSeen] = useState(currentUser.privacySendSeen !== false);
  const [privacyHideTyping, setPrivacyHideTyping] = useState(currentUser.privacyHideTyping === true);
  const [isAppPasscodeEnabled, setIsAppPasscodeEnabled] = useState(currentUser.isAppPasscodeEnabled === true);
  const [appPasscode, setAppPasscode] = useState(currentUser.appPasscode || "");
  const [terminatedSessions, setTerminatedSessions] = useState(false);
  const [privacyMessage, setPrivacyMessage] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/sessions?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentUser.id]);

  const handleTerminateSession = async (sessId: string) => {
    try {
      const res = await fetch("/api/terminate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, sessionId: sessId })
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setPrivacyMessage("نشست مورد نظر با موفقیت قطع گردید.");
        setTimeout(() => setPrivacyMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error terminating session:", err);
    }
  };

  const handleTerminateOtherSessions = async () => {
    const currentSessionId = localStorage.getItem("parham_session_id") || "";
    try {
      const res = await fetch("/api/terminate-other-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, currentSessionId })
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setPrivacyMessage("تمامی نشست‌های دیگر با موفقیت قطع گردیدند.");
        setTimeout(() => setPrivacyMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error terminating other sessions:", err);
    }
  };

  const [isExportingData, setIsExportingData] = useState(false);

  const handleExportUserData = async () => {
    try {
      setIsExportingData(true);
      const res = await fetch("/api/user/export-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data.backup, null, 2)
        )}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute(
          "download",
          `my_messenger_data_${currentUser.username}_${new Date().toISOString().split("T")[0]}.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setPrivacyMessage("بک‌آپ شخصی داده‌های شما با موفقیت دریافت گردید.");
        setTimeout(() => setPrivacyMessage(""), 4000);
      } else {
        alert(data.error || "خطا در دریافت پشتیبان شخصی.");
      }
    } catch (e) {
      console.error("Export user data error:", e);
      alert("خطا در برقراری ارتباط با سرور.");
    } finally {
      setIsExportingData(false);
    }
  };

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(currentUser.isTwoFactorEnabled);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSecret] = useState(currentUser.twoFactorSecret || "SEC_CHAT_KEY_123");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorSuccess, setTwoFactorSuccess] = useState("");
  const [twoFactorPIN, setTwoFactorPIN] = useState(currentUser.twoFactorPIN || "");
  const [liveOTP, setLiveOTP] = useState("");
  const [otpTimeLeft, setOtpTimeLeft] = useState(30);
  const [pinInput, setPinInput] = useState("");
  const [selected2FAMode, setSelected2FAMode] = useState<'pin' | 'otp'>('pin');

  const fetchCurrentOTP = async () => {
    try {
      const res = await fetch(`/api/current-otp?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setLiveOTP(data.code || "");
        setOtpTimeLeft(data.timeLeft || 30);
        if (data.twoFactorPIN) {
          setTwoFactorPIN(data.twoFactorPIN);
        } else {
          setTwoFactorPIN("");
        }
        setIs2FAEnabled(data.isTwoFactorEnabled);
      }
    } catch (e) {
      console.error("Error fetching live OTP:", e);
    }
  };

  useEffect(() => {
    fetchCurrentOTP();
    const interval = setInterval(() => {
      fetchCurrentOTP();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser.id, activeTab]);

  useEffect(() => {
    if (otpTimeLeft > 0) {
      const timer = setTimeout(() => {
        setOtpTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      fetchCurrentOTP();
    }
  }, [otpTimeLeft]);

  // Abuse Report State
  const [reportUserId, setReportUserId] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("لطفاً تمامی فیلدها را پر کنید.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("رمز عبور جدید و تکرار آن یکسان نیستند.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPasswordSuccess("رمز عبور شما با موفقیت تغییر یافت.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(data.error || "خطا در تغییر رمز عبور.");
      }
    } catch (err) {
      setPasswordError("اتصال به سرور برقرار نشد.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const colors = [
    "bg-sky-600", "bg-indigo-600", "bg-emerald-600", 
    "bg-rose-600", "bg-amber-600", "bg-violet-600", "bg-teal-600"
  ];
  const emojis = ["🦊", "🦁", "🐼", "🦉", "🥷", "🧙", "🧑‍🚀", "👾", "🌟", "👑"];

  const handleSaveProfile = async () => {
    setProfileMessage("");
    try {
      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          nickname,
          bio,
          avatarColor,
          avatarEmoji,
          avatarUrl
        })
      });
      const data = await response.json();
      if (response.ok) {
        onUpdateProfile(data.user);
        setProfileMessage("تغییرات پروفایل با موفقیت ذخیره شد!");
        setTimeout(() => setProfileMessage(""), 3000);
      } else {
        setProfileMessage("خطایی در به روزرسانی رخ داد.");
      }
    } catch (e) {
      setProfileMessage("اتصال به سرور برقرار نشد.");
    }
  };

  const handleSavePrivacy = async () => {
    setPrivacyMessage("");
    if (isAppPasscodeEnabled && (!appPasscode || appPasscode.length < 4)) {
      setPrivacyMessage("رمز عبور برنامه باید حداقل ۴ رقم عددی باشد.");
      return;
    }
    try {
      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          privacyLastSeen,
          privacyOnlineStatus,
          privacyProfilePhoto,
          privacyAllowMessages,
          privacyAllowGroups,
          privacySendSeen,
          privacyHideTyping,
          isAppPasscodeEnabled,
          appPasscode
        })
      });
      const data = await response.json();
      if (response.ok) {
        onUpdateProfile(data.user);
        setPrivacyMessage("تنظیمات حریم خصوصی با موفقیت ذخیره شد!");
        setTimeout(() => setPrivacyMessage(""), 3000);
      } else {
        setPrivacyMessage("خطایی در ذخیره تنظیمات رخ داد.");
      }
    } catch (e) {
      setPrivacyMessage("اتصال به سرور برقرار نشد.");
    }
  };

  const handleThemeSelect = async (themeId: string) => {
    try {
      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          theme: themeId
        })
      });
      const data = await response.json();
      if (response.ok) {
        onUpdateProfile(data.user);
      }
    } catch (e) {
      console.error("Theme select error", e);
    }
  };

  const handleToggle2FA = async (enable: boolean, isPin?: boolean, pinVal?: string) => {
    setTwoFactorError("");
    setTwoFactorSuccess("");

    if (enable) {
      if (isPin) {
        if (!pinVal || pinVal.length < 4) {
          setTwoFactorError("رمز امنیتی انتخابی باید حداقل ۴ رقم باشد.");
          return;
        }
      } else {
        if (!twoFactorCode) {
          setTwoFactorError("لطفاً کد ۶ رقمی برنامه احراز هویت را وارد کنید.");
          return;
        }
      }
    }

    try {
      const response = await fetch("/api/toggle-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          enable,
          code: isPin ? undefined : twoFactorCode,
          pin: isPin ? pinVal : undefined
        })
      });
      const data = await response.json();
      if (response.ok) {
        setIs2FAEnabled(enable);
        onUpdateProfile(data.user);
        setTwoFactorSuccess(enable ? "تأیید دو مرحله‌ای با موفقیت فعال شد!" : "تأیید دو مرحله‌ای غیرفعال گردید.");
        setTwoFactorCode("");
        setPinInput("");
        fetchCurrentOTP();
      } else {
        setTwoFactorError(data.error || "کد تأیید نامعتبر است.");
      }
    } catch (e) {
      setTwoFactorError("اتصال به سرور برقرار نشد.");
    }
  };

  const handleReportAbuse = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess("");
    if (!reportUserId || !reportReason) return;

    try {
      const response = await fetch("/api/report-abuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterId: currentUser.id,
          reportedUserId: reportUserId,
          reason: reportReason
        })
      });
      const data = await response.json();
      if (response.ok) {
        setReportSuccess(data.message || "گزارش با موفقیت ثبت شد.");
        setReportUserId("");
        setReportReason("");
      }
    } catch (e) {
      console.error("Report abuse failed", e);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(twoFactorSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md dir-rtl" dir="rtl">
      <div className="w-full max-w-2xl bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[100dvh] sm:h-[580px] max-h-[100dvh] sm:max-h-[90vh]">
        
        {/* Mobile Top Header (Visible only on mobile < md) */}
        <div className="flex md:hidden items-center justify-between p-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={`تصویر آواتار حساب کاربری ${nickname} در پیام‌رسان پریوو`} 
                loading="lazy"
                decoding="async"
                className="w-9 h-9 rounded-xl object-cover border border-slate-700 shadow-inner"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-inner ${avatarColor}`}>
                {avatarEmoji}
              </div>
            )}
            <div className="text-right">
              <h3 className="text-xs font-black text-white truncate max-w-[140px]">{nickname}</h3>
              <span className="text-[9px] text-slate-500 font-mono">تنظیمات حساب • @{currentUser.username}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onLogout}
              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="خروج از حساب"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Scrollable Tabs Bar (Visible only on mobile < md) */}
        <div className="flex md:hidden overflow-x-auto whitespace-nowrap bg-slate-950 border-b border-slate-800/80 p-2 gap-1.5 custom-scrollbar shrink-0">
          {[
            { id: 'profile', label: 'پروفایل', icon: User },
            { id: 'theme', label: 'پوسته و حاشیه', icon: Palette },
            { id: 'privacy', label: 'حریم و امنیت', icon: Lock },
            { id: '2fa', label: 'تأیید ۲مرحله‌ای', icon: Shield },
            { id: 'password', label: 'تغییر رمز', icon: Key },
            { id: 'security', label: 'گزارش تخلف', icon: ShieldAlert },
            { id: 'blocks', label: 'لیست سیاه', icon: Shield },
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 ${isActive ? (isRedTheme ? 'bg-red-600 text-white shadow-md' : 'bg-blue-600 text-white shadow-md') : 'bg-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Sidebar Tabs (Visible on md+) */}
        <div className="hidden md:flex md:w-60 bg-slate-950 p-4 border-l border-slate-800 flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="pb-3 border-b border-slate-800 mb-3 flex items-center gap-3">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={`تصویر آواتار حساب کاربری ${nickname} در پیام‌رسان پریوو`} 
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-2xl object-cover border border-slate-700 shadow-inner"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner ${avatarColor}`}>
                  {avatarEmoji}
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-white truncate max-w-[120px]">{nickname}</h3>
                <span className="text-[10px] text-slate-500 font-mono">@{currentUser.username}</span>
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${activeTab === 'profile' ? (isRedTheme ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <User className="w-4 h-4" />
              <span>پروفایل و بیوگرافی</span>
            </button>

            <button 
              onClick={() => setActiveTab('theme')}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${activeTab === 'theme' ? (isRedTheme ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Palette className="w-4 h-4" />
              <span>پوسته‌های رنگی (تم)</span>
            </button>

            <button 
              onClick={() => setActiveTab('privacy')}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${activeTab === 'privacy' ? (isRedTheme ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Lock className="w-4 h-4" />
              <span>حریم خصوصی و امنیت</span>
            </button>

            <button 
              onClick={() => setActiveTab('2fa')}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${activeTab === '2fa' ? (isRedTheme ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Shield className="w-4 h-4" />
              <span>تأیید دو مرحله‌ای</span>
            </button>

            <button 
              onClick={() => setActiveTab('password')}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${activeTab === 'password' ? (isRedTheme ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Key className="w-4 h-4" />
              <span>تغییر رمز عبور</span>
            </button>

            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${activeTab === 'security' ? (isRedTheme ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>گزارش تخلفات</span>
            </button>

            <button 
              onClick={() => setActiveTab('blocks')}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${activeTab === 'blocks' ? (isRedTheme ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Shield className="w-4 h-4" />
              <span>لیست مسدود شده‌ها</span>
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full text-right px-3 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition flex items-center gap-2.5 mt-4 border border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب</span>
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between bg-slate-900 overflow-y-auto custom-scrollbar h-full min-h-0">
          <div>
            {/* Desktop Header Title */}
            <div className="hidden md:flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-sm font-extrabold text-white">
                {activeTab === 'profile' && 'تنظیمات شناسنامه کاربری'}
                {activeTab === 'theme' && 'شخصی‌سازی پوسته برنامه'}
                {activeTab === 'privacy' && 'حریم خصوصی، امنیت و قفل برنامه'}
                {activeTab === '2fa' && 'سیستم احراز هویت دو مرحله‌ای'}
                {activeTab === 'password' && 'تغییر رمز عبور حساب کاربری'}
                {activeTab === 'security' && 'سیستم گزارش تخلف کاربران'}
                {activeTab === 'blocks' && 'لیست سیاه کاربران مسدود شده'}
              </h2>
              <button 
                onClick={onClose} 
                className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-4 text-right">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">نام نمایشی یا مستعار</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">بیو یا معرفی کوتاه</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="چیزی در مورد خود بنویسید..."
                  />
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
                  <label className="block text-[11px] font-bold text-slate-400">تصویر پروفایل سفارشی (عکس واقعی)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                    {avatarUrl ? (
                      <div className="relative group shrink-0">
                        <img 
                          src={avatarUrl} 
                          alt="پیش‌نمایش تصویر آواتار انتخاب‌شده کاربر در پیام‌رسان پریوو" 
                          loading="lazy"
                          decoding="async"
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow-lg"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveAvatarUrl}
                          className="absolute -top-1.5 -left-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow transition"
                          title="حذف تصویر"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 shrink-0 text-[10px]">
                        <span>بدون عکس</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5 text-center sm:text-right w-full">
                      <div className="relative">
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          disabled={isUploadingAvatar}
                          className="hidden"
                        />
                        <label
                          htmlFor="avatar-upload"
                          className={`inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer ${isUploadingAvatar ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          {isUploadingAvatar ? "در حال آپلود..." : "آپلود عکس جدید"}
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        فرمت‌های JPG، PNG یا WEBP تا حداکثر ۵ مگابایت. با آپلود تصویر سفارشی، این عکس جایگزین اموجی نمایه خواهد شد.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">انتخاب اموجی نمایه</label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                    {emojis.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setAvatarEmoji(e)}
                        className={`text-lg p-2 rounded-xl border transition shrink-0 ${avatarEmoji === e ? "bg-slate-800 border-blue-500 scale-105" : "bg-slate-950 border-slate-800 hover:bg-slate-900"}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">رنگ نمایه</label>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {colors.map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setAvatarColor(col)}
                        className={`w-5.5 h-5.5 rounded-full border transition shrink-0 ${col} ${avatarColor === col ? "border-white scale-110 ring-2 ring-blue-500/30" : "border-transparent"}`}
                      />
                    ))}
                  </div>
                </div>

                {profileMessage && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg">
                    {profileMessage}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PRIVACY & PASSCODE */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 text-right">
                {/* 1. Visibilities */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400">تنظیمات رویت و حریم خصوصی شخصی</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">چه کسی آخرین بازدید من را ببیند؟</label>
                      <select
                        value={privacyLastSeen}
                        onChange={(e: any) => setPrivacyLastSeen(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="everyone">همه کاربران (Everyone)</option>
                        <option value="nobody">هیچ‌کس (Nobody)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">چه کسی عکس پروفایل من را ببیند؟</label>
                      <select
                        value={privacyProfilePhoto}
                        onChange={(e: any) => setPrivacyProfilePhoto(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="everyone">همه کاربران (Everyone)</option>
                        <option value="nobody">هیچ‌کس (Nobody)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">چه کسی بتواند به من پیام بدهد؟</label>
                      <select
                        value={privacyAllowMessages}
                        onChange={(e: any) => setPrivacyAllowMessages(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="everyone">همه کاربران (Everyone)</option>
                        <option value="nobody">هیچ‌کس (Nobody)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">چه کسی من را به گروه‌ها اضافه کند؟</label>
                      <select
                        value={privacyAllowGroups}
                        onChange={(e: any) => setPrivacyAllowGroups(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="everyone">همه کاربران (Everyone)</option>
                        <option value="nobody">هیچ‌کس (Nobody)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Chat Toggles */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2.5">
                  <h4 className="text-xs font-bold text-blue-400">تنظیمات پیشرفته گفتگو (سایه / روح)</h4>
                  
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={privacySendSeen}
                      onChange={(e) => setPrivacySendSeen(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                    />
                    <span>ارسال وضعیت خوانده شدن پیام‌ها (Seen Status)</span>
                  </label>
                  <p className="text-[10px] text-slate-500 pr-6">در صورت غیرفعال بودن، دیگران متوجه تیک دوم آبی پیام‌های ارسالی نخواهند شد.</p>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300 mt-2">
                    <input
                      type="checkbox"
                      checked={privacyHideTyping}
                      onChange={(e) => setPrivacyHideTyping(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                    />
                    <span>مخفی کردن وضعیت نوشتن (حالت نامحسوس Typing...)</span>
                  </label>
                  <p className="text-[10px] text-slate-500 pr-6">هنگامی که در حال تایپ هستید، عبارت "در حال نوشتن..." برای دیگران نمایش داده نمی‌شود.</p>
                </div>

                {/* 3. Passcode Lock */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-bold text-rose-400">قفل برنامه با رمز عبور (Passcode Lock)</h4>
                  </div>
                  
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={isAppPasscodeEnabled}
                      onChange={(e) => setIsAppPasscodeEnabled(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-900 text-rose-600 focus:ring-0 w-4 h-4"
                    />
                    <span>فعال‌سازی قفل ورود به پیام‌رسان</span>
                  </label>

                  {isAppPasscodeEnabled && (
                    <div className="space-y-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                      <label className="block text-[10px] text-slate-400">رمز عبور عددی ورود (حداقل ۴ رقم):</label>
                      <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="••••"
                        value={appPasscode}
                        onChange={(e) => setAppPasscode(e.target.value.replace(/\D/g, ""))}
                        className="w-32 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-center tracking-widest text-white text-sm font-mono focus:outline-none focus:border-rose-500"
                      />
                      <span className="text-[9px] text-slate-500 block mt-1">با فعال کردن این گزینه، پس از رفرش برنامه یا خروج، رمز عبور مطالبه می‌شود.</span>
                    </div>
                  )}
                </div>

                {/* 4. Active Sessions */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-emerald-400">مدیریت نشست‌های فعال (Active Devices)</h4>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Current Device */}
                    {sessions.filter(s => s.id === localStorage.getItem("parham_session_id")).map(s => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 bg-emerald-950/20 rounded-xl border border-emerald-500/20">
                        <div className="text-right">
                          <span className="text-xs font-bold text-white block">{s.deviceName} (این دستگاه)</span>
                          <span className="text-[10px] text-emerald-400 font-mono">فعال • IP: {s.ip}</span>
                        </div>
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-medium">آنلاین</span>
                      </div>
                    ))}

                    {/* Fallback if no session matches the localStorage session ID */}
                    {sessions.filter(s => s.id === localStorage.getItem("parham_session_id")).length === 0 && (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-950/20 rounded-xl border border-emerald-500/20">
                        <div className="text-right">
                          <span className="text-xs font-bold text-white block">دستگاه جاری کلاینت</span>
                          <span className="text-[10px] text-emerald-400 font-mono">فعال • IP: 192.168.1.104</span>
                        </div>
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-medium">آنلاین</span>
                      </div>
                    )}

                    {/* Other Devices */}
                    {sessions.filter(s => s.id !== localStorage.getItem("parham_session_id")).map(s => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/60 group">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-200 block">{s.deviceName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            آخرین بازدید: {new Date(s.lastActive).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})} • IP: {s.ip}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTerminateSession(s.id)}
                          className="text-[9px] text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 hover:border-rose-500/30 px-2.5 py-1 rounded-lg transition"
                        >
                          قطع نشست
                        </button>
                      </div>
                    ))}

                    {sessions.filter(s => s.id !== localStorage.getItem("parham_session_id")).length > 0 ? (
                      <button
                        type="button"
                        onClick={handleTerminateOtherSessions}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 text-[10px] font-bold rounded-xl transition mt-2"
                      >
                        خروج از سایر دستگاه‌ها (Terminate Other Sessions)
                      </button>
                    ) : (
                      <div className="text-center py-2 text-[10px] text-slate-500">
                        سایر نشست‌ها با موفقیت غیرفعال شدند. فقط همین مرورگر فعال است.
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Personal Data Export */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-bold text-sky-400">پشتیبان‌گیری از اطلاعات شخصی (Data Export)</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    شما می‌توانید تمام چت‌های شخصی، گروهی و اطلاعات حساب کاربری خود را در قالب یک فایل JSON استخراج و روی سیستم یا موبایل خود ذخیره کنید.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportUserData}
                    disabled={isExportingData}
                    className="w-full py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 hover:border-sky-500/40 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isExportingData ? "در حال استخراج..." : "دانلود نسخه پشتیبان اطلاعات من (JSON)"}
                  </button>
                </div>

                {privacyMessage && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                    {privacyMessage}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 mb-2.5 text-right">پوسته‌های کلی پیام‌رسان</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                    {Object.values(themes).map((t) => {
                      const isSelected = currentTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleThemeSelect(t.id)}
                          className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between min-h-[90px] relative overflow-hidden ${isSelected ? `bg-slate-950/90 ${t.borderCol} ring-2 ${t.ringCol} shadow-lg shadow-black/80` : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'}`}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div>
                              <span className="text-xs font-black text-white block">{t.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{t.id}</span>
                            </div>
                            {isSelected && (
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${t.badgeBg} shrink-0`}>
                                پوسته فعال
                              </span>
                            )}
                          </div>
                          
                          {/* Color Preview Swatches */}
                          <div className="flex items-center gap-1.5 mt-3">
                            <span className={`w-4 h-4 rounded-full ${t.primaryBg} shadow-sm border border-white/10`} title="رنگ اصلی" />
                            <span className={`w-4 h-4 rounded-full ${t.sidebarBg} border border-slate-700`} title="رنگ سایدبار" />
                            <span className={`w-4 h-4 rounded-full ${t.mainBg} border border-slate-700`} title="پس‌زمینه" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message Bubble Border Frame Selection */}
                <div className="border-t border-slate-800/80 pt-4 space-y-3 text-right">
                  <div>
                    <h3 className="text-xs font-black text-amber-400 flex items-center justify-end gap-1.5">
                      <span>✨</span>
                      <span>قالب حاشیه حباب‌های پیام (Message Bubble Frames)</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      یک جلوه اختصاصی (قلبی، آتشین، پاپیونی، زمردین، سایبر نئون) برای حاشیه پیام‌های ارسالی خود انتخاب کنید.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'default', name: 'کلاسیک', emoji: '💬', desc: 'حاشیه استاندارد پوسته', border: 'border-slate-700' },
                      { id: 'heart', name: 'قالب قلبی 💖', emoji: '💖', desc: 'حاشیه صورتی با قلب‌های متحرک', border: 'border-pink-500/80 shadow-[0_0_12px_rgba(236,72,153,0.35)]' },
                      { id: 'fiery', name: 'قالب آتشین 🔥', emoji: '🔥', desc: 'حاشیه زرد-نارنجی پرانرژی', border: 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)]' },
                      { id: 'bow', name: 'قالب پاپیونی 🎀', emoji: '🎀', desc: 'حاشیه پاپیونی فانتزی', border: 'border-fuchsia-400/80 shadow-[0_0_12px_rgba(232,121,249,0.35)]' },
                      { id: 'emerald_glow', name: 'قالب زمردین ✨', emoji: '✨', desc: 'حاشیه سبز درخشان زمردی', border: 'border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.4)]' },
                      { id: 'cyber_neon', name: 'سایبر نئون ⚡', emoji: '⚡', desc: 'حاشیه فیروزه‌ای نئونی خفن', border: 'border-cyan-400/80 shadow-[0_0_16px_rgba(6,182,212,0.45)]' },
                    ].map(frame => {
                      const isSelected = (bubbleBorderFrame || 'default') === frame.id;
                      return (
                        <button
                          key={frame.id}
                          type="button"
                          onClick={() => handleBubbleBorderSelect(frame.id)}
                          className={`p-3 rounded-xl border text-right transition flex flex-col justify-between relative ${frame.border} ${isSelected ? 'bg-slate-900 ring-2 ring-amber-500/60 scale-102' : 'bg-slate-950/60 hover:bg-slate-900/60'}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm">{frame.emoji}</span>
                            {isSelected && (
                              <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                                فعال
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className="text-xs font-bold text-white block">{frame.name}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">{frame.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* LOW RAM / HIGH PERFORMANCE OPTIMIZATION MODE */}
                <div className="border-t border-slate-800/80 pt-4 space-y-3 text-right">
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                        <h4 className="text-xs font-bold text-amber-300">
                          {appLanguage === 'en' ? 'Low RAM & GPU Mode' : 'حالت بهینه‌سازی رم و پردازنده (Low RAM Mode)'}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {appLanguage === 'en'
                          ? 'Disable heavy animations, blur filters, and limit memory buffer for ultra-fast performance on any device.'
                          : 'غیرفعال‌سازی افکت‌های گرافیکی سنگین، بلر، و محدودسازی سقف حافظه پیام‌ها جهت اجرای روان در گوشی‌ها و رایانه‌های قدیمی'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onToggleLowRamMode}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
                        isLowRamMode
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/20"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>
                        {isLowRamMode
                          ? (appLanguage === 'en' ? 'Active (Low RAM)' : 'فعال (حالت کم‌مصرف)')
                          : (appLanguage === 'en' ? 'Disabled' : 'غیرفعال')}
                      </span>
                    </button>
                  </div>

                  {/* LANGUAGE SELECTOR SYSTEM */}
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-indigo-500/30 flex items-center justify-between gap-3 mt-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                        <h4 className="text-xs font-bold text-indigo-300">
                          {appLanguage === 'en' ? 'Application Language / زبان برنامه' : 'زبان برنامه (Application Language)'}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {appLanguage === 'en'
                          ? 'Switch whole application interface language between Persian and English.'
                          : 'تغییر کامل زبان رابط کاربری پیام‌رسان بین فارسی و انگلیسی'}
                      </p>
                    </div>

                    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 shrink-0 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => onToggleLanguage && onToggleLanguage('fa')}
                        className={`px-3 py-1.5 rounded-lg transition ${appLanguage === 'fa' ? 'bg-indigo-600 text-white font-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                        فارسی
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleLanguage && onToggleLanguage('en')}
                        className={`px-3 py-1.5 rounded-lg transition ${appLanguage === 'en' ? 'bg-indigo-600 text-white font-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: 2FA */}
            {activeTab === '2fa' && (
              <div className="space-y-4 text-right text-xs text-slate-300">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-400">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>سیستم احراز هویت دومرحله‌ای اختصاصی (بدون نیاز به برنامه جانبی)</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-slate-400">
                    برای افزایش امنیت حساب خود نیازی به نصب اپلیکیشن‌های پیچیده یا پلتفرم‌های خارجی ندارید. پیام‌رسان پرهام سیستم احراز هویت دومرحله‌ای را به صورت کاملاً داخلی و آسان پیاده‌سازی کرده است.
                  </p>
                </div>

                {!is2FAEnabled ? (
                  <div className="space-y-4">
                    {/* Mode Selection */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-900">
                      <button
                        type="button"
                        onClick={() => setSelected2FAMode('pin')}
                        className={`py-2 px-3 rounded-xl font-bold text-center transition ${selected2FAMode === 'pin' ? (isRedTheme ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        روش اول: رمز ایستای شخصی (PIN)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelected2FAMode('otp')}
                        className={`py-2 px-3 rounded-xl font-bold text-center transition ${selected2FAMode === 'otp' ? (isRedTheme ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        روش دوم: تولیدکننده خودکار کد درون‌برنامه
                      </button>
                    </div>

                    {selected2FAMode === 'pin' ? (
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-200 text-xs">تعریف رمز امنیتی ایستای شخصی (ایمن و ساده)</h4>
                          <p className="text-[10px] text-slate-500">
                            یک رمز عبور عددی دوم (مانند رمز کارت بانکی یا ۴ رقم دلخواه) انتخاب کنید. در دفعات بعدی ورود، کافی است همین رمز ساده را وارد کنید.
                          </p>
                        </div>

                        <div className="space-y-2 pt-2">
                          <label className="block text-[11px] text-slate-400">رمز عبور دوم اختصاصی خود را وارد کنید (حداقل ۴ رقم):</label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              maxLength={8}
                              placeholder="••••"
                              value={pinInput}
                              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center font-mono text-sm tracking-widest text-white focus:outline-none focus:border-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleToggle2FA(true, true, pinInput)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition text-xs shrink-0"
                            >
                              فعال‌سازی رمز دوم
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-200 text-xs">کد یک‌بار مصرف پویای درون‌برنامه‌ای (OTP Generator)</h4>
                          <p className="text-[10px] text-slate-500">
                            بدون نیاز به پلتفرم جانبی، سیستم به طور خودکار هر ۳۰ ثانیه یک کد یک‌بار مصرف تولید می‌کند. کد پویای زنده زیر را برای فعال‌سازی در کادر بنویسید.
                          </p>
                        </div>

                        {/* Live Generator Widget */}
                        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800/60 flex flex-col items-center justify-center space-y-2">
                          <span className="text-[10px] text-slate-500 font-bold">کد پویای فعال شما هم‌اکنون (تولید شده در سایت):</span>
                          <span className="text-2xl font-mono font-black text-emerald-400 tracking-widest select-all bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-800/80">{liveOTP || "------"}</span>
                          
                          {/* Progress countdown bar */}
                          <div className="w-40 bg-slate-950 h-1.5 rounded-full overflow-hidden relative">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
                              style={{ width: `${(otpTimeLeft / 30) * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono">اعتبار کد: {otpTimeLeft} ثانیه دیگر</span>
                        </div>

                        <div className="space-y-2 pt-1">
                          <label className="block text-[11px] text-slate-400">کد ۶ رقمی بالای صفحه را در کادر زیر بنویسید:</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="کد ۶ رقمی فوق"
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center font-mono text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleToggle2FA(true, false)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition text-xs shrink-0"
                            >
                              فعال‌سازی نهایی
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-3">
                      <Shield className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
                      <div>
                        <h4 className="font-bold text-emerald-400 text-sm">احراز هویت دو مرحله‌ای فعال است</h4>
                        <p className="text-[11px] text-slate-400 mt-1">حساب کاربری شما در بالاترین سطح امنیت قرار دارد.</p>
                      </div>

                      {twoFactorPIN ? (
                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/60 inline-block text-right space-y-1 mx-auto min-w-[200px]">
                          <span className="text-[10px] text-slate-500 font-bold block text-center">نوع فعال‌سازی: رمز عبور ایستای شخصی (PIN)</span>
                          <span className="text-center block font-mono text-xs text-emerald-400 font-bold tracking-widest mt-0.5">رمز فعلی شما: {twoFactorPIN}</span>
                        </div>
                      ) : (
                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/60 inline-block text-right space-y-2 mx-auto min-w-[240px] text-center">
                          <span className="text-[10px] text-slate-500 font-bold block">تولیدکننده کدهای پویای شما (محلی در سایت):</span>
                          <div className="inline-block font-mono text-lg text-emerald-400 font-black tracking-widest bg-slate-950 px-3 py-1 rounded-md border border-slate-800/60">
                            {liveOTP || "------"}
                          </div>
                          
                          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1.5">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
                              style={{ width: `${(otpTimeLeft / 30) * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-500 block">انقضای کد: {otpTimeLeft} ثانیه دیگر (نیازی به برنامه جانبی ندارید)</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleToggle2FA(false)}
                          className="px-4 py-1.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white rounded-xl font-bold text-xs transition"
                        >
                          غیرفعال کردن رمز دو مرحله‌ای
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {twoFactorError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                    {twoFactorError}
                  </div>
                )}
                {twoFactorSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                    {twoFactorSuccess}
                  </div>
                )}
              </div>
            )}

            {/* TAB: REPORT SECURITY */}
            {activeTab === 'security' && (
              <form onSubmit={handleReportAbuse} className="space-y-4 text-right">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  اگر متوجه رفتار مشکوک، هرزنامه، یا کانال‌ها و گروه‌های نامناسب شدید، بلافاصله آن را با نام کاربری متخلف به پشتیبانان امنیتی گزارش کنید.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">نام کاربری متخلف</label>
                  <select
                    value={reportUserId}
                    onChange={(e) => setReportUserId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">انتخاب کاربر...</option>
                    {Object.values(users)
                      .filter(u => u.id !== currentUser.id)
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.nickname} (@{u.username})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">دلیل گزارش تخلف</label>
                  <textarea
                    rows={3}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                    placeholder="لطفاً شرح کاملی از تخلف این کاربر را بنویسید..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {reportSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                    {reportSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition"
                >
                  ارسال گزارش تخلف
                </button>
              </form>
            )}

            {/* TAB: PASSWORD CHANGE */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4 text-right">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  جهت حفظ و ارتقای امنیت حساب خود، می‌توانید رمز عبور جدیدی تعیین کنید. لطفاً از یک رمز عبور ایمن استفاده فرمایید.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">رمز عبور فعلی</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="رمز عبور فعلی را وارد کنید..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">رمز عبور جدید</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="حداقل ۶ کاراکتر..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">تکرار رمز عبور جدید</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="رمز عبور جدید را مجدداً وارد کنید..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {passwordError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                    ⚠️ {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                    ✅ {passwordSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className={`px-4 py-2 text-white rounded-xl font-bold text-xs transition ${isChangingPassword ? 'bg-indigo-600/50 cursor-not-allowed' : (isRedTheme ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500')}`}
                >
                  {isChangingPassword ? 'در حال تغییر...' : 'تغییر رمز عبور'}
                </button>
              </form>
            )}

            {/* TAB: BLOCKED USERS */}
            {activeTab === 'blocks' && (
              <div className="space-y-3 text-right">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  افرادی که مسدود می‌کنید دیگر قادر به ارسال پیام خصوصی یا برقراری تماس با شما در هیچ فضایی نخواهند بود.
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {currentUser.blockedUsers && currentUser.blockedUsers.length > 0 ? (
                    currentUser.blockedUsers.map((blockedId: string) => {
                      const blockedUserObj = users[blockedId] || { nickname: "کاربر مسدود شده", username: "blocked_user" };
                      return (
                        <div key={blockedId} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">👤</span>
                            <div>
                              <h4 className="text-xs font-bold text-white">{blockedUserObj.nickname}</h4>
                              <span className="text-[10px] text-slate-500 font-mono">@{blockedUserObj.username}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => onUnblockUser(blockedId)}
                            className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg transition"
                          >
                            رفع مسدودیت
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      هیچ کاربری در لیست سیاه شما قرار ندارد.
                    </div>
                  )}
                </div>
              </div>
            )}


          </div>

          {/* Action Footer */}
          {(activeTab === 'profile' || activeTab === 'privacy') && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl transition"
              >
                انصراف
              </button>
              <button
                onClick={activeTab === 'profile' ? handleSaveProfile : handleSavePrivacy}
                className={`px-5 py-2 ${isRedTheme ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5`}
              >
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
