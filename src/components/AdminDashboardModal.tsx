import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  ShieldCheck,
  ShieldAlert,
  Users,
  Radio,
  RefreshCw,
  Ban,
  UserCheck,
  Trash2,
  LayoutDashboard,
  Megaphone,
  Settings,
  MessageSquare,
  AlertTriangle,
  Crown,
  Award,
  Check,
  Edit2,
  Lock,
  Unlock,
  Volume2,
  FileText,
  Clock,
  Heart,
  Database,
  Download,
  Upload,
  Eye,
  EyeOff,
  Key,
  ArrowRight,
  File,
  Music,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminDashboardModalProps {
  currentUser: any;
  onClose: () => void;
  onUpdateUserInParent: (userId: string, updates: any) => void;
  systemUsers: { [id: string]: any };
  appLanguage?: 'fa' | 'en';
}

type TabType = "dashboard" | "users" | "sub_requests" | "chats" | "broadcast" | "reports" | "settings";

export default function AdminDashboardModal({
  currentUser,
  onClose,
  onUpdateUserInParent,
  systemUsers,
  appLanguage = 'fa'
}: AdminDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [users, setUsers] = useState<any[]>([]);
  const [subRequests, setSubRequests] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalMessagesCount: 0,
    voiceCount: 0,
    fileCount: 0,
    textCount: 0,
    chatsBreakdown: { direct: 0, group: 0, channel: 0 },
    reportsCount: 0,
    activeWsCount: 0,
    totalUsersCount: 0
  });
  const [systemSettings, setSystemSettings] = useState<any>({
    disableRegistration: false,
    disableAIBot: false,
    maxFileSizeMB: 50,
    welcomeMessage: "",
    maintenanceMode: false,
    maintenanceMessage: "",
    aiModel: "gemini-3.6-flash",
    aiSystemInstructions: "",
    aiTemperature: 0.7,
    aiSearchGrounding: false,
    bannedUsernames: ""
  });

  const [loading, setLoading] = useState(false);
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [usersStatusFilter, setUsersStatusFilter] = useState<"all" | "active" | "filtered">("all");
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Broadcast & Settings Inputs
  const [broadcastText, setBroadcastText] = useState("");
  const [pinBroadcast, setPinBroadcast] = useState(true);

  // User details editor inputs
  const [editNickname, setEditNickname] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editRole, setEditRole] = useState("user");
  const [editCustomTitle, setEditCustomTitle] = useState("");
  const [editAvatarColor, setEditAvatarColor] = useState("bg-indigo-600");
  const [editAvatarEmoji, setEditAvatarEmoji] = useState("👤");

  // Fetch metrics and settings
  const fetchSettingsAndMetrics = async () => {
    try {
      const response = await fetch(`/api/admin/settings-metrics?requesterId=${currentUser.id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setMetrics(data.metrics);
        setSystemSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to fetch admin settings & metrics:", err);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?requesterId=${currentUser.id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(data.users || []);
        data.users.forEach((u: any) => {
          onUpdateUserInParent(u.id, u);
        });
      } else {
        alert(data.error || "خطا در دریافت لیست کاربران");
      }
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chats
  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/chats?requesterId=${currentUser.id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setChats(data.chats || []);
      }
    } catch (err) {
      console.error("Failed to fetch system chats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?requesterId=${currentUser.id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription requests
  const fetchSubRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/subscription-requests?requesterId=${currentUser.id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setSubRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to fetch subscription requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubRequest = async (requestId: string) => {
    try {
      const response = await fetch("/api/admin/approve-subscription-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: currentUser.id, requestId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert(data.message || "اشتراک کاربر تایید گردید.");
        fetchSubRequests();
        fetchUsers();
      } else {
        alert(data.error || "خطا در تایید اشتراک.");
      }
    } catch (e) {
      console.error("Approve sub error", e);
    }
  };

  const handleRejectSubRequest = async (requestId: string) => {
    try {
      const response = await fetch("/api/admin/reject-subscription-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: currentUser.id, requestId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert(data.message || "درخواست رد شد.");
        fetchSubRequests();
      } else {
        alert(data.error || "خطا در رد درخواست.");
      }
    } catch (e) {
      console.error("Reject sub error", e);
    }
  };

  const handleDeleteUserAccount = async (targetUser: any) => {
    if (targetUser.role === "owner" || targetUser.username.toLowerCase() === "parham") {
      alert("حذف حساب کاربر مالک ارشد امکان‌پذیر نمی‌باشد.");
      return;
    }

    const confirmMsg = `⚠️ هشدار بسیار مهم:\nآیا از حذف کامل و دائمی حساب کاربری @${targetUser.username} (${targetUser.nickname}) اطمینان کامل دارید؟\n\nبا این کار، حساب کاربری، تمامی پیام‌های ارسال شده توسط او و چت‌های خصوصی (PV) مربوط به او کاملاً پاک خواهد شد و هیچ اثری از آن باقی نخواهد ماند.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser.id,
          targetUserId: targetUser.id
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert(data.message || "حساب کاربری با موفقیت و بدون باقی ماندن هیچ اثری حذف شد.");
        setUsers(prev => prev.filter(u => u.id !== targetUser.id));
        fetchSettingsAndMetrics();
      } else {
        alert(data.error || "خطا در حذف حساب کاربری.");
      }
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  useEffect(() => {
    fetchSettingsAndMetrics();
    fetchUsers();
    fetchSubRequests();
  }, []);

  useEffect(() => {
    if (activeTab === "chats") {
      fetchChats();
    } else if (activeTab === "reports") {
      fetchReports();
    } else if (activeTab === "sub_requests") {
      fetchSubRequests();
    } else if (activeTab === "dashboard") {
      fetchSettingsAndMetrics();
      fetchUsers();
      fetchSubRequests();
    }
  }, [activeTab]);

  // Actions
  const handleToggleFilter = async (targetUser: any) => {
    const isFiltered = !targetUser.isFiltered;
    const actionName = isFiltered ? "مسدودسازی" : "رفع مسدودیت";
    const confirmMessage = `آیا مایل به تغییر وضعیت حساب "${targetUser.nickname}" به "${actionName}" هستید؟`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch("/api/admin/toggle-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser.id,
          targetUserId: targetUser.id,
          filter: isFiltered
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isFiltered } : u));
        onUpdateUserInParent(targetUser.id, { isFiltered });
        fetchSettingsAndMetrics();
      } else {
        alert(data.error || "عملیات ناموفق بود");
      }
    } catch (err) {
      console.error("Error toggling filter:", err);
    }
  };

  const handleStartEditing = (user: any) => {
    setEditingUser(user);
    setEditNickname(user.nickname);
    setEditBio(user.bio || "");
    setEditPassword(user.password || (user.username === "parham" ? "13881388" : "123456"));
    setShowEditPassword(true);
    setEditRole(user.role || "user");
    setEditCustomTitle(user.customTitle || "");
    setEditAvatarColor(user.avatarColor || "bg-indigo-600");
    setEditAvatarEmoji(user.avatarEmoji || "👤");
  };

  const handleSaveUserDetails = async () => {
    if (!editingUser) return;
    try {
      const response = await fetch("/api/admin/update-user-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser.id,
          targetUserId: editingUser.id,
          nickname: editNickname,
          bio: editBio,
          password: editPassword,
          role: editRole,
          customTitle: editCustomTitle,
          avatarColor: editAvatarColor,
          avatarEmoji: editAvatarEmoji
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(prev =>
          prev.map(u =>
            u.id === editingUser.id
              ? {
                  ...u,
                  nickname: editNickname,
                  bio: editBio,
                  password: editPassword || u.password,
                  role: editRole,
                  customTitle: editCustomTitle,
                  avatarColor: editAvatarColor,
                  avatarEmoji: editAvatarEmoji
                }
              : u
          )
        );
        onUpdateUserInParent(editingUser.id, {
          nickname: editNickname,
          bio: editBio,
          role: editRole,
          customTitle: editCustomTitle,
          avatarColor: editAvatarColor,
          avatarEmoji: editAvatarEmoji
        });
        setEditingUser(null);
        alert("تغییرات با موفقیت روی کاربر ذخیره شد.");
      } else {
        alert(data.error || "ذخیره تغییرات با خطا مواجه شد.");
      }
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  const handleDeleteChat = async (chatId: string, name: string) => {
    if (!window.confirm(`آیا از حذف کامل چت گروهی/کانال "${name}" به همراه تمام پیام‌های ارسال شده در آن اطمینان دارید؟`)) return;

    try {
      const response = await fetch("/api/admin/delete-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser.id,
          chatId
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        alert(data.message || "گروه با موفقیت حذف گردید.");
        fetchSettingsAndMetrics();
      } else {
        alert(data.error || "خطا در حذف گروه چت.");
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  const handleReportAction = async (reportId: string, action: "dismiss" | "delete_message") => {
    const confirmMsg =
      action === "delete_message"
        ? "آیا از حذف کامل پیام گزارش شده از پایگاه داده و محیط چت اطمینان دارید؟"
        : "آیا مطمئن هستید که می‌خواهید این گزارش را بدون اقدام حذف و رد کنید؟";

    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await fetch("/api/admin/report-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser.id,
          reportId,
          action
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        fetchSettingsAndMetrics();
        alert(data.message || "اقدام با موفقیت روی گزارش انجام شد.");
      } else {
        alert(data.error || "خطا در انجام عملیات.");
      }
    } catch (err) {
      console.error("Report action error:", err);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) {
      alert("لطفاً متن اطلاعیه را وارد نمایید.");
      return;
    }

    try {
      const response = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser.id,
          content: broadcastText,
          pinAnnouncement: pinBroadcast
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setBroadcastText("");
        alert("اطلاعیه سراسری با موفقیت منتشر و به همراه اعلان سیستمی برای همگان فرستاده شد!");
        fetchSettingsAndMetrics();
      } else {
        alert(data.error || "خطا در انتشار اطلاعیه.");
      }
    } catch (err) {
      console.error("Broadcast error:", err);
    }
  };

  const handleUpdateSystemSettings = async (updates: any) => {
    try {
      const newSettings = { ...systemSettings, ...updates };
      const response = await fetch("/api/admin/update-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser.id,
          settings: updates
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSystemSettings(data.settings);
      } else {
        alert(data.error || "خطا در بروزرسانی تنظیمات سراسری.");
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const res = await fetch("/api/admin/export-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: currentUser.id })
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
          `parham_messenger_backup_${new Date().toISOString().split("T")[0]}.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        alert("نسخه پشتیبان کامل پایگاه داده با موفقیت دانلود شد.");
      } else {
        alert(data.error || "خطا در دانلود بک‌آپ.");
      }
    } catch (e) {
      console.error("Backup export error:", e);
      alert("خطا در برقراری ارتباط با سرور برای دریافت بک‌آپ.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("آیا از بازیابی این فایل بک‌آپ اطمینان دارید؟ داده‌های موجود ادغام و بروزرسانی خواهند شد.")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsImporting(true);
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        const res = await fetch("/api/admin/import-backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requesterId: currentUser.id,
            backupData: parsed,
            mode: "merge"
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert(`نسخه پشتیبان با موفقیت بازیابی شد!\nتعداد کاربران: ${data.stats?.usersCount}\nتعداد چت‌ها: ${data.stats?.chatsCount}\nتعداد پیام‌ها: ${data.stats?.messagesCount}`);
          fetchSettingsAndMetrics();
        } else {
          alert(data.error || "خطا در بازیابی نسخه پشتیبان.");
        }
      } catch (err: any) {
        console.error("Import backup file parse error:", err);
        alert("فایل پشتیبان انتخاب شده نامعتبر یا دارای فرمت نادرست است.");
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Chat & Message Content Inspection State for Owner Supervision
  const [inspectingChat, setInspectingChat] = useState<{ id: string; name: string; type?: string } | null>(null);
  const [inspectingUser, setInspectingUser] = useState<{ id: string; nickname: string; username: string } | null>(null);
  const [inspectingDirectUsers, setInspectingDirectUsers] = useState<{ userA: string; userB: string; userAName: string; userBName: string } | null>(null);
  const [directUserA, setDirectUserA] = useState("");
  const [directUserB, setDirectUserB] = useState("");
  const [inspectedMessages, setInspectedMessages] = useState<any[]>([]);
  const [loadingInspection, setLoadingInspection] = useState(false);
  const [inspectionQuery, setInspectionQuery] = useState("");
  const [inspectionFilter, setInspectionFilter] = useState<"all" | "text" | "media">("all");

  const fetchMessagesForInspection = async (chatId?: string, targetUserId?: string, userA?: string, userB?: string, silent = false) => {
    try {
      if (!silent) setLoadingInspection(true);
      let url = `/api/admin/chat-messages?requesterId=${currentUser.id}`;
      if (chatId) url += `&chatId=${encodeURIComponent(chatId)}`;
      if (targetUserId) url += `&targetUserId=${encodeURIComponent(targetUserId)}`;
      if (userA && userB) url += `&userA=${encodeURIComponent(userA)}&userB=${encodeURIComponent(userB)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setInspectedMessages(data.messages || []);
      } else if (!silent) {
        alert(data.error || "خطا در دریافت پیام‌های چت جهت نظارت.");
      }
    } catch (err) {
      console.error("Error fetching inspected messages:", err);
    } finally {
      if (!silent) setLoadingInspection(false);
    }
  };

  // Live Auto-Sync for Live Chat Monitoring
  useEffect(() => {
    let interval: any = null;
    if (activeTab === "chats" && (inspectingChat || inspectingUser || inspectingDirectUsers)) {
      interval = setInterval(() => {
        fetchMessagesForInspection(
          inspectingChat?.id,
          inspectingUser?.id,
          inspectingDirectUsers?.userA,
          inspectingDirectUsers?.userB,
          true
        );
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, inspectingChat, inspectingUser, inspectingDirectUsers]);

  const handleOpenChatInspector = (chat: { id: string; name: string; type?: string }) => {
    setInspectingChat(chat);
    setInspectingUser(null);
    setInspectingDirectUsers(null);
    setInspectionQuery("");
    setInspectionFilter("all");
    fetchMessagesForInspection(chat.id, undefined);
  };

  const handleOpenUserMessagesInspector = (u: { id: string; nickname: string; username: string }) => {
    setInspectingUser(u);
    setInspectingChat(null);
    setInspectingDirectUsers(null);
    setInspectionQuery("");
    setInspectionFilter("all");
    fetchMessagesForInspection(undefined, u.id);
  };

  const handleOpenDirectChatInspector = () => {
    if (!directUserA || !directUserB) {
      alert("لطفا هر دو کاربر را جهت بازرسی چت خصوصی انتخاب کنید.");
      return;
    }
    if (directUserA === directUserB) {
      alert("لطفا دو کاربر متفاوت انتخاب کنید.");
      return;
    }
    const uA = users.find(u => u.id === directUserA);
    const uB = users.find(u => u.id === directUserB);
    setInspectingDirectUsers({
      userA: directUserA,
      userB: directUserB,
      userAName: uA ? uA.nickname : directUserA,
      userBName: uB ? uB.nickname : directUserB
    });
    setInspectingChat(null);
    setInspectingUser(null);
    setInspectionQuery("");
    setInspectionFilter("all");
    fetchMessagesForInspection(undefined, undefined, directUserA, directUserB);
  };

  const handleDeleteSingleMessage = async (messageId: string) => {
    if (!confirm("آیا از حذف این پیام توسط نظارت مالک اطمینان دارید؟ پیام بلافاصله از گفتگوها و حافظه سیستم پاک خواهد شد.")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/delete-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser.id,
          messageId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInspectedMessages(prev => prev.filter(m => m.id !== messageId));
        fetchSettingsAndMetrics();
      } else {
        alert(data.error || "خطا در حذف پیام.");
      }
    } catch (e) {
      console.error("Delete message error:", e);
      alert("خطا در برقراری ارتباط با سرور.");
    }
  };

  const filteredInspectedMessages = inspectedMessages.filter(msg => {
    const q = inspectionQuery.toLowerCase();
    const messageText = msg.text || msg.content || "";
    const matchesSearch =
      !q ||
      messageText.toLowerCase().includes(q) ||
      (msg.senderNickname && msg.senderNickname.toLowerCase().includes(q)) ||
      (msg.senderUsername && msg.senderUsername.toLowerCase().includes(q)) ||
      (msg.fileName && msg.fileName.toLowerCase().includes(q));

    const matchesFilter =
      inspectionFilter === "all" ||
      (inspectionFilter === "text" && !msg.mediaUrl) ||
      (inspectionFilter === "media" && !!msg.mediaUrl);

    return matchesSearch && matchesFilter;
  });

  // Compute local values
  const totalCount = users.length;
  const filteredCount = users.filter(u => u.isFiltered).length;
  const activeCount = totalCount - filteredCount;
  const onlineCount = users.filter(u => u.isOnline && !u.isFiltered).length;

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.nickname.toLowerCase().includes(usersSearchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(usersSearchQuery.toLowerCase()) ||
      (user.bio && user.bio.toLowerCase().includes(usersSearchQuery.toLowerCase())) ||
      (user.customTitle && user.customTitle.toLowerCase().includes(usersSearchQuery.toLowerCase()));

    const matchesStatus =
      usersStatusFilter === "all" ||
      (usersStatusFilter === "filtered" && user.isFiltered) ||
      (usersStatusFilter === "active" && !user.isFiltered);

    return matchesSearch && matchesStatus;
  });

  const avatarColors = [
    "bg-indigo-600", "bg-emerald-600", "bg-rose-600", "bg-amber-600", 
    "bg-violet-600", "bg-teal-600", "bg-sky-600", "bg-pink-600", "bg-cyan-600"
  ];

  const emojis = ["👑", "🛡️", "💎", "⭐", "🔥", "🚀", "👤", "🤖", "🎨", "💻", "🧠", "🕶️", "🦁", "⚡"];

  return (
    <div className={`fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 ${appLanguage === 'fa' ? 'dir-rtl' : 'dir-ltr'}`} dir={appLanguage === 'fa' ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-slate-900/98 border border-slate-800 rounded-[32px] overflow-hidden max-w-5xl w-full shadow-2xl flex flex-col h-[650px] max-h-[92vh]"
      >
        {/* Superior Header */}
        <div className="h-18 shrink-0 bg-gradient-to-r from-amber-950/15 via-slate-950/30 to-slate-950/40 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shadow-inner">
              <Crown className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                پنل فرماندهی و نظارت ارشد سیستم
                <span className="text-[10px] bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-black animate-pulse">پرهام</span>
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">کنترل سرتاسری روی چت‌ها، نقش‌ها، مسدودسازی‌ها، پیام‌های همگانی و تنظیمات مرکزی سرور</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition"
            title="بستن"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Main Body Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Side / Top Tabs Navigation */}
          <div className="w-full md:w-56 shrink-0 bg-slate-950/35 border-b md:border-b-0 md:border-l border-slate-800/50 p-2 md:p-4 flex md:flex-col justify-between overflow-x-auto custom-scrollbar">
            <div className="flex md:flex-col items-center md:items-stretch gap-1.5 min-w-max md:min-w-0 w-full">
              <span className="hidden md:block text-[9px] font-black text-slate-500 tracking-wider px-2 mb-2">منوی ناوبری پنل</span>
              {[
                { id: "dashboard", label: "میز کار و آمارها", icon: LayoutDashboard },
                { id: "users", label: "مدیریت کاربران", icon: Users, badge: totalCount },
                { id: "sub_requests", label: "درخواست‌های اشتراک", icon: Crown, badge: subRequests.filter(r => r.status === "pending").length },
                { id: "chats", label: "گروه‌ها و کانال‌ها", icon: MessageSquare },
                { id: "broadcast", label: "پیام سراسری سیستم", icon: Megaphone },
                { id: "reports", label: "گزارشات تخلف", icon: ShieldAlert, badge: reports.length || metrics.reportsCount },
                { id: "settings", label: "پیکربندی سیستم", icon: Settings }
              ].map(t => {
                const IconComponent = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id as TabType);
                      setEditingUser(null);
                    }}
                    className={`px-3 py-2 md:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border shrink-0 ${
                      isActive
                        ? "bg-gradient-to-r from-amber-600/15 to-slate-800/40 border-amber-500/30 text-amber-400"
                        : "bg-transparent border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                      <span className="whitespace-nowrap">{t.label}</span>
                    </div>
                    {t.badge !== undefined && t.badge > 0 && (
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md mr-1.5 ${isActive ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex p-3.5 bg-slate-900/60 border border-slate-800/60 rounded-2xl items-center gap-2.5 mt-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
              <div className="text-[10px]">
                <span className="text-slate-400 block font-bold">ارتباط با سرور اصلی</span>
                <span className="text-emerald-400 font-mono text-[9px]">{metrics.activeWsCount} کاربر متصل</span>
              </div>
            </div>
          </div>

          {/* Dynamic Working Workspace */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-950/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {/* TAB 1: DASHBOARD & METRICS */}
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    {/* Visual Highlights Bento Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "کل کاربران پلتفرم", value: metrics.totalUsersCount, desc: "حساب‌های فعال در کل دیتابیس", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
                        { label: "کاربران آنلاین فعلی", value: onlineCount, desc: `${metrics.activeWsCount} سوکت فعال`, icon: Radio, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                        { label: "مجموع پیام‌های سیستم", value: metrics.totalMessagesCount, desc: "ذخیره شده در بانک اطلاعاتی", icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10" },
                        { label: "گزارش‌های معلق", value: metrics.reportsCount, desc: "بررسی نشده توسط مدیریت", icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10" }
                      ].map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <div key={index} className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm hover:border-slate-700 transition">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] text-slate-400 font-black">{item.label}</span>
                              <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                                <Icon className="w-4.5 h-4.5" />
                              </div>
                            </div>
                            <h3 className="text-xl font-black text-white">{item.value}</h3>
                            <span className="text-[9px] text-slate-500 mt-1 block">{item.desc}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Deep Analytics breakdown grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {/* Messages composition metrics */}
                      <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-black text-white mb-1">تفکیک نوع پیام‌های ارسالی</h4>
                          <p className="text-[10px] text-slate-500 mb-4">نمودار توزیع محتوای متنی، صوتی و فایل در کل سیستم</p>
                        </div>
                        <div className="space-y-3">
                          {[
                            { label: "پیام‌های متنی", count: metrics.textCount, pct: metrics.totalMessagesCount ? Math.round((metrics.textCount / metrics.totalMessagesCount) * 100) : 0, color: "bg-blue-500" },
                            { label: "فایل‌های پیوست شده", count: metrics.fileCount, pct: metrics.totalMessagesCount ? Math.round((metrics.fileCount / metrics.totalMessagesCount) * 100) : 0, color: "bg-amber-500" },
                            { label: "پیام‌های صوتی (ویس چت)", count: metrics.voiceCount, pct: metrics.totalMessagesCount ? Math.round((metrics.voiceCount / metrics.totalMessagesCount) * 100) : 0, color: "bg-purple-500" }
                          ].map((bar, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-300 font-bold">{bar.label}</span>
                                <span className="text-slate-400 font-mono">{bar.count} پیام ({bar.pct}%)</span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Chats breakdown metrics */}
                      <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-black text-white mb-1">ساختار چت‌روم‌ها و گفتگوها</h4>
                          <p className="text-[10px] text-slate-500 mb-4">آمار تفکیکی فضاهای گفتگو شامل خصوصی، گروه‌ها و کانال‌ها</p>
                        </div>
                        <div className="space-y-3">
                          {[
                            { label: "گفتگوهای خصوصی (PV)", count: metrics.chatsBreakdown.direct, pct: (metrics.chatsBreakdown.direct + metrics.chatsBreakdown.group + metrics.chatsBreakdown.channel) ? Math.round((metrics.chatsBreakdown.direct / (metrics.chatsBreakdown.direct + metrics.chatsBreakdown.group + metrics.chatsBreakdown.channel)) * 100) : 0, color: "bg-indigo-500" },
                            { label: "گروه‌های عمومی و خصوصی", count: metrics.chatsBreakdown.group, pct: (metrics.chatsBreakdown.direct + metrics.chatsBreakdown.group + metrics.chatsBreakdown.channel) ? Math.round((metrics.chatsBreakdown.group / (metrics.chatsBreakdown.direct + metrics.chatsBreakdown.group + metrics.chatsBreakdown.channel)) * 100) : 0, color: "bg-emerald-500" },
                            { label: "کانال‌های اطلاع‌رسانی", count: metrics.chatsBreakdown.channel, pct: (metrics.chatsBreakdown.direct + metrics.chatsBreakdown.group + metrics.chatsBreakdown.channel) ? Math.round((metrics.chatsBreakdown.channel / (metrics.chatsBreakdown.direct + metrics.chatsBreakdown.group + metrics.chatsBreakdown.channel)) * 100) : 0, color: "bg-rose-500" }
                          ].map((bar, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-300 font-bold">{bar.label}</span>
                                <span className="text-slate-400 font-mono">{bar.count} فضا ({bar.pct}%)</span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick System Status Panel */}
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center justify-between mt-6">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                          <h5 className="text-xs font-black text-amber-400">نظارت بر قوانین پلتفرم</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">سیستم فیلترینگ و مسدودسازی آنی کاربران متخلف فعال است. در صورت مشاهده تخلف، از تب گزارشات استفاده فرمایید.</p>
                        </div>
                      </div>
                      <button
                        onClick={fetchUsers}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        همگام‌سازی سریع دیتابیس
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: USER MANAGEMENT WITH FULL EDIT PANEL */}
                {activeTab === "users" && (
                  <div className="space-y-5">
                    {editingUser ? (
                      /* USER DETAILS INTEGRATED FORM */
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4"
                      >
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                          <h4 className="text-xs font-black text-amber-400 flex items-center gap-2">
                            <Edit2 className="w-4 h-4" />
                            ویرایش و پیکربندی پروفایل حساب: @{editingUser.username}
                          </h4>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-2.5 py-1 text-slate-400 hover:text-white text-[10px] font-bold bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                          >
                            بازگشت به لیست
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold block">نام مستعار نمایشی (Nickname)</label>
                            <input
                              type="text"
                              value={editNickname}
                              onChange={e => setEditNickname(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold block">بیوگرافی کاربری (Bio)</label>
                            <input
                              type="text"
                              value={editBio}
                              onChange={e => setEditBio(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold block flex items-center justify-between">
                              <span>رمز عبور کاربر (Password - امنیت مالک)</span>
                              <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded font-bold">جهت بازرسی و تغییر رمز</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showEditPassword ? "text" : "password"}
                                value={editPassword}
                                placeholder="رمز عبور کاربر..."
                                onChange={e => setEditPassword(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500 transition"
                              />
                              <button
                                type="button"
                                onClick={() => setShowEditPassword(!showEditPassword)}
                                className="absolute left-2.5 top-2.5 text-slate-400 hover:text-white transition"
                                title={showEditPassword ? "مخفی‌سازی رمز" : "نمایش رمز"}
                              >
                                {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold block">سطح دسترسی و نقش (System Role)</label>
                            <select
                              value={editRole}
                              onChange={e => setEditRole(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                            >
                              <option value="user">کاربر عادی (User)</option>
                              <option value="admin">مدیر کمکی سیستم (Admin)</option>
                              <option value="owner">مالک اصلی ارشد (Owner)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                              عنوان اختصاصی سفارشی (Custom Badge/Title)
                              <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded">نمایش در چت</span>
                            </label>
                            <input
                              type="text"
                              value={editCustomTitle}
                              placeholder="مانند: VIP، پشتیبان، عضو ارشد، برنامه‌نویس"
                              onChange={e => setEditCustomTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                            />
                          </div>

                          <div className="space-y-1.5 md:col-span-2 bg-purple-950/20 border border-purple-500/30 p-3.5 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                                <Crown className="w-4 h-4 text-amber-400" />
                                مدیریت اشتراک ویژه Plus برای کاربر
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-900/50 text-purple-200 border border-purple-500/30">
                                وضعیت فعلی: {editingUser.subscriptionTier === 'plus' ? 'Plus ⭐' : 'Free (رایگان)'}
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-400">به عنوان مالکان اصلی، می‌توانید به‌صورت دستی اشتراک Plus رایگان اعطا یا لغو کنید:</p>

                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch("/api/admin/grant-subscription", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ requesterId: currentUser.id, targetUserId: editingUser.id, tier: "plus", durationDays: 30 })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setEditingUser({ ...editingUser, subscriptionTier: "plus" });
                                      alert("اشتراک ۱ ماهه اعطا شد.");
                                    }
                                  } catch (e) { console.error(e); }
                                }}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded-xl transition"
                              >
                                اعطای ۱ ماه Plus
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch("/api/admin/grant-subscription", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ requesterId: currentUser.id, targetUserId: editingUser.id, tier: "plus", durationDays: 90 })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setEditingUser({ ...editingUser, subscriptionTier: "plus" });
                                      alert("اشتراک ۳ ماهه اعطا شد.");
                                    }
                                  } catch (e) { console.error(e); }
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-xl transition"
                              >
                                اعطای ۳ ماه Plus
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch("/api/admin/grant-subscription", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ requesterId: currentUser.id, targetUserId: editingUser.id, tier: "plus", durationDays: 365 })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setEditingUser({ ...editingUser, subscriptionTier: "plus" });
                                      alert("اشتراک ۱ ساله اعطا شد.");
                                    }
                                  } catch (e) { console.error(e); }
                                }}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] rounded-xl transition"
                              >
                                اعطای ۱ سال Plus
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch("/api/admin/grant-subscription", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ requesterId: currentUser.id, targetUserId: editingUser.id, tier: "plus", durationDays: -1 })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setEditingUser({ ...editingUser, subscriptionTier: "plus" });
                                      alert("اشتراک دائمی اعطا شد.");
                                    }
                                  } catch (e) { console.error(e); }
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-xl transition"
                              >
                                👑 اعطای اشتراک مادام‌العمر
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch("/api/admin/grant-subscription", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ requesterId: currentUser.id, targetUserId: editingUser.id, tier: "free" })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setEditingUser({ ...editingUser, subscriptionTier: "free" });
                                      alert("اشتراک لغو و به Free تبدیل شد.");
                                    }
                                  } catch (e) { console.error(e); }
                                }}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-xl transition"
                              >
                                لغو اشتراک (Free)
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold block">رنگ پس‌زمینه آواتار</label>
                            <div className="flex flex-wrap gap-1.5">
                              {avatarColors.map(col => (
                                <button
                                  key={col}
                                  type="button"
                                  onClick={() => setEditAvatarColor(col)}
                                  className={`w-6 h-6 rounded-lg ${col} border transition-all ${
                                    editAvatarColor === col ? "border-white scale-110 shadow-lg" : "border-transparent opacity-70 hover:opacity-100"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold block">ایموجی آواتار</label>
                            <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto bg-slate-950 p-2 rounded-xl border border-slate-800">
                              {emojis.map(emo => (
                                <button
                                  key={emo}
                                  type="button"
                                  onClick={() => setEditAvatarEmoji(emo)}
                                  className={`w-6 h-6 text-sm flex items-center justify-center rounded-lg transition-all ${
                                    editAvatarEmoji === emo ? "bg-amber-500/20 scale-110" : "hover:bg-slate-800"
                                  }`}
                                >
                                  {emo}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="pt-3 flex justify-end gap-2.5">
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                          >
                            انصراف
                          </button>
                          <button
                            onClick={handleSaveUserDetails}
                            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black transition shadow-lg"
                          >
                            ذخیره نهایی تغییرات کاربر
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      /* LIST OF USERS VIEW */
                      <>
                        {/* Search and Quick Filters bar */}
                        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                          <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                            <input
                              type="text"
                              placeholder="جستجوی نام کاربری، لقب یا بیو..."
                              value={usersSearchQuery}
                              onChange={e => setUsersSearchQuery(e.target.value)}
                              className="w-full pr-9 pl-4 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition"
                            />
                          </div>

                          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                            <button
                              onClick={() => setUsersStatusFilter("all")}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition shrink-0 ${
                                usersStatusFilter === "all" ? "bg-amber-600/10 border-amber-500/30 text-amber-400" : "bg-transparent border-slate-850 text-slate-400"
                              }`}
                            >
                              همه کاربران ({totalCount})
                            </button>
                            <button
                              onClick={() => setUsersStatusFilter("active")}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition shrink-0 ${
                                usersStatusFilter === "active" ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400" : "bg-transparent border-slate-850 text-slate-400"
                              }`}
                            >
                              فعال و آزاد ({activeCount})
                            </button>
                            <button
                              onClick={() => setUsersStatusFilter("filtered")}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition shrink-0 ${
                                usersStatusFilter === "filtered" ? "bg-red-600/10 border-red-500/30 text-red-400" : "bg-transparent border-slate-850 text-slate-400"
                              }`}
                            >
                              مسدود شده ({filteredCount})
                            </button>
                            <button
                              onClick={fetchUsers}
                              className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg text-slate-400 hover:text-white transition"
                              title="بروزرسانی"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* List grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredUsers.map(u => {
                            const isOwner = u.role === "owner" || u.username.toLowerCase() === "parham";
                            const isAdmin = u.role === "admin";
                            return (
                              <div
                                key={u.id}
                                className={`p-4 rounded-2xl border transition flex flex-col justify-between h-42 ${
                                  u.isFiltered ? "bg-red-950/10 border-red-900/35 hover:border-red-500/30" : "bg-slate-900/40 border-slate-800/80 hover:border-slate-800"
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold shadow ${u.avatarColor || "bg-slate-800"}`}>
                                        {u.avatarEmoji || "👤"}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-black text-white truncate max-w-[120px]">{u.nickname}</span>
                                          {isOwner && (
                                            <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] rounded font-black">
                                              مالک ارشد
                                            </span>
                                          )}
                                          {isAdmin && (
                                            <span className="px-1.5 py-0.2 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] rounded font-black">
                                              مدیر ارشد
                                            </span>
                                          )}
                                          {u.customTitle && (
                                            <span className="px-1.5 py-0.2 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] rounded font-black">
                                              {u.customTitle}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[9px] text-slate-500 font-mono block">@{u.username}</span>
                                      </div>
                                    </div>

                                    <div>
                                      {u.isOnline && !u.isFiltered ? (
                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black rounded-full">
                                          ● آنلاین
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-slate-800 text-slate-500 text-[8px] rounded-full">آفلاین</span>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-[10px] text-slate-400 mt-2 line-clamp-1 leading-relaxed">
                                    {u.bio || "بیوگرافی برای این حساب کاربری نوشته نشده است."}
                                  </p>

                                  <div className="mt-2 flex items-center justify-between bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800/80">
                                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono">
                                      <Key className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span className="text-slate-400 text-[9px]">رمز عبور:</span>
                                      <span className="font-bold tracking-wide text-amber-300">
                                        {u.password || (u.username === "parham" ? "13881388" : "123456")}
                                      </span>
                                    </div>
                                    <span className="text-[8.5px] font-mono text-slate-500">ID: {u.id}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-850 pt-2 mt-2">
                                  <div className="flex items-center gap-1.5 w-full justify-end">
                                    <button
                                      onClick={() => {
                                        setActiveTab("chats");
                                        handleOpenUserMessagesInspector(u);
                                      }}
                                      className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] font-bold rounded-lg transition flex items-center gap-1"
                                      title="بازرسی و نظارت بر کلیه پیام‌های ارسالی این کاربر"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>پیام‌ها</span>
                                    </button>

                                    <button
                                      onClick={() => handleStartEditing(u)}
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 hover:text-amber-400 text-slate-300 rounded-lg transition"
                                      title="ویرایش دسترسی‌ها و اطلاعات حساب"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    {!isOwner && (
                                      <>
                                        {u.isFiltered ? (
                                          <button
                                            onClick={() => handleToggleFilter(u)}
                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1"
                                          >
                                            <UserCheck className="w-3.5 h-3.5" />
                                            <span>رفع مسدودیت</span>
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleToggleFilter(u)}
                                            className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1"
                                          >
                                            <Ban className="w-3.5 h-3.5" />
                                            <span>مسدود کردن</span>
                                          </button>
                                        )}

                                        <button
                                          onClick={() => handleDeleteUserAccount(u)}
                                          className="p-1.5 bg-rose-950/40 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white rounded-lg transition flex items-center gap-1 text-[10px] font-bold"
                                          title="حذف کامل و دائم حساب کاربری"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>حذف حساب</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* TAB: SUBSCRIPTION REQUESTS APPROVAL */}
                {activeTab === "sub_requests" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span>درخواست‌های ارتقا به Plus در انتظار تایید</span>
                        </h4>
                        <p className="text-[10px] text-slate-500">مشاهده درخواست‌های خرید اشتراک کاربران و امکان تایید یا رد سریع با یک کلیک</p>
                      </div>
                      <button
                        onClick={fetchSubRequests}
                        className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {subRequests.length === 0 ? (
                      <div className="p-10 text-center bg-slate-950/40 border border-slate-800/60 rounded-2xl">
                        <Crown className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-bold">هیچ درخواستی ثبت نشده است.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {subRequests.map(req => {
                          const isPending = req.status === "pending";
                          const isApproved = req.status === "approved";
                          return (
                            <div
                              key={req.id}
                              className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                                isPending
                                  ? "bg-amber-950/20 border-amber-500/40"
                                  : isApproved
                                  ? "bg-emerald-950/20 border-emerald-500/30"
                                  : "bg-slate-900/40 border-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow ${req.avatarColor || "bg-indigo-600"}`}>
                                  {req.avatarEmoji || "👤"}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-white">{req.userNickname}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">@{req.username}</span>
                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-black rounded-full">
                                      پلان: {req.plan === "yearly" ? "سالانه (تخفیف ویژه)" : req.plan === "quarterly" ? "۳ ماهه" : "۱ ماهه"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    <span>تاریخ درخواست: {new Date(req.timestamp).toLocaleDateString("fa-IR")} - {new Date(req.timestamp).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isPending ? (
                                  <>
                                    <button
                                      onClick={() => handleApproveSubRequest(req.id)}
                                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs rounded-xl transition shadow flex items-center gap-1"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>تایید و ارتقا به Plus</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectSubRequest(req.id)}
                                      className="px-3 py-1.5 bg-slate-800 hover:bg-red-950/60 hover:border-red-500/40 border border-slate-700 text-slate-300 hover:text-red-300 font-bold text-xs rounded-xl transition"
                                    >
                                      رد درخواست
                                    </button>
                                  </>
                                ) : isApproved ? (
                                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] rounded-xl flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>تایید شده و فعال</span>
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[10px] rounded-xl">
                                    رد شده
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: CHAT ROOMS MANAGEMENT */}
                {activeTab === "chats" && (
                  <div className="space-y-4">
                    {inspectingChat || inspectingUser || inspectingDirectUsers ? (
                      /* CHAT & USER MESSAGE CONTENT INSPECTION PANEL */
                      <div className="space-y-4">
                        {/* Inspector Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-900/80 border border-amber-500/30 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setInspectingChat(null);
                                setInspectingUser(null);
                                setInspectingDirectUsers(null);
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                            >
                              <ArrowRight className="w-4 h-4" />
                              <span>بازگشت به لیست</span>
                            </button>
                            <div>
                              <h4 className="text-xs font-black text-white flex items-center gap-2">
                                <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
                                <span>
                                  {inspectingChat
                                    ? `بازرسی و نظارت بر چت: ${inspectingChat.name}`
                                    : inspectingDirectUsers
                                    ? `بازرسی زنده چت خصوصی: ${inspectingDirectUsers.userAName} ↔ ${inspectingDirectUsers.userBName}`
                                    : `بازرسی و نظارت بر تمامی پیام‌های کاربر: ${inspectingUser?.nickname} (@${inspectingUser?.username})`}
                                </span>
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono rounded-full animate-pulse">
                                  ● نظارت زنده
                                </span>
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                نظارت زنده و مخفیانه بر محتوای گفتگوها و فایل‌ها
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fetchMessagesForInspection(inspectingChat?.id, inspectingUser?.id, inspectingDirectUsers?.userA, inspectingDirectUsers?.userB)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-700"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${loadingInspection ? "animate-spin text-amber-400" : ""}`} />
                              <span>بروزرسانی پیام‌ها</span>
                            </button>
                          </div>
                        </div>

                        {/* Search and Filters Bar */}
                        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                          <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                            <input
                              type="text"
                              placeholder="جستجوی کلمه، لغت، شناسه کاربر یا نام فایل..."
                              value={inspectionQuery}
                              onChange={e => setInspectionQuery(e.target.value)}
                              className="w-full pr-9 pl-4 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition"
                            />
                          </div>

                          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                            <button
                              onClick={() => setInspectionFilter("all")}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                                inspectionFilter === "all" ? "bg-amber-600/10 border-amber-500/30 text-amber-400" : "bg-transparent border-slate-850 text-slate-400"
                              }`}
                            >
                              همه پیام‌ها ({inspectedMessages.length})
                            </button>
                            <button
                              onClick={() => setInspectionFilter("text")}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                                inspectionFilter === "text" ? "bg-amber-600/10 border-amber-500/30 text-amber-400" : "bg-transparent border-slate-850 text-slate-400"
                              }`}
                            >
                              متنی ({inspectedMessages.filter(m => !m.mediaUrl).length})
                            </button>
                            <button
                              onClick={() => setInspectionFilter("media")}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                                inspectionFilter === "media" ? "bg-amber-600/10 border-amber-500/30 text-amber-400" : "bg-transparent border-slate-850 text-slate-400"
                              }`}
                            >
                              دارای عکس/رسانه/فایل ({inspectedMessages.filter(m => !!m.mediaUrl).length})
                            </button>
                          </div>
                        </div>

                        {/* Messages List Container */}
                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                          {loadingInspection ? (
                            <div className="p-10 text-center bg-slate-950/40 border border-slate-800/60 rounded-2xl">
                              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                              <p className="text-xs text-slate-400 font-bold">در حال بارگذاری و بازرسی پیام‌های سرور...</p>
                            </div>
                          ) : filteredInspectedMessages.length === 0 ? (
                            <div className="p-10 text-center bg-slate-950/40 border border-slate-800/60 rounded-2xl">
                              <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                              <p className="text-xs text-slate-400 font-bold">هیچ پیامی یافت نشد.</p>
                            </div>
                          ) : (
                            filteredInspectedMessages.map(msg => (
                              <div
                                key={msg.id}
                                className="p-4 bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl space-y-2.5 transition"
                              >
                                {/* Message Info Header */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow ${msg.senderAvatarColor || "bg-slate-800"}`}>
                                      {msg.senderAvatarEmoji || "👤"}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-black text-white">{msg.senderNickname}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">@{msg.senderUsername}</span>
                                        {msg.chatName && (
                                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] font-bold rounded-md border border-slate-700">
                                            {msg.chatName}
                                          </span>
                                        )}
                                        {msg.isSenderFiltered && (
                                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-black rounded border border-red-500/30">
                                            کاربر مسدود شده
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">
                                        {new Date(msg.timestamp).toLocaleDateString("fa-IR")} - {new Date(msg.timestamp).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Controls */}
                                  <div className="flex items-center gap-2">
                                    {!msg.isSenderFiltered && msg.senderRole !== "owner" && (
                                      <button
                                        onClick={() => handleToggleFilter({ id: msg.senderId, nickname: msg.senderNickname, username: msg.senderUsername, isFiltered: false })}
                                        className="px-2.5 py-1 bg-red-950/40 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-[9.5px] font-bold rounded-lg transition flex items-center gap-1"
                                        title="مسدودسازی سریع کاربر فرستنده به دلیل تخلف"
                                      >
                                        <Ban className="w-3 h-3" />
                                        <span>مسدودسازی کاربر</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteSingleMessage(msg.id)}
                                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10.5px] font-black rounded-lg transition flex items-center gap-1 shadow-md"
                                      title="حذف پیام به دلیل محتوای مستهجن یا خلاف قانون"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>حذف پیام</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Message Body Content */}
                                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-850 text-xs text-slate-200 leading-relaxed font-sans select-text">
                                  {msg.replyToText && (
                                    <div className="mb-2 p-2 bg-slate-950/80 border-r-2 border-amber-500 rounded text-[10px] text-slate-400 italic">
                                      پاسخ به: {msg.replyToText}
                                    </div>
                                  )}

                                  {(msg.text || msg.content) ? (
                                    <p className="whitespace-pre-wrap">{msg.text || msg.content}</p>
                                  ) : (
                                    <p className="text-slate-500 italic text-[10.5px]">(پیام فاقد متن است / فقط فایل یا رسانه)</p>
                                  )}

                                  {/* Reactions list */}
                                  {msg.reactions && msg.reactions.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2 flex-wrap pt-2 border-t border-slate-800/60">
                                      {msg.reactions.map((r: any, idx: number) => (
                                        <span key={idx} className="px-1.5 py-0.5 bg-slate-800 text-[10px] rounded-md border border-slate-700">
                                          {r.emoji}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Media Preview if attached */}
                                  {msg.mediaUrl && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-800">
                                      {msg.mediaType === "image" || msg.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                                        <div className="relative group max-w-xs">
                                          <picture className="w-full block">
                                            <source srcSet={msg.mediaUrl} type="image/webp" />
                                            <img
                                              src={msg.mediaUrl}
                                              alt={`تصویر پیوست در مدیریت پیام‌های پریوو — ${msg.content?.substring(0, 30) || 'فایل ارسالی'}`}
                                              loading="lazy"
                                              decoding="async"
                                              className="rounded-lg max-h-48 object-cover border border-slate-700 shadow"
                                              referrerPolicy="no-referrer"
                                            />
                                          </picture>
                                        </div>
                                      ) : msg.mediaType === "audio" || msg.mediaUrl.match(/\.(mp3|ogg|wav|webm)/i) ? (
                                        <audio controls src={msg.mediaUrl} className="w-full h-8 mt-1" />
                                      ) : (
                                        <a
                                          href={msg.mediaUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-sky-400 text-xs rounded-lg border border-slate-700 font-mono"
                                        >
                                          <FileText className="w-4 h-4" />
                                          <span>{msg.fileName || "دانلود فایل پیوست"}</span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      /* LIST OF ALL CHATS WITH INSPECTION BUTTON */
                      <>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                          <div>
                            <h4 className="text-xs font-black text-white">مدیریت و نظارت بر چت‌ها، گروه‌ها و کانال‌ها</h4>
                            <p className="text-[10px] text-slate-500">مشاهده مشخصات کلی، بازدید محتوا و حذف پیام‌ها یا کانال‌های خلاف قوانین</p>
                          </div>
                          <button
                            onClick={fetchChats}
                            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {chats.map(chat => {
                            const isGlobal = chat.id === "global-group";
                            return (
                              <div
                                key={chat.id}
                                className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow shrink-0 ${chat.avatarColor || "bg-slate-800"}`}>
                                    {chat.avatarEmoji || "👥"}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-black text-white">{chat.name}</span>
                                      <span className={`px-1.5 py-0.5 text-[8px] font-black rounded ${chat.type === "channel" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                                        {chat.type === "channel" ? "کانال" : "گروه"}
                                      </span>
                                      {isGlobal && (
                                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] rounded font-black">پیش‌فرض سیستم</span>
                                      )}
                                    </div>
                                    <span className="text-[9.5px] text-slate-400 block mt-0.5 leading-relaxed">
                                      سازنده: <span className="font-bold text-slate-300">{chat.creatorNickname}</span> • تعداد اعضا: <span className="text-amber-400 font-mono font-bold">{chat.membersCount} کاربر</span>
                                    </span>
                                    <span className="text-[9px] text-slate-500 block mt-0.5 truncate max-w-[450px]">
                                      {chat.description || "بدون توضیح ثبت شده..."}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-auto">
                                  <button
                                    onClick={() => handleOpenChatInspector(chat)}
                                    className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl transition flex items-center gap-1.5 text-[10px] font-bold"
                                    title="بازدید و نظارت محتوا و پیام‌های این چت"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                                    <span>بازدید و نظارت پیام‌ها</span>
                                  </button>

                                  {!isGlobal && (
                                    <button
                                      onClick={() => handleDeleteChat(chat.id, chat.name)}
                                      className="p-2 bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white rounded-xl transition flex items-center gap-1 text-[10px] font-bold"
                                      title="حذف کامل این کانال/گروه"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>حذف کانال</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* DIRECT MESSAGE INSPECTION BETWEEN ANY 2 USERS */}
                        <div className="mt-6 p-4 bg-slate-950/80 border border-amber-500/20 rounded-2xl space-y-3">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <h5 className="text-xs font-black text-amber-300">نظارت زنده و مخفی بر گفتگوی خصوصی دو کاربر (Direct Chat Inspector)</h5>
                              <p className="text-[10px] text-slate-400">انتخاب دو کاربر جهت مشاهده زنده کلیه پیام‌ها، عکس‌ها و رسانه‌های مبادله شده بین آن‌ها بدون متوجه شدن طرفین</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                            <div>
                              <label className="text-[9.5px] text-slate-400 block mb-1">کاربر اول:</label>
                              <select
                                value={directUserA}
                                onChange={e => setDirectUserA(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                              >
                                <option value="">-- انتخاب کاربر اول --</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>{u.nickname} (@{u.username})</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[9.5px] text-slate-400 block mb-1">کاربر دوم:</label>
                              <select
                                value={directUserB}
                                onChange={e => setDirectUserB(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition"
                              >
                                <option value="">-- انتخاب کاربر دوم --</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>{u.nickname} (@{u.username})</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-end">
                              <button
                                onClick={handleOpenDirectChatInspector}
                                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                              >
                                <Eye className="w-4 h-4" />
                                <span>شروع نظارت زنده و مخفی</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* TAB 4: SYSTEM BROADCAST */}
                {activeTab === "broadcast" && (
                  <div className="space-y-5 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl">
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-amber-500" />
                        مرکز انتشار اطلاعیه‌های سراسری و پیام همگانی
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1">
                        متن نوشته شده در زیر مستقیماً به چت عمومی پیش‌فرض سیستم ارسال می‌شود و همچنین به صورت اعلان زنده و متحرک برای تمامی کاربران آنلاین پلتفرم ظاهر می‌گردد.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-bold block">متن اطلاعیه مهم مدیریت ارشد</label>
                      <textarea
                        value={broadcastText}
                        onChange={e => setBroadcastText(e.target.value)}
                        placeholder="اطلاعیه مهم: به منظور ارتقا و بهبود وضعیت شبکه ارتباطی، امشب راس ساعت ۲۳ سیستم تحت تعمیر موقت به مدت ۳۰ دقیقه قرار خواهد گرفت..."
                        className="w-full h-32 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed custom-scrollbar"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-850">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="pin_ann"
                          checked={pinBroadcast}
                          onChange={e => setPinBroadcast(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-800 text-amber-500 focus:ring-amber-500"
                        />
                        <label htmlFor="pin_ann" className="text-[10px] text-slate-300 font-bold cursor-pointer select-none">
                          پین کردن (سنجاق کردن) پیام اطلاعیه در گفتگوهای عمومی پلتفرم
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSendBroadcast}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg"
                      >
                        <Megaphone className="w-4 h-4" />
                        <span>انتشار و ارسال زنده همگانی اطلاعیه</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 5: ABUSE REPORTS */}
                {activeTab === "reports" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <div>
                        <h4 className="text-xs font-black text-white">بررسی گزارشات تخلف ارسالی کاربران</h4>
                        <p className="text-[10px] text-slate-500">نظارت عادلانه بر گفتگوها و تصمیم‌گیری در خصوص پیام‌های گزارش‌شده متخلفین</p>
                      </div>
                      <button
                        onClick={fetchReports}
                        className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {reports.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-850 rounded-2xl">
                        <p className="text-[10px] text-slate-500 font-bold">هیچ گزارش معلقی در سیستم ثبت نشده است. همه چیز امن و آرام است! ✨</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reports.map(rep => (
                          <div key={rep.id} className="p-4 bg-slate-900/60 border border-slate-800/85 rounded-2xl space-y-3">
                            <div className="flex items-start justify-between flex-wrap gap-2 text-[10px]">
                              <div>
                                <span className="text-slate-500">شاکی:</span>{" "}
                                <span className="font-bold text-white">
                                  {rep.reporterNickname} (@{rep.reporterUsername})
                                </span>
                                <span className="text-slate-500 mx-2">←</span>
                                <span className="text-slate-500">متشاکی:</span>{" "}
                                <span className="font-bold text-red-400">
                                  {rep.reportedNickname} (@{rep.reportedUsername})
                                </span>
                              </div>
                              <span className="text-slate-500 font-mono text-[9px]">{new Date(rep.timestamp).toLocaleString("fa-IR")}</span>
                            </div>

                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1">
                              <span className="text-[8px] font-black text-slate-500 tracking-wide block uppercase">محتوای پیام گزارش‌شده:</span>
                              <p className="text-xs text-slate-200 leading-relaxed font-mono">{rep.messageContent}</p>
                            </div>

                            <div className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-lg">
                                <AlertTriangle className="w-3 h-3" />
                                <span>علت گزارش: {rep.reason || "تخلف کلی اخلاقی و رفتاری"}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleReportAction(rep.id, "dismiss")}
                                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold transition"
                                >
                                  رد گزارش
                                </button>
                                <button
                                  onClick={() => handleReportAction(rep.id, "delete_message")}
                                  className="px-3 py-1 bg-red-600/20 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>حذف پیام تخلف</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: GLOBAL CONFIGURATION */}
                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <div className="pb-2 border-b border-slate-800">
                      <h4 className="text-xs font-black text-white">تنظیمات و ترجیحات اصلی پلتفرم</h4>
                      <p className="text-[10px] text-slate-500">پیکربندی قوانین هسته ارتباطات، ویژگی‌های مجاز سیستم و کنترل امنیتی ثبت‌نام</p>
                    </div>

                    <div className="space-y-4">
                      {/* Configuration items toggles */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Maintenance mode toggle */}
                        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-white block flex items-center gap-1.5">
                              حالت نگهداری سیستم (Maintenance Mode)
                              {systemSettings.maintenanceMode && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />}
                            </span>
                            <span className="text-[9px] text-slate-500 block">با فعال‌سازی این مورد، فقط مالک ارشد سیستم دسترسی ورود دارد.</span>
                          </div>
                          <button
                            onClick={() => handleUpdateSystemSettings({ maintenanceMode: !systemSettings.maintenanceMode })}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                              systemSettings.maintenanceMode ? "bg-red-600" : "bg-slate-800"
                            }`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${systemSettings.maintenanceMode ? "-translate-x-6" : ""}`} />
                          </button>
                        </div>

                        {/* Registration Toggle */}
                        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-white block">پذیرش ثبت‌نام کاربر جدید</span>
                            <span className="text-[9px] text-slate-500 block">غیرفعال‌سازی ثبت‌نام به منظور کنترل تراکم دیتابیس یا امنیت موقت.</span>
                          </div>
                          <button
                            onClick={() => handleUpdateSystemSettings({ disableRegistration: !systemSettings.disableRegistration })}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                              systemSettings.disableRegistration ? "bg-amber-600" : "bg-slate-800"
                            }`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${systemSettings.disableRegistration ? "-translate-x-6" : ""}`} />
                          </button>
                        </div>

                        {/* AI Bot Active toggle */}
                        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-white block">فعال بودن ربات هوشمند (پرهام AI)</span>
                            <span className="text-[9px] text-slate-500 block">غیرفعال‌سازی موقت پاسخ‌های هوش مصنوعی ربات در صورت مصرف بیش از حد کلید.</span>
                          </div>
                          <button
                            onClick={() => handleUpdateSystemSettings({ disableAIBot: !systemSettings.disableAIBot })}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                              systemSettings.disableAIBot ? "bg-amber-600" : "bg-slate-800"
                            }`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${systemSettings.disableAIBot ? "-translate-x-6" : ""}`} />
                          </button>
                        </div>

                        {/* AI Web Search Grounding toggle */}
                        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-white block">جستجوی زنده وب هوش مصنوعی (Search Grounding)</span>
                            <span className="text-[9px] text-slate-500 block">وقتی فعال باشد، پرهام AI اطلاعات زنده اینترنت را جستجو و همراه با منبع ارائه می‌کند.</span>
                          </div>
                          <button
                            onClick={() => handleUpdateSystemSettings({ aiSearchGrounding: !systemSettings.aiSearchGrounding })}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                              systemSettings.aiSearchGrounding ? "bg-emerald-600" : "bg-slate-800"
                            }`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${systemSettings.aiSearchGrounding ? "-translate-x-6" : ""}`} />
                          </button>
                        </div>

                        {/* Max File size configuration */}
                        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-white block">حداکثر حجم مجاز فایل (مگابایت)</span>
                            <span className="text-[9px] text-slate-500 block">محدود کردن سقف حجم آپلود فایل در چت‌ها به منظور مدیریت منابع دیسک سرور.</span>
                          </div>
                          <input
                            type="number"
                            value={systemSettings.maxFileSizeMB || 50}
                            onChange={e => handleUpdateSystemSettings({ maxFileSizeMB: parseInt(e.target.value) || 50 })}
                            className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Welcome Message Config text */}
                      <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-white block">پیام خوش‌آمدگویی پیش‌فرض پلتفرم</span>
                          <span className="text-[9px] text-slate-500 block">این متن پس از ثبت‌نام موفق کاربر جدید به صورت پیام خوش‌آمدگویی یا اطلاعیه اول درSaved Messages نشان داده می‌شود.</span>
                        </div>
                        <input
                          type="text"
                          value={systemSettings.welcomeMessage || ""}
                          onChange={e => setSystemSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                          onBlur={() => handleUpdateSystemSettings({ welcomeMessage: systemSettings.welcomeMessage })}
                          placeholder="به فضای ایمن ما خوش آمدید..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Maintenance Message Config text */}
                      <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-white block">پیام سفارشی حالت نگهداری (تعمیرات)</span>
                          <span className="text-[9px] text-slate-500 block">متنی که هنگام ورود کاربران در زمان روشن بودن «حالت نگهداری» نمایش داده می‌شود.</span>
                        </div>
                        <textarea
                          rows={2}
                          value={systemSettings.maintenanceMessage || ""}
                          onChange={e => setSystemSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                          onBlur={() => handleUpdateSystemSettings({ maintenanceMessage: systemSettings.maintenanceMessage })}
                          placeholder="پیام‌رسان موقتاً در حال بروزرسانی می‌باشد..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Banned/Reserved Usernames Config */}
                      <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-white block">نام‌های کاربری ممنوعه و رزرو شده (لیست سیاه)</span>
                          <span className="text-[9px] text-slate-500 block">نام‌های کاربری که کاربران جدید مجاز به انتخاب و ثبت‌نام با آن‌ها نیستند (با کاما جدا کنید).</span>
                        </div>
                        <input
                          type="text"
                          value={systemSettings.bannedUsernames || ""}
                          onChange={e => setSystemSettings(prev => ({ ...prev, bannedUsernames: e.target.value }))}
                          onBlur={() => handleUpdateSystemSettings({ bannedUsernames: systemSettings.bannedUsernames })}
                          placeholder="admin, owner, parham_ai, support"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      {/* AI Engine Detailed Section */}
                      <div className="p-6 bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/20 rounded-2xl space-y-5">
                        <div className="pb-2 border-b border-indigo-950">
                          <span className="text-xs font-black text-indigo-400 block">تنظیمات پیشرفته موتور هوش مصنوعی (پرهام AI)</span>
                          <span className="text-[9px] text-slate-400 block">پیکربندی هوش عمیق، مدل‌های پردازشی و پارامترهای خلاقیت دستیار هوشمند</span>
                        </div>

                        {/* Model selection */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-black text-white block">انتخاب مدل زبانی فعال</span>
                          <span className="text-[9px] text-slate-500 block">مدلی که برای پردازش چت‌ها و تحلیل فایل‌های آپلود شده استفاده می‌شود.</span>
                          <select
                            value={systemSettings.aiModel || "gemini-3.6-flash"}
                            onChange={e => handleUpdateSystemSettings({ aiModel: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option value="gemini-3.6-flash">Gemini 3.6 Flash (فوق‌العاده سریع، چندرسانه‌ای بهینه - پیشنهادی)</option>
                            <option value="gemini-flash-latest">Gemini Flash Latest (آخرین نسخه سریع جمنی)</option>
                            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (کم‌مصرف و پرسرعت)</option>
                            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (فوق پیشرفته، تفکر عمیق و منطق استدلالی بالا)</option>
                          </select>
                        </div>

                        {/* Temperature Slider */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white block">درجه خلاقیت و پویایی (Temperature)</span>
                            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded">{systemSettings.aiTemperature !== undefined ? systemSettings.aiTemperature : 0.7}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 block">مقادیر پایین‌تر خلاقیت کمتر اما دقت منطقی بیشتری دارند؛ مقادیر بالاتر صمیمی‌تر و غیرقابل پیش‌بینی‌ترند.</span>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="0.0"
                              max="1.0"
                              step="0.1"
                              value={systemSettings.aiTemperature !== undefined ? systemSettings.aiTemperature : 0.7}
                              onChange={e => handleUpdateSystemSettings({ aiTemperature: parseFloat(e.target.value) })}
                              className="flex-1 accent-indigo-500"
                            />
                            <div className="flex justify-between w-full max-w-[80px] text-[9px] text-slate-500">
                              <span>منطقی</span>
                              <span>خلاق</span>
                            </div>
                          </div>
                        </div>

                        {/* System instruction detailed textarea */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-black text-white block">دستورالعمل سیستمی و شخصیت هوش مصنوعی</span>
                          <span className="text-[9px] text-slate-500 block">هویت، لحن، محدودیت‌ها و شیوه پاسخ‌دهی دستیار هوش مصنوعی را در اینجا به صورت کامل شرح دهید.</span>
                          <textarea
                            rows={4}
                            value={systemSettings.aiSystemInstructions || ""}
                            onChange={e => setSystemSettings(prev => ({ ...prev, aiSystemInstructions: e.target.value }))}
                            onBlur={() => handleUpdateSystemSettings({ aiSystemInstructions: systemSettings.aiSystemInstructions })}
                            placeholder="تو یک دستیار هوش مصنوعی صمیمی با نام پرهام AI هستی..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Backup & System Data Section */}
                        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3 mt-4">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-black text-white">پشتیبان‌گیری دائم و بازیابی پایگاه داده</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            تمام پیام‌ها، پروفایل‌ها، گروه‌ها و تنظیمات به صورت همزمان روی ۴ لایه دیسک محلی و فایرپیس ایمن‌سازی شده‌اند. شما می‌توانید هر زمان یک نسخه پشتیبان آفلاین با کیفیت کاملاً یکپارچه دانلود کرده یا نسخه پشتیبان قبلی را با یک کلیک بازیابی فرمایید.
                          </p>

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={handleExportBackup}
                              disabled={isExporting}
                              className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {isExporting ? "در حال دریافت..." : "دانلود فایل بک‌آپ کامل (JSON)"}
                            </button>

                            <label className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition">
                              <Upload className="w-3.5 h-3.5" />
                              {isImporting ? "در حال بارگذاری..." : "بازیابی و بارگذاری فایل بک‌آپ"}
                              <input
                                type="file"
                                accept=".json"
                                onChange={handleImportBackup}
                                className="hidden"
                                disabled={isImporting}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
