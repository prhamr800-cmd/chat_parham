import React, { useState } from "react";
import { 
  X, User, Lock, ShieldCheck, Crown, ShieldAlert, Ban, UserCheck, Phone, Video, 
  Camera, Palette, Shield, Key, LogOut, Settings, Copy, Check, Sparkles, Smartphone, Terminal, RefreshCw, Upload, Eye, EyeOff, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatLastSeen, Language } from "../utils/i18n";

interface UserProfileModalProps {
  currentUser: any;
  targetUserId: string;
  users: { [id: string]: any };
  onClose: () => void;
  onUpdateProfile?: (updatedData: any) => void;
  onLogout?: () => void;
  onOpenAdminDashboard?: () => void;
  onToggleFilter?: (targetUserId: string, filter: boolean) => void;
  onInitiateCall?: (type: 'audio' | 'video', user: any) => void;
  onReportUser?: (targetUserId: string, reason: string) => void;
  appLanguage?: Language;
}

export default function UserProfileModal({
  currentUser,
  targetUserId,
  users,
  onClose,
  onUpdateProfile,
  onLogout,
  onOpenAdminDashboard,
  onToggleFilter,
  onInitiateCall,
  onReportUser,
  appLanguage = 'fa'
}: UserProfileModalProps) {
  const targetUser = users[targetUserId] || (targetUserId === currentUser.id ? currentUser : null);
  const isSelf = currentUser?.id === targetUserId;

  const [activeTab, setActiveTab] = useState<'info' | 'edit' | 'customization' | 'security'>('info');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);

  // Profile Edit States
  const [nickname, setNickname] = useState(currentUser?.nickname || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || "bg-indigo-600");
  const [avatarEmoji, setAvatarEmoji] = useState(currentUser?.avatarEmoji || "👤");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [bubbleBorderFrame, setBubbleBorderFrame] = useState(currentUser?.bubbleBorderFrame || "default");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  // Security Passcode States
  const [isAppPasscodeEnabled, setIsAppPasscodeEnabled] = useState(currentUser?.isAppPasscodeEnabled === true);
  const [appPasscode, setAppPasscode] = useState(currentUser?.appPasscode || "");
  const [showPasscode, setShowPasscode] = useState(false);

  // Report User State
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportReasonText, setReportReasonText] = useState("");
  const [reportSentMsg, setReportSentMsg] = useState("");

  if (!targetUser) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 dir-rtl" dir="rtl">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center max-w-sm w-full">
          <p className="text-slate-300 text-sm">کاربر مورد نظر یافت نشد.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">بستن</button>
        </div>
      </div>
    );
  }

  const isTargetOwner = targetUser.role === "owner" || targetUser.username === "parham";
  const isCurrentUserOwner = currentUser?.role === "owner";

  const handleCopyText = (text: string, type: 'key' | 'username') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("حداکثر حجم فایل تصویر ۵ مگابایت است.");
      return;
    }

    setIsUploadingAvatar(true);
    setUpdateMsg("در حال آپلود تصویر جدید...");

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
          setUpdateMsg("تصویر با موفقیت آپلود شد!");
        } else {
          setUpdateMsg("خطا در آپلود عکس.");
        }
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUpdateMsg("خطا در ارتباط با سرور.");
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfileChanges = async () => {
    if (!onUpdateProfile) return;
    setUpdateMsg("");
    setIsProcessing(true);

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
          avatarUrl,
          bubbleBorderFrame,
          isAppPasscodeEnabled,
          appPasscode
        })
      });

      const data = await response.json();
      if (response.ok && data.user) {
        onUpdateProfile(data.user);
        setUpdateMsg("پروفایل شما با موفقیت بروزرسانی گردید ✨");
        setTimeout(() => setUpdateMsg(""), 3000);
      } else {
        setUpdateMsg("خطا در بروزرسانی اطلاعات.");
      }
    } catch (err) {
      setUpdateMsg("خطا در ارتباط با سرور.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBubbleBorderSelect = async (frameId: string) => {
    setBubbleBorderFrame(frameId);
    if (!onUpdateProfile) return;
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
      if (response.ok && data.user) {
        onUpdateProfile(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFilter = async () => {
    if (!onToggleFilter) return;
    setIsProcessing(true);
    try {
      const newFilterStatus = !targetUser.isFiltered;
      const confirmMsg = newFilterStatus 
        ? `آیا از فیلتر (مسدود کردن سراسری) کاربر "${targetUser.nickname}" اطمینان دارید؟` 
        : `آیا مایل به رفع فیلتر کاربر "${targetUser.nickname}" هستید؟`;
      
      if (!window.confirm(confirmMsg)) {
        setIsProcessing(false);
        return;
      }

      const response = await fetch("/api/admin/toggle-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser.id,
          targetUserId: targetUserId,
          filter: newFilterStatus
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onToggleFilter(targetUserId, newFilterStatus);
      } else {
        alert(data.error || "خطا در انجام عملیات");
      }
    } catch (err) {
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsProcessing(false);
    }
  };

  const colorPalette = [
    "bg-indigo-600", "bg-sky-600", "bg-emerald-600", 
    "bg-rose-600", "bg-amber-600", "bg-violet-600", "bg-teal-600"
  ];
  const emojiPalette = ["🦊", "🦁", "🐼", "🦉", "🥷", "🧙", "🧑‍🚀", "👾", "🌟", "👑"];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 dir-rtl" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: "spring", duration: 0.35 }}
        className="bg-slate-900 border border-slate-800/90 rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        {/* Header Cover Banner */}
        <div className={`h-28 w-full relative ${isTargetOwner ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950' : 'bg-gradient-to-r from-slate-950 via-blue-950/60 to-slate-900'} p-4 flex justify-between items-start border-b border-slate-800/60`}>
          <div className="flex items-center gap-2">
            {isTargetOwner && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black rounded-full flex items-center gap-1 shadow-md">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>مالک ارشد سیستم</span>
              </span>
            )}
            {targetUser.isFiltered && (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-black rounded-full flex items-center gap-1 shadow-md animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>مسدود شده</span>
              </span>
            )}
            {isSelf && (
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-black rounded-full flex items-center gap-1 shadow-md">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>پروفایل شما</span>
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white rounded-xl transition shadow-lg"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Avatar & User Brief Info Header */}
        <div className="px-6 relative -mt-12 flex justify-between items-end border-b border-slate-800/50 pb-4">
          <div className="relative group">
            {isSelf && avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`تصویر پروفایل ${nickname} در پیام‌رسان پریوو`}
                loading="lazy"
                decoding="async"
                className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-900 shadow-2xl"
                referrerPolicy="no-referrer"
              />
            ) : targetUser.avatarUrl ? (
              <img
                src={targetUser.avatarUrl}
                alt={`تصویر پروفایل ${targetUser.nickname} در پیام‌رسان پریوو`}
                loading="lazy"
                decoding="async"
                className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-900 shadow-2xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl border-4 border-slate-900 shadow-2xl ${isSelf ? avatarColor : (targetUser.avatarColor || 'bg-slate-800')}`}>
                {isSelf ? avatarEmoji : (targetUser.avatarEmoji || '👤')}
              </div>
            )}

            {isSelf && (
              <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-1 border-4 border-slate-900">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Call / Action triggers if viewing another user */}
          {!isSelf && (
            isTargetOwner ? (
              <div className="mb-1 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-xl flex items-center gap-1 shadow-sm">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>ارتباط پیوی و تماس با مالک غیرفعال است</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-1 w-full">
                <div className="flex items-center gap-2">
                  {onInitiateCall && (
                    <>
                      <button
                        onClick={() => { onClose(); onInitiateCall('audio', targetUser); }}
                        className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>تماس صوتی</span>
                      </button>
                      <button
                        onClick={() => { onClose(); onInitiateCall('video', targetUser); }}
                        className="px-3.5 py-2 bg-teal-600/20 hover:bg-teal-600 border border-teal-500/30 hover:border-teal-500 text-teal-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>تصویری</span>
                      </button>
                    </>
                  )}
                  {onReportUser && (
                    <button
                      onClick={() => setShowReportInput(!showReportInput)}
                      className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>گزارش تخلف</span>
                    </button>
                  )}
                </div>

                {/* Report Reason Input Container */}
                {showReportInput && (
                  <div className="bg-rose-950/30 border border-rose-500/30 p-3 rounded-2xl space-y-2 mt-1">
                    <p className="text-[11px] font-bold text-rose-300">ثبت گزارش تخلف برای ربات پشتیبانی:</p>
                    <textarea
                      rows={2}
                      value={reportReasonText}
                      onChange={(e) => setReportReasonText(e.target.value)}
                      placeholder="علت گزارش تخلف یا فحاشی را بنویسید..."
                      className="w-full p-2 bg-slate-950 border border-rose-900/50 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 resize-none custom-scrollbar"
                    />
                    {reportSentMsg && (
                      <p className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-900/40 text-center">
                        {reportSentMsg}
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowReportInput(false)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold transition"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={() => {
                          if (onReportUser && reportReasonText.trim()) {
                            onReportUser(targetUser.id, reportReasonText);
                            setReportSentMsg("گزارش ارسال شد! هوش مصنوعی در حال بازرسی است.");
                            setTimeout(() => {
                              setShowReportInput(false);
                              setReportSentMsg("");
                              setReportReasonText("");
                            }, 1800);
                          }
                        }}
                        disabled={!reportReasonText.trim()}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition disabled:opacity-50"
                      >
                        ارسال گزارش
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Self Quick Actions */}
          {isSelf && (
            <div className="flex items-center gap-2 mb-1">
              {isCurrentUserOwner && onOpenAdminDashboard && (
                <button
                  onClick={() => { onClose(); onOpenAdminDashboard(); }}
                  className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>مدیریت سیستم</span>
                </button>
              )}
              {onLogout && (
                <button
                  onClick={() => { onClose(); onLogout(); }}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Identity Details Bar */}
        <div className="px-6 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>{isSelf ? nickname : targetUser.nickname}</span>
                {targetUser.isOnline && !targetUser.isFiltered && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="آنلاین"></span>
                )}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400 font-mono">@{targetUser.username}</span>
                <button
                  onClick={() => handleCopyText(`@${targetUser.username}`, 'username')}
                  className="text-slate-500 hover:text-slate-300 transition"
                  title="کپی شناسه"
                >
                  {copiedUsername ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                {targetUser.role === 'owner' ? '👑 مالک سیستم' : '🛡️ کاربر تاییدشده'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs (For Self) */}
        {isSelf && (
          <div className="px-6 pt-1">
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800/80 gap-1 text-[11px] font-bold">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-1.5 rounded-xl transition ${activeTab === 'info' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                اطلاعات
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 py-1.5 rounded-xl transition ${activeTab === 'edit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ویرایش
              </button>
              <button
                onClick={() => setActiveTab('customization')}
                className={`flex-1 py-1.5 rounded-xl transition ${activeTab === 'customization' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                شخصی‌سازی
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-1.5 rounded-xl transition ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                قفل برنامه
              </button>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">

          {/* TAB 1: INFO / VIEW MODE */}
          {(activeTab === 'info' || !isSelf) && (
            <div className="space-y-3">
              {/* Bio */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">درباره و بیوگرافی</span>
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs text-slate-200 leading-relaxed whitespace-pre-line min-h-[50px]">
                  {isSelf ? (bio || "بیوگرافی هنوز تنظیم نشده است.") : (targetUser.bio || "توضیحاتی ثبت نشده است.")}
                </div>
              </div>

              {/* Status Indicator & Last Seen */}
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{appLanguage === 'en' ? 'Activity Status:' : 'وضعیت و آخرین بازدید:'}</span>
                </span>
                {targetUser.isFiltered ? (
                  <span className="text-red-400 font-bold">{appLanguage === 'en' ? 'Banned by Admin' : 'مسدود توسط مدیریت'}</span>
                ) : targetUser.isOnline ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{appLanguage === 'en' ? 'Online' : 'آنلاین در پیام‌رسان'}</span>
                  </span>
                ) : (
                  <span className="text-slate-300 font-medium">
                    {formatLastSeen(targetUser.lastSeen, targetUser.privacyLastSeen, targetUser.isOnline, appLanguage)}
                  </span>
                )}
              </div>

              {/* End-to-End Encryption Key Card */}
              <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>اثربخشی کلید رمزنگاری ۲۵۶ بیتی (E2EE)</span>
                  </div>
                  {targetUser.publicKey && (
                    <button
                      onClick={() => handleCopyText(targetUser.publicKey, 'key')}
                      className="text-[10px] text-indigo-400 hover:text-indigo-200 font-mono flex items-center gap-1"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey ? "کپی شد" : "کپی کلید"}</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-indigo-300/80 leading-relaxed">
                  ارتباطات با این کاربر توسط کلید عمومی منحصر‌به‌فرد رمزگذاری می‌شود. کلید خصوصی فقط بر روی دستگاه گیرنده وجود دارد.
                </p>
                {targetUser.publicKey && (
                  <div className="font-mono text-[9px] bg-slate-950/80 p-2 rounded-xl text-slate-400 break-all border border-slate-900 select-all">
                    {targetUser.publicKey.substring(0, 60)}...
                  </div>
                )}
              </div>

              {/* Admin Supervise Toggle (If current user is owner and inspecting someone else) */}
              {isCurrentUserOwner && !isTargetOwner && !isSelf && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-amber-500 font-bold block mb-2">اختیارات نظارتی مالک سیستم</span>
                  {targetUser.isFiltered ? (
                    <button
                      onClick={handleToggleFilter}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-emerald-600/15 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>رفع فیلتر و بازگردانی حساب</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleToggleFilter}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-red-600/15 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Ban className="w-4 h-4" />
                      <span>فیلتر و مسدودسازی سراسری</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EDIT PROFILE */}
          {isSelf && activeTab === 'edit' && (
            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">نام نمایش (مستعار):</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">بیوگرافی:</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="توضیح کوتاهی درباره خود بنویسید..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none custom-scrollbar"
                />
              </div>

              {/* Color & Emoji Choice */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block">رنگ و ایموجی آواتار پیش‌فرض:</label>
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {colorPalette.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setAvatarColor(c); setAvatarUrl(""); }}
                      className={`w-7 h-7 rounded-lg ${c} shrink-0 transition ${avatarColor === c && !avatarUrl ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {emojiPalette.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => { setAvatarEmoji(em); setAvatarUrl(""); }}
                      className={`w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 text-base shrink-0 flex items-center justify-center transition ${avatarEmoji === em && !avatarUrl ? 'border-indigo-500 bg-indigo-950/50 scale-110' : 'opacity-70 hover:opacity-100'}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Custom Image */}
              <div className="pt-2 border-t border-slate-800/60">
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5">تصویر پروفایل سفارشی:</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2 px-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs text-slate-300 font-bold cursor-pointer transition flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>{isUploadingAvatar ? "در حال آپلود..." : "انتخاب عکس از دستگاه"}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition"
                    >
                      حذف عکس
                    </button>
                  )}
                </div>
              </div>

              {updateMsg && (
                <p className="text-xs text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/40 text-center">
                  {updateMsg}
                </p>
              )}

              <button
                onClick={handleSaveProfileChanges}
                disabled={isProcessing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg transition"
              >
                ذخیره تغییرات شناسنامه
              </button>
            </div>
          )}

          {/* TAB: CUSTOMIZATION PANEL (PERSONALIZATION) */}
          {isSelf && activeTab === 'customization' && (
            <div className="space-y-4">
              <div className="bg-indigo-950/20 border border-indigo-500/20 p-3.5 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-indigo-300 font-black text-xs">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <span>پنل اختصاصی شخصی‌سازی ظاهر و حواشی</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  تنظیم کادرهای فانتزی و جلوه‌های بصری خاص برای حباب‌های پیام در چت‌های شخصی و گروهی
                </p>
              </div>

              {/* Bubble Frame Options */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">انتخاب قالب حاشیه پیام‌ها (Message Bubble Frames):</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'default', name: 'کلاسیک 💬', emoji: '💬', desc: 'حاشیه استاندارد پوسته', border: 'border-slate-700' },
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
                        className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between relative ${frame.border} ${
                          isSelected ? 'bg-indigo-950/60 ring-2 ring-indigo-500 scale-[1.02]' : 'bg-slate-950/60 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base">{frame.emoji}</span>
                          {isSelected && (
                            <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-black">
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
            </div>
          )}

          {/* TAB 3: APP PASSCODE */}
          {isSelf && activeTab === 'security' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <span>رمز قفل اختصاصی برنامه</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAppPasscodeEnabled}
                    onChange={(e) => setIsAppPasscodeEnabled(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  با فعال‌سازی این بخش، هنگام باز کردن وب‌اپلیکیشن رمز عبور ۴ رقمی جهت دسترسی مطالبه می‌شود.
                </p>
              </div>

              {isAppPasscodeEnabled && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">رمز عبور عددی برنامه (۴ رقم):</label>
                  <div className="relative">
                    <input
                      type={showPasscode ? "text" : "password"}
                      maxLength={6}
                      value={appPasscode}
                      onChange={(e) => setAppPasscode(e.target.value.replace(/\D/g, ""))}
                      placeholder="1234"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-center font-mono text-sm tracking-widest text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {updateMsg && (
                <p className="text-xs text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/40 text-center">
                  {updateMsg}
                </p>
              )}

              <button
                onClick={handleSaveProfileChanges}
                disabled={isProcessing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg transition"
              >
                ذخیره تنظیمات قفل
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
