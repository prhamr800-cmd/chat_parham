import React, { useState } from "react";
import { 
  X, Users, MessageSquare, Settings, Edit3, Trash2, 
  UserPlus, UserMinus, LogOut, Check, Plus, Search, ArrowLeft,
  Sparkles, Shield, Compass, ChevronLeft, User, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GroupProfileModalProps {
  chatId: string;
  chats: any[];
  users: { [id: string]: any };
  currentUser: any;
  onClose: () => void;
  onSelectMember: (userId: string) => void;
  onUpdateChat: (chatId: string, updates: { 
    name?: string; 
    description?: string; 
    avatarColor?: string; 
    avatarEmoji?: string; 
    members?: string[]; 
    disableAiIntervention?: boolean;
    aiAccessMode?: 'disabled' | 'summary_only' | 'full_participation';
  }) => void;
  onDeleteChat: (chatId: string) => void;
  appLanguage?: 'fa' | 'en';
}

export default function GroupProfileModal({
  chatId,
  chats,
  users,
  currentUser,
  onClose,
  onSelectMember,
  onUpdateChat,
  onDeleteChat,
  appLanguage = 'fa'
}: GroupProfileModalProps) {
  const chat = chats.find(c => c.id === chatId);

  if (!chat) {
    return (
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 text-center max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.1)]"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-slate-200 text-sm font-bold mb-5">گروه یا کانال مورد نظر یافت نشد.</p>
          <button 
            onClick={onClose} 
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            بستن پنجره
          </button>
        </motion.div>
      </div>
    );
  }

  const isCreator = chat.creatorId === currentUser?.id;
  const isChannel = chat.type === 'channel';

  const [activeTab, setActiveTab] = useState<"info" | "manage">(isCreator ? "manage" : "info");
  const [chatName, setChatName] = useState(chat.name);
  const [description, setDescription] = useState(chat.description || "");
  const [avatarColor, setAvatarColor] = useState(chat.avatarColor || "bg-indigo-600");
  const [avatarEmoji, setAvatarEmoji] = useState(chat.avatarEmoji || "👥");
  const [disableAiIntervention, setDisableAiIntervention] = useState(chat.disableAiIntervention || false);
  const [aiAccessMode, setAiAccessMode] = useState<'disabled' | 'summary_only' | 'full_participation'>(
    chat.aiAccessMode || (chat.disableAiIntervention ? 'disabled' : 'full_participation')
  );
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const colors = [
    "bg-sky-600", "bg-indigo-600", "bg-emerald-600", 
    "bg-rose-600", "bg-amber-600", "bg-violet-600", "bg-teal-600"
  ];
  const emojis = ["🦊", "🦁", "🐼", "🦉", "🥷", "🧙", "🧑‍🚀", "👾", "🌟", "👑", "💬", "📢", "🚀", "💡", "👥"];

  // Users who are NOT members yet
  const availableUsersToInvite = Object.values(users).filter((u: any) => {
    return !chat.members.includes(u.id) && u.id !== "usr_parham_ai";
  });

  const filteredInviteUsers = availableUsersToInvite.filter((u: any) => {
    const q = memberSearchQuery.toLowerCase();
    return u.nickname.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });

  const handleAddMember = (userId: string) => {
    const updatedMembers = [...chat.members, userId];
    onUpdateChat(chat.id, { members: updatedMembers });
  };

  const handleKickMember = (userId: string) => {
    const updatedMembers = chat.members.filter((id: string) => id !== userId);
    onUpdateChat(chat.id, { members: updatedMembers });
  };

  const handleLeaveChat = () => {
    const term = isChannel ? "کانال" : "گروه";
    if (window.confirm(`آیا مطمئن هستید که می‌خواهید از این ${term} خارج شوید؟`)) {
      const updatedMembers = chat.members.filter((id: string) => id !== currentUser.id);
      onUpdateChat(chat.id, { members: updatedMembers });
      onClose();
    }
  };

  const handleDeleteChat = () => {
    const term = isChannel ? "کانال" : "گروه";
    if (window.confirm(`آیا مطمئن هستید که می‌خواهید این ${term} را برای همیشه حذف کنید؟ تمامی پیام‌ها و فایل‌ها برای همه کاربران پاک خواهند شد.`)) {
      onDeleteChat(chat.id);
      onClose();
    }
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateChat(chat.id, {
      name: chatName,
      description: description,
      avatarColor: avatarColor,
      avatarEmoji: avatarEmoji,
      disableAiIntervention: aiAccessMode === 'disabled',
      aiAccessMode: aiAccessMode
    });
    setActiveTab("info");
  };

  // Animation configuration
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 25, filter: "blur(10px)" },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 350, damping: 26, mass: 1 } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 15, 
      filter: "blur(8px)",
      transition: { duration: 0.25, ease: "easeIn" } 
    }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20, filter: "blur(4px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, filter: "blur(4px)", transition: { duration: 0.2, ease: "easeIn" } }
  };

  const itemStaggerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.04,
        type: "spring",
        stiffness: 260,
        damping: 18
      }
    })
  };

  return (
    <motion.div 
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 ${appLanguage === 'fa' ? 'dir-rtl' : 'dir-ltr'}`} 
      dir={appLanguage === 'fa' ? 'rtl' : 'ltr'}
    >
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        variants={modalVariants}
        className="bg-slate-900/85 border border-slate-800/80 backdrop-blur-2xl rounded-[32px] overflow-hidden max-w-md w-full shadow-[0_0_80px_rgba(0,0,0,0.6),0_0_40px_rgba(99,102,241,0.1)] relative flex flex-col max-h-[85vh] md:max-h-[700px] transition-all"
      >
        {/* Decorative Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 shrink-0" />

        {/* Custom Header */}
        <div className="h-20 w-full bg-gradient-to-b from-slate-950/70 to-transparent flex items-center justify-between px-6 border-b border-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">
                {chat.name}
              </h2>
              <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">
                {isChannel ? 'مشخصات و کنترل کانال' : 'مشخصات و کنترل گروه عمومی'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-white rounded-xl transition-all duration-200 flex items-center justify-center active:scale-90 shadow-inner group"
            title="بستن"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Tab Selection Bar (If creator, show beautiful slide indicators) */}
        {isCreator && (
          <div className="px-6 py-1 shrink-0">
            <div className="bg-slate-950/60 p-1 rounded-2xl border border-slate-800/60 flex relative">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 z-10 ${activeTab === "info" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"}`}
              >
                <Compass className="w-4 h-4" />
                <span>نمای کلی و اعضا</span>
              </button>
              <button
                onClick={() => setActiveTab("manage")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 z-10 ${activeTab === "manage" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"}`}
              >
                <Settings className="w-4 h-4" />
                <span>تنظیمات و مدیریت</span>
              </button>

              {/* Slider highlight background */}
              <motion.div
                layoutId="activeTabGlow"
                className="absolute top-1 bottom-1 rounded-xl bg-slate-900 border border-slate-800/80 shadow-md pointer-events-none"
                style={{
                  width: "calc(50% - 6px)",
                  right: activeTab === "info" ? "6px" : "auto",
                  left: activeTab === "manage" ? "6px" : "auto"
                }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            </div>
          </div>
        )}

        {/* Content Area with Animations */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar min-h-0">
          <AnimatePresence mode="wait">
            {activeTab === "info" ? (
              /* --- PROFILE / INFO TAB --- */
              <motion.div
                key="tab-info"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-5"
              >
                {/* Visual Header card */}
                <div className="relative group overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-950/80 to-slate-900/40 p-5 border border-slate-800/70 shadow-lg flex items-center gap-4">
                  {/* Decorative corner lights */}
                  <div className={`absolute -right-12 -top-12 w-28 h-28 ${chat.avatarColor || 'bg-indigo-600'} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
                  
                  {/* Main animated avatar badge */}
                  <motion.div 
                    whileHover={{ scale: 1.08, rotate: -5 }}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg border border-white/10 ${chat.avatarColor || 'bg-indigo-600'} relative`}
                  >
                    {chat.avatarEmoji || (isChannel ? '📢' : '👥')}
                    {/* Ring glow around avatar */}
                    <span className="absolute inset-0 rounded-2xl border-2 border-indigo-400/20 animate-pulse" />
                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white truncate">{chat.name}</h3>
                      {chat.creatorId === currentUser?.id && (
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-[8px] font-black rounded-lg">
                          مالک
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block animate-ping" />
                      <span>{chat.members.length} عضو فعال {isChannel ? "دنبال‌کننده" : ""}</span>
                    </p>
                  </div>
                </div>

                {/* Description Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] text-slate-400 font-bold">درباره این {isChannel ? 'کانال' : 'گروه'}</span>
                  </div>
                  <div className="text-xs text-slate-200 bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl whitespace-pre-line leading-relaxed shadow-inner">
                    {chat.description || `هیچ توضیحی برای این ${isChannel ? 'کانال' : 'گروه'} ثبت نشده است.`}
                  </div>
                </div>

                {/* Members lists with stagger loading */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block">اعضای فعال گروه</span>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-2.5 max-h-52 overflow-y-auto custom-scrollbar divide-y divide-slate-800/30 shadow-inner">
                    {chat.members.map((memberId: string, idx: number) => {
                      const member = users[memberId];
                      if (!member) return null;
                      
                      const isSelf = member.id === currentUser?.id;
                      const isMemberCreator = member.id === chat.creatorId;

                      return (
                        <motion.div
                          key={memberId}
                          custom={idx}
                          variants={itemStaggerVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ scale: 1.01, x: -4, backgroundColor: "rgba(30, 41, 59, 0.4)" }}
                          onClick={() => onSelectMember(memberId)}
                          className="flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={`تصویر عضو گروه: ${member.nickname} در پیام‌رسان پریوو`}
                                loading="lazy"
                                decoding="async"
                                className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-800 group-hover:ring-indigo-500/50 transition-all"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold text-white shadow-md transition-all ring-2 ring-slate-800 group-hover:ring-indigo-500/50 ${member.avatarColor || 'bg-slate-700'}`}>
                                {member.avatarEmoji || '👤'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-black text-slate-100 group-hover:text-indigo-400 transition block truncate">
                                {member.nickname} {isSelf && " (شما)"}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono block mt-0.5 truncate">@{member.username}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isMemberCreator && (
                              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[8px] font-black rounded-full flex items-center gap-0.5">
                                <Shield className="w-2.5 h-2.5" />
                                <span>مدیر</span>
                              </span>
                            )}
                            {member.isOnline && !member.isFiltered ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] block"></span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-600 block"></span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Leave Button for non-creators */}
                {!isCreator && chat.members.includes(currentUser?.id) && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleLeaveChat}
                    className="w-full py-3 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-red-950/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>خروج داوطلبانه از {isChannel ? 'کانال' : 'گروه'}</span>
                  </motion.button>
                )}
              </motion.div>
            ) : (
              /* --- MANAGEMENT TAB (Owner/Creator only) --- */
              <motion.div
                key="tab-manage"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-5"
              >
                {/* Edit Form */}
                <form onSubmit={handleSaveDetails} className="space-y-4 bg-slate-950/40 border border-slate-800/80 p-5 rounded-[24px] shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <span className="text-[10px] font-black text-indigo-400 block mb-1">ویرایش مشخصات اصلی گفتگو</span>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold text-slate-400 mb-1.5">
                        {isChannel ? 'نام جدید کانال' : 'نام جدید گروه'}
                      </label>
                      <input
                        type="text"
                        required
                        value={chatName}
                        onChange={(e) => setChatName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500/80 font-bold transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-1.5">نماد (اموجی)</label>
                      <select
                        value={avatarEmoji}
                        onChange={(e) => setAvatarEmoji(e.target.value)}
                        className="w-full px-2.5 py-2.5 bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500/80"
                      >
                        {emojis.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1.5">توضیحات تکمیلی</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 custom-scrollbar resize-none"
                      placeholder="توضیحاتی کوتاه بنویسید..."
                    />
                  </div>

                  {/* Avatar Color Picker */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-2">تغییر رنگ پس‌زمینه نمایه</label>
                    <div className="flex gap-2">
                      {colors.map(col => (
                        <motion.button
                          key={col}
                          type="button"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setAvatarColor(col)}
                          className={`w-6 h-6 rounded-full border transition shrink-0 ${col} ${avatarColor === col ? "border-white ring-4 ring-indigo-500/30 scale-110" : "border-transparent"}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Parham AI Dedicated Settings Panel */}
                  <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950/80 border border-indigo-500/20 p-4 rounded-2xl space-y-3 relative overflow-hidden shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-indigo-300 block">پرهام AI (مدیریت دسترسی هوش مصنوعی)</span>
                        <span className="text-[10px] text-slate-400 block">سطح مجاز خواندن پیام‌ها و دخالت ربات در این گفتگو</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setAiAccessMode('disabled')}
                        className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                          aiAccessMode === 'disabled'
                            ? 'bg-red-500/15 border-red-500/40 text-red-300 shadow-md ring-1 ring-red-500/30'
                            : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold block">🚫 غیرفعال</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">ربات هیچ پیامی را نمیخواند و هیچ پاسخی نمی‌دهد</span>
                        </div>
                        {aiAccessMode === 'disabled' && <Check className="w-4 h-4 text-red-400 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiAccessMode('summary_only')}
                        className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                          aiAccessMode === 'summary_only'
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                            : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold block">📑 فقط برای خلاصه‌سازی</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">پاسخ‌دهی خودکار غیرفعال است؛ فقط هنگام درخواست خلاصه‌سازی فعال می‌شود</span>
                        </div>
                        {aiAccessMode === 'summary_only' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiAccessMode('full_participation')}
                        className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                          aiAccessMode === 'full_participation'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                            : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold block">⚡ مشارکت کامل در گفتگو</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">ربات پیام‌ها را پردازش کرده و در صورت صدا زدن یا لزوم پاسخ می‌دهد</span>
                        </div>
                        {aiAccessMode === 'full_participation' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-[10px] rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-950/50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ذخیره و ثبت تغییرات</span>
                    </motion.button>
                  </div>
                </form>

                {/* Remove Members panel */}
                <div className="space-y-2 bg-slate-950/40 border border-slate-800/80 p-5 rounded-[24px] shadow-lg">
                  <span className="text-[10px] font-black text-red-400 block">اخراج و حذف اعضای فعلی</span>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar border border-slate-800/60 rounded-xl divide-y divide-slate-800/30 bg-slate-950/40 p-2 shadow-inner">
                    {chat.members.map((memberId: string) => {
                      const member = users[memberId];
                      if (!member) return null;
                      const isMemberCreator = member.id === chat.creatorId;

                      return (
                        <div key={memberId} className="flex items-center justify-between py-2 px-1 rounded-lg">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 font-bold text-white shadow ${member.avatarColor || 'bg-slate-700'}`}>
                              {member.avatarEmoji || '👤'}
                            </div>
                            <span className="text-[11px] font-bold text-slate-200 truncate">{member.nickname}</span>
                          </div>
                          
                          {!isMemberCreator ? (
                            <motion.button
                              whileHover={{ scale: 1.1, backgroundColor: "rgba(239,68,68,0.15)" }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={() => handleKickMember(memberId)}
                              className="p-1.5 border border-transparent hover:border-red-500/20 text-red-400 rounded-lg transition-colors"
                              title="حذف از گفتگو"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </motion.button>
                          ) : (
                            <span className="text-[8px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">سازنده</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Invite Members Panel */}
                <div className="space-y-3 bg-slate-950/40 border border-slate-800/80 p-5 rounded-[24px] shadow-lg">
                  <span className="text-[10px] font-black text-emerald-400 block">افزودن عضو جدید به گفتگو</span>
                  
                  {/* Styled search field */}
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="جستجوی نام یا هندل کاربری..."
                      className="w-full pr-8.5 pl-3.5 py-2.5 bg-slate-900 border border-slate-800/80 rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500/80 placeholder:text-slate-500 transition-colors"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto custom-scrollbar border border-slate-800/60 rounded-xl divide-y divide-slate-800/30 bg-slate-950/40 p-2 shadow-inner">
                    {filteredInviteUsers.length > 0 ? (
                      filteredInviteUsers.map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-slate-800/20 transition-all">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 font-bold text-white shadow ${u.avatarColor || 'bg-slate-700'}`}>
                              {u.avatarEmoji || '👤'}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold text-slate-200 block truncate">{u.nickname}</span>
                              <span className="text-[8px] text-slate-500 block mt-0.5 truncate font-mono">@{u.username}</span>
                            </div>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => handleAddMember(u.id)}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 text-[9px] font-black rounded-lg transition-all flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>افزودن عضو</span>
                          </motion.button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-[10px]">
                        {availableUsersToInvite.length === 0 ? "همه کاربران موجود عضو شده‌اند." : "کاربر جدیدی یافت نشد."}
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete Entire chat */}
                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.01, backgroundColor: "rgb(239, 68, 68)" }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleDeleteChat}
                    className="w-full py-3 bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all"
                  >
                    <Trash2 className="w-4 h-4 animate-bounce" />
                    <span>انحلال و حذف کامل {isChannel ? 'کانال' : 'گروه'}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
