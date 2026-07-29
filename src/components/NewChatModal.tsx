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
}

export default function NewChatModal({ currentUser, users, onClose, onCreateChat }: NewChatModalProps) {
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

  // Filter users based on search query (excluding current user)
  const availableUsers = Object.values(users).filter(u => {
    if (u.id === currentUser.id) return false;
    const q = searchQuery.toLowerCase();
    return u.nickname.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm dir-rtl" dir="rtl">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="text-sm font-extrabold text-white">ایجاد گفتگوی جدید</h2>
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
            <span>چت خصوصی</span>
          </button>
          <button
            type="button"
            onClick={() => { setChatType('group'); setSelectedMembers([]); setAvatarEmoji("👥"); }}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${chatType === 'group' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>گروه خصوصی</span>
          </button>
          <button
            type="button"
            onClick={() => { setChatType('channel'); setSelectedMembers([]); setAvatarEmoji("📢"); }}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${chatType === 'channel' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>کانال خصوصی</span>
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
                      {chatType === 'group' ? 'نام گروه' : 'نام کانال'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={chatType === 'group' ? 'مثال: همکاران پروژه' : 'مثال: اخبار تکنولوژی'}
                      value={chatName}
                      onChange={(e) => setChatName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">اموجی نمایه</label>
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
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">توضیحات کوتاه</label>
                  <input
                    type="text"
                    placeholder="موضوع گفتگو..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Theme colors */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">رنگ نمایه</label>
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
                {chatType === 'direct' ? 'انتخاب مخاطب چت' : 'انتخاب اعضا'}
              </label>

              {/* User search bar */}
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="جستجوی نام یا نام کاربری..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-8 pl-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                />
              </div>

              {/* User List */}
              <div className="space-y-1 max-h-[160px] overflow-y-auto pr-0.5">
                {availableUsers.length > 0 ? (
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
                        className={`w-full text-right p-2 rounded-xl border transition flex items-center justify-between ${isSelected ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-950/40 border-slate-800/50 hover:bg-slate-950'}`}
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
                    هیچ کاربری یافت نشد. منتظر ثبت نام سایرین بمانید.
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
              انصراف
            </button>
            <button
              type="submit"
              disabled={selectedMembers.length === 0 || (chatType !== 'direct' && !chatName)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition flex items-center gap-1"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>
                {chatType === 'direct' ? 'ایجاد گفتگو' : chatType === 'group' ? 'ساخت گروه خصوصی' : 'ساخت کانال خصوصی'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
