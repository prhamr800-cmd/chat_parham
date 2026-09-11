import React, { useState } from "react";
import { X, MessageSquare, Users, Radio, Check, Plus, Search } from "lucide-react";

interface NewChatModalProps {
  currentUser: any;
  users: { [id: string]: any };
  onClose: () => void;
  onCreateChat: (payload: {
    chatName: string;
    chatType: 'direct' | 'group' | 'channel';
    members: string[];
    avatarEmoji?: string;
    avatarColor?: string;
    description?: string;
  }) => void;
  appLanguage?: 'fa' | 'en';
}

export default function NewChatModal({ currentUser, users, onClose, onCreateChat, appLanguage = 'fa' }: NewChatModalProps) {
  const [chatType, setChatType] = useState<'direct' | 'group' | 'channel'>('direct');
  const [searchQuery, setSearchQuery] = useState("");
  const [chatName, setChatName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [avatarColor, setAvatarColor] = useState("bg-blue-600");
  const [avatarEmoji, setAvatarEmoji] = useState("👥");

  const colors = [
    "bg-sky-600", "bg-indigo-600", "bg-emerald-600", 
    "bg-rose-600", "bg-amber-600", "bg-violet-600", "bg-teal-600"
  ];
  const emojis = ["🦊", "🦁", "🐼", "🦉", "🥷", "🧙", "🧑‍🚀", "👾", "🌟", "👑", "💬", "📢", "🚀", "💡"];

  // Filter users based on search query (excluding current user and owner for direct chat)
  const isOwnerSearch = searchQuery.trim().toLowerCase().replace('@', '') === 'parham';
  
  const availableUsers = Object.values(users).filter(u => {
    if (!u || u.id === currentUser.id) return false;
    
    // Disable direct chat with owner (parham) for non-owner users
    const isTargetOwner = u.role === 'owner' || u.username?.toLowerCase() === 'parham' || u.id === 'usr_parham';
    if (isTargetOwner && currentUser.role !== 'owner' && currentUser.username?.toLowerCase() !== 'parham') {
      return false;
    }

    const q = searchQuery.trim().toLowerCase().replace('@', '');
    if (!q) return false; // ID-based search required

    const usernameMatch = u.username?.toLowerCase().includes(q);
    const nicknameMatch = u.nickname?.toLowerCase().includes(q);
    const idMatch = u.id?.toLowerCase().includes(q);

    return usernameMatch || nicknameMatch || idMatch;
  });

  const toggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (chatType === 'direct') {
      if (selectedMembers.length !== 1) return;
      const targetUser = users[selectedMembers[0]];
      onCreateChat({
        chatName: targetUser.nickname,
        chatType: 'direct',
        members: [currentUser.id, targetUser.id],
        avatarEmoji: targetUser.avatarEmoji,
        avatarColor: targetUser.avatarColor,
        description: `گفتگوی خصوصی دو نفره با ${targetUser.nickname}`
      });
    } else {
      if (!chatName) return;
      onCreateChat({
        chatName,
        chatType,
        members: [currentUser.id, ...selectedMembers],
        avatarEmoji,
        avatarColor,
        description: description || `یک ${chatType === 'group' ? 'گروه خصوصی' : 'کانال خصوصی'} جدید`
      });
    }
  };

  const isCurrentUserOwner = currentUser?.role === 'owner' || currentUser?.username?.toLowerCase() === 'parham' || currentUser?.id === 'usr_parham';

  if (isCurrentUserOwner) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${appLanguage === 'fa' ? 'dir-rtl' : 'dir-ltr'}`} dir={appLanguage === 'fa' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-xl">
            🚫
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-white">امکان ایجاد چت برای مالک سیستم غیرفعال است</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              به عنوان مالک سیستم (پرهام)، دسترسی به چت، ایجاد گفتگوی جدید یا ارسال پیام برای شما غیرفعال می‌باشد.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            بستن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${appLanguage === 'fa' ? 'dir-rtl' : 'dir-ltr'}`} dir={appLanguage === 'fa' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="text-sm font-extrabold text-white">
            {appLanguage === 'en' ? 'Create New Chat' : 'ایجاد گفتگوی جدید'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-800 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Type Tabs */}
        <div className="flex bg-slate-950 p-1 mx-4 mt-4 rounded-xl border border-slate-800/60">
          <button
            type="button"
            onClick={() => { setChatType('direct'); setSelectedMembers([]); }}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${chatType === 'direct' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{appLanguage === 'en' ? 'Direct Chat' : 'چت خصوصی'}</span>
          </button>
          <button
            type="button"
            onClick={() => { setChatType('group'); setSelectedMembers([]); setAvatarEmoji("👥"); }}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${chatType === 'group' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{appLanguage === 'en' ? 'Private Group' : 'گروه خصوصی'}</span>
          </button>
          <button
            type="button"
            onClick={() => { setChatType('channel'); setSelectedMembers([]); setAvatarEmoji("📢"); }}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${chatType === 'channel' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{appLanguage === 'en' ? 'Private Channel' : 'کانال خصوصی'}</span>
          </button>
        </div>

        {/* Main Form content */}
        <form onSubmit={handleSubmit} className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* 1. Group / Channel details if not direct chat */}
            {chatType !== 'direct' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      {chatType === 'group' 
                        ? (appLanguage === 'en' ? 'Group Name' : 'نام گروه')
                        : (appLanguage === 'en' ? 'Channel Name' : 'نام کانال')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={chatType === 'group' 
                        ? (appLanguage === 'en' ? 'e.g. Project Team' : 'مثال: همکاران پروژه')
                        : (appLanguage === 'en' ? 'e.g. Tech News' : 'مثال: اخبار تکنولوژی')}
                      value={chatName}
                      onChange={(e) => setChatName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      {appLanguage === 'en' ? 'Emoji' : 'اموجی نمایه'}
                    </label>
                    <select
                      value={avatarEmoji}
                      onChange={(e) => setAvatarEmoji(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      {emojis.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    {appLanguage === 'en' ? 'Short Description' : 'توضیحات کوتاه'}
                  </label>
                  <input
                    type="text"
                    placeholder={appLanguage === 'en' ? 'Chat topic...' : 'موضوع گفتگو...'}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Theme colors */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    {appLanguage === 'en' ? 'Theme Color' : 'رنگ نمایه'}
                  </label>
                  <div className="flex gap-2">
                    {colors.map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setAvatarColor(col)}
                        className={`w-5 h-5 rounded-full border transition shrink-0 ${col} ${avatarColor === col ? "border-white scale-110" : "border-transparent"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. User Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400">
                {chatType === 'direct' 
                  ? (appLanguage === 'en' ? 'Select Contact' : 'انتخاب مخاطب چت')
                  : (appLanguage === 'en' ? 'Select Members' : 'انتخاب اعضا')}
              </label>

              {/* User search bar */}
              <div className="relative">
                <span className={`absolute inset-y-0 ${appLanguage === 'fa' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center text-slate-500`}>
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder={appLanguage === 'en' ? 'Enter exact ID or @username...' : 'آیدی یا نام کاربری (@username) را وارد کنید...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full ${appLanguage === 'fa' ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none`}
                />
              </div>

              {/* User List */}
              <div className="space-y-1 max-h-[160px] overflow-y-auto pr-0.5">
                {isOwnerSearch ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-1">
                    <p className="text-xs font-bold text-amber-400">🚫 ارتباط مستقیم با مالک غیرفعال است</p>
                    <p className="text-[10px] text-slate-400">
                      جهت مطرح کردن مشکلات، گزارش‌ها یا سوالات خود لطفاً از **ربات پشتیبانی و گزارشات 🤖** استفاده نمایید.
                    </p>
                  </div>
                ) : availableUsers.length > 0 ? (
                  availableUsers.map(u => {
                    const isSelected = selectedMembers.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          if (chatType === 'direct') {
                            setSelectedMembers([u.id]);
                          } else {
                            toggleMember(u.id);
                          }
                        }}
                        className={`w-full text-start p-2 rounded-xl border transition flex items-center justify-between ${isSelected ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-950/40 border-slate-800/50 hover:bg-slate-950'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-md ${u.avatarColor || 'bg-slate-800'}`}>
                            {u.avatarEmoji || '👤'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{u.nickname}</span>
                            <span className="text-[10px] text-slate-500 font-mono">@{u.username}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="p-0.5 bg-blue-500 text-white rounded-full">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-slate-500 text-[10px]">
                    {!searchQuery.trim()
                      ? (appLanguage === 'en' ? 'Enter a user ID or @username to search.' : 'برای یافتن مخاطب، آیدی یا نام کاربری (@username) را وارد کنید.')
                      : (appLanguage === 'en' ? 'No users found with this ID.' : 'کاربری با این آیدی یا نام کاربری پیدا نشد.')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action trigger */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl transition"
            >
              {appLanguage === 'en' ? 'Cancel' : 'انصراف'}
            </button>
            <button
              type="submit"
              disabled={selectedMembers.length === 0 || (chatType !== 'direct' && !chatName)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition flex items-center gap-1"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>
                {chatType === 'direct' 
                  ? (appLanguage === 'en' ? 'Start Chat' : 'ایجاد گفتگو')
                  : chatType === 'group' 
                    ? (appLanguage === 'en' ? 'Create Group' : 'ساخت گروه خصوصی')
                    : (appLanguage === 'en' ? 'Create Channel' : 'ساخت کانال خصوصی')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
