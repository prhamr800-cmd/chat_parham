import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Settings, Send, Paperclip, Mic, Square, Play, Pause, Smile, 
  MoreVertical, ShieldCheck, Check, CheckCheck, Users, Radio, Download, 
  FileText, Volume2, HelpCircle, AlertCircle, Sparkles, SmilePlus, Ban, Lock, Filter, RefreshCw,
  ArrowRight, BarChart2, X, Pin, Languages, Globe, CornerUpLeft, Image as ImageIcon, ShieldAlert, Crown,
  Phone, PhoneOff, Camera, CameraOff, MicOff, Video,
  Copy, Plus, Trash2, Menu, Maximize2, Minimize2, GripVertical, Code
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AuthScreen from "./components/AuthScreen";
import SettingsModal from "./components/SettingsModal";
import NewChatModal from "./components/NewChatModal";
import UserProfileModal from "./components/UserProfileModal";
import GroupProfileModal from "./components/GroupProfileModal";
import AdminDashboardModal from "./components/AdminDashboardModal";
import SubscriptionModal from "./components/SubscriptionModal";
import EmojiPicker from "./components/EmojiPicker";
import MusicPlayer from "./components/MusicPlayer";
import GeminiLiveModal from "./components/GeminiLiveModal";
import { encryptMessage, decryptMessage } from "./utils/crypto";
import { themes } from "./utils/theme";
import { User, Message, Chat, OutgoingQueueItem } from "./types";

interface CodeBoxProps {
  code: string;
  language: string;
}

const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 8 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      return;
    }
    let index = 0;
    const interval = setInterval(() => {
      index += 3;
      if (index >= text.length) {
        setDisplayedText(text);
        clearInterval(interval);
      } else {
        setDisplayedText(text.slice(0, index));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <>{displayedText}</>;
};

const CodeBox: React.FC<CodeBoxProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Failed to copy code", e);
    }
  };

  const getHighlightedCode = () => {
    let escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Basic regex-based highlighting
    escaped = escaped.replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span class="text-slate-500 font-mono italic">$1</span>');
    escaped = escaped.replace(/(["'`])(.*?)\1/g, '<span class="text-emerald-400 font-mono">$1$2$1</span>');
    const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|export|from|class|extends|new|this|typeof|instanceof|try|catch|finally|throw|async|await|default|null|undefined|true|false|def|class|import|from|as|elif|print|pub|fn|impl|struct|enum|let|mut|use|String|u32|i32|f64|bool|void|int|char|double|float)\b/g;
    escaped = escaped.replace(keywords, '<span class="text-pink-500 font-bold">$1</span>');
    escaped = escaped.replace(/\b([a-zA-Z_]\w*)(?=\s*\()/g, '<span class="text-sky-400">$1</span>');
    escaped = escaped.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

    return <code className={`font-mono text-[11px] sm:text-xs leading-relaxed inline-block min-w-full ${isWrapped ? 'break-all' : ''}`} dangerouslySetInnerHTML={{ __html: escaped }} />;
  };

  return (
    <div className="w-full max-w-full my-2.5 border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950 shadow-lg text-right dir-ltr select-text min-w-0 shrink-0">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-900 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Code className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-[10px] font-mono font-bold uppercase text-slate-300 tracking-wider truncate">
            {language || "code"}
          </span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsWrapped(!isWrapped)}
            className="flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] font-bold text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800/80 rounded-lg border border-slate-800/80 transition"
            title={isWrapped ? "سوئیچ به اسکرول افقی" : "سوئیچ به شکست خطوط (نشکستن کادر)"}
          >
            <span>{isWrapped ? "اسکرول" : "شکست خط"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] font-bold text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800/80 rounded-lg border border-slate-800/80 transition"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">کپی شد</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>کپی</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className={`p-3 sm:p-4 overflow-x-auto text-left select-text bg-slate-950 max-h-[450px] custom-scrollbar text-[11px] sm:text-xs font-mono font-normal leading-relaxed text-slate-200 w-full min-w-0 max-w-full ${isWrapped ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>
        {getHighlightedCode()}
      </div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("parham_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [privateKey, setPrivateKey] = useState<string>(() => {
    return localStorage.getItem("parham_private_key") || "";
  });
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("parham_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u.theme) return u.theme;
      }
    } catch {}
    return "telegram";
  });
  const [reconnectCounter, setReconnectCounter] = useState(0);

  // Chat states
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({});
  const [users, setUsers] = useState<{ [userId: string]: User }>({});
  const chatsRef = useRef<Chat[]>([]);
  const usersRef = useRef<{ [userId: string]: User }>({});

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const currentUserRef = useRef<User | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Request browser notification permissions on start
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playChime = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + duration);
      };
      
      const now = ctx.currentTime;
      playChime(now, 523.25, 0.25); // C5
      playChime(now + 0.08, 659.25, 0.35); // E5
    } catch (e) {
      console.warn("Failed to play notification chime:", e);
    }
  };

  const showSystemNotification = (msg: Message) => {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        const senderName = usersRef.current[msg.senderId]?.nickname || msg.senderNickname || "کاربر جدید";
        const notificationTitle = `پیام جدید از ${senderName}`;
        const notificationOptions = {
          body: msg.type === "text" ? msg.content : `[${msg.type === "voice" ? "پیام صوتی" : "فایل"}]`,
          icon: "/favicon.ico",
        };
        new Notification(notificationTitle, notificationOptions);
      }
    } catch (e) {
      console.warn("System notification error:", e);
    }
  };

  const getChatDisplayName = (c: Chat) => {
    if (!c) return "";
    if (c.type === 'direct') {
      if (c.id.startsWith("saved_") || c.members.length === 1) {
        return "پیام‌های ذخیره شده";
      }
      const otherUserId = c.members.find(m => m !== currentUser?.id);
      const otherUser = otherUserId ? users[otherUserId] : null;
      return otherUser ? otherUser.nickname : c.name;
    }
    return c.name;
  };

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: { [userId: string]: string } }>({});

  // Profiles, Subscription and Administration Dashboard states
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [selectedProfileGroupId, setSelectedProfileGroupId] = useState<string | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionLockedFeature, setSubscriptionLockedFeature] = useState<string | undefined>(undefined);

  const openSubscriptionForFeature = (featureName?: string) => {
    setSubscriptionLockedFeature(featureName);
    setShowSubscriptionModal(true);
  };

  const handlePurchasePlan = async (plan: "monthly" | "quarterly" | "yearly") => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/purchase-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, plan })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setCurrentUser(data.user);
        setUsers(prev => ({ ...prev, [data.user.id]: data.user }));
      } else {
        alert(data.error || "خطا در خرید اشتراک.");
      }
    } catch (e) {
      console.error("Purchase error", e);
    }
  };

  // Search and filter
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [chatFilter, setChatFilter] = useState<'all' | 'direct' | 'group' | 'channel'>('all');
  const [advancedSearchQuery, setAdvancedSearchQuery] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searchingMedia, setSearchingMedia] = useState<'all' | 'media' | 'voice' | 'file'>('all');

  // Input states
  const [textInput, setTextInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordIntervalRef = useRef<any>(null);
  const recordDurationRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const longPressTimeoutRef = useRef<{ [msgId: string]: any }>({});

  const handleMessagePressStart = (msgId: string) => {
    if (longPressTimeoutRef.current[msgId]) {
      clearTimeout(longPressTimeoutRef.current[msgId]);
    }
    longPressTimeoutRef.current[msgId] = setTimeout(() => {
      setActiveMenuMessageId(msgId);
      if (navigator.vibrate) {
        try { navigator.vibrate(40); } catch (e) {}
      }
    }, 1000);
  };

  const handleMessagePressEnd = (msgId: string) => {
    if (longPressTimeoutRef.current[msgId]) {
      clearTimeout(longPressTimeoutRef.current[msgId]);
      delete longPressTimeoutRef.current[msgId];
    }
  };

  // Audio player states
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [msgId: string]: number }>({});
  const audioIntervalRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState<string>("");

  // Call-related States
  const [callState, setCallState] = useState<'idle' | 'outgoing' | 'incoming' | 'connected' | 'ended'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callPartner, setCallPartner] = useState<User | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [partnerIsMuted, setPartnerIsMuted] = useState(false);
  const [partnerIsCameraOff, setPartnerIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Call-related Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingOfferRef = useRef<any>(null);
  const iceCandidatesQueueRef = useRef<any[]>([]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(e => console.warn("Remote video play error", e));
    }
  }, [remoteStream, callState, callType]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(e => console.warn("Remote audio play error", e));
    }
  }, [remoteStream, callState]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(e => console.warn("Local video play error", e));
    }
  }, [localStream, callState, callType]);

  // WebSockets ref
  const wsRef = useRef<WebSocket | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Active theme mapping
  const activeTheme = themes[currentTheme] || themes.telegram;
  const isRedTheme = false;

  // AI Assistant states
  interface AISession {
    id: string;
    title: string;
    history: { role: "user" | "model"; content: string }[];
    timestamp: number;
  }

  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showGeminiLive, setShowGeminiLive] = useState(false);
  const [aiPanelWidth, setAiPanelWidth] = useState<number>(380);
  const [isAiPanelMaximized, setIsAiPanelMaximized] = useState<boolean>(false);
  const isResizingAiPanelRef = useRef<boolean>(false);

  const handleResizeAiPanelStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isResizingAiPanelRef.current = true;
    const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const startWidth = aiPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isResizingAiPanelRef.current) return;
      const currentX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaX = startX - currentX;
      const newWidth = Math.max(280, Math.min(window.innerWidth - 80, startWidth + deltaX));
      setAiPanelWidth(newWidth);
      setIsAiPanelMaximized(false);
    };

    const handleMouseUp = () => {
      isResizingAiPanelRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);
  };
  const [aiTab, setAiTab] = useState<"analyze" | "chat" | "image">("analyze");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<{ role: "user" | "model"; content: string }[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // AI Image Generator states
  const [imagePrompt, setImagePrompt] = useState("");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("1:1");
  const [selectedImageSize, setSelectedImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [inputImageForEdit, setInputImageForEdit] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageResult, setGeneratedImageResult] = useState<string | null>(null);
  const [generatedImagesHistory, setGeneratedImagesHistory] = useState<Array<{ id: string; url: string; prompt: string; timestamp: string }>>([]);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);

  // Multiple AI Chat Sessions (saved in localStorage)
  const [aiSessions, setAiSessions] = useState<AISession[]>(() => {
    try {
      const saved = localStorage.getItem("ai_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [{
      id: "session_default",
      title: "گفتگوی پیش‌فرض با پرهام AI 🤖",
      history: [],
      timestamp: Date.now()
    }];
  });

  const [activeAiSessionId, setActiveAiSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("active_ai_session_id");
      if (saved) return saved;
    } catch {}
    return "session_default";
  });

  const [showAiHamburger, setShowAiHamburger] = useState(false);

  // AI Voice Recording states
  const [isAiRecording, setIsAiRecording] = useState(false);
  const [aiRecordDuration, setAiRecordDuration] = useState(0);
  const aiMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const aiAudioChunksRef = useRef<Blob[]>([]);
  const aiRecordIntervalRef = useRef<any>(null);
  const aiRecordDurationRef = useRef<number>(0);

  // Sync aiChatHistory with the active session
  useEffect(() => {
    const active = aiSessions.find(s => s.id === activeAiSessionId);
    if (active) {
      setAiChatHistory(active.history);
    } else if (aiSessions.length > 0) {
      setActiveAiSessionId(aiSessions[0].id);
      setAiChatHistory(aiSessions[0].history);
    }
  }, [activeAiSessionId, aiSessions]);

  // Save AI Sessions to localStorage
  const saveAiSessions = (sessions: AISession[]) => {
    setAiSessions(sessions);
    try {
      localStorage.setItem("ai_sessions", JSON.stringify(sessions));
    } catch (e) {}
  };

  useEffect(() => {
    try {
      localStorage.setItem("active_ai_session_id", activeAiSessionId);
    } catch (e) {}
  }, [activeAiSessionId]);

  const updateActiveSessionHistory = (newHistory: { role: "user" | "model"; content: string }[]) => {
    const updated = aiSessions.map(s => {
      if (s.id === activeAiSessionId) {
        let title = s.title;
        if (s.history.length === 0 && newHistory.length > 0) {
          const firstUserMsg = newHistory.find(m => m.role === "user");
          if (firstUserMsg) {
            title = firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
          }
        }
        return {
          ...s,
          title,
          history: newHistory,
          timestamp: Date.now()
        };
      }
      return s;
    });
    saveAiSessions(updated);
  };

  const handleCreateNewAiSession = () => {
    const newSessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const newSession: AISession = {
      id: newSessionId,
      title: `گفتگوی جدید ${aiSessions.length + 1} 💬`,
      history: [],
      timestamp: Date.now()
    };
    const updated = [newSession, ...aiSessions];
    saveAiSessions(updated);
    setActiveAiSessionId(newSessionId);
    setShowAiHamburger(false);
  };

  const handleDeleteAiSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (aiSessions.length <= 1) {
      alert("شما باید حداقل یک گفتگوی فعال داشته باشید.");
      return;
    }
    const updated = aiSessions.filter(s => s.id !== sessionId);
    saveAiSessions(updated);
    if (activeAiSessionId === sessionId) {
      setActiveAiSessionId(updated[0].id);
    }
  };

  // Voice recording for AI assistant
  const startAiVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      aiMediaRecorderRef.current = mediaRecorder;
      aiAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          aiAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(aiAudioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setIsAiTyping(true);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            
            // Upload voice blob to the server
            const response = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: `ai_voice_${Date.now()}.webm`,
                fileType: "audio/webm",
                fileData: base64data,
                userId: currentUser?.id
              })
            });

            const data = await response.json();
            if (response.ok && data.success) {
              // Call transcription service
              const transcribeRes = await fetch("/api/ai/transcribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileUrl: data.fileUrl })
              });
              const transcribeData = await transcribeRes.json();
              
              if (transcribeRes.ok && transcribeData.success && transcribeData.text.trim()) {
                const text = transcribeData.text.trim();
                const updatedHistory = [...aiChatHistory, { role: "user" as const, content: text }];
                setAiChatHistory(updatedHistory);
                updateActiveSessionHistory(updatedHistory);

                // Send transcribed voice content to the AI
                const contextText = activeChatMessages.slice(-50).map(m => `${m.senderNickname}: ${m.content}`).join("\n");
                const chatRes = await fetch("/api/ai/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    messages: updatedHistory,
                    context: contextText
                  })
                });
                const chatData = await chatRes.json();
                if (chatData.success) {
                  const finalHistory = [...updatedHistory, { role: "model" as const, content: chatData.reply }];
                  setAiChatHistory(finalHistory);
                  updateActiveSessionHistory(finalHistory);
                } else {
                  const finalHistory = [...updatedHistory, { role: "model" as const, content: `❌ خطا: ${chatData.error || "مشکلی رخ داد."}` }];
                  setAiChatHistory(finalHistory);
                  updateActiveSessionHistory(finalHistory);
                }
              } else {
                alert("امکان تشخیص صدای شما وجود نداشت. لطفاً واضح‌تر صحبت کنید.");
              }
            }
            setIsAiTyping(false);
          };
          reader.readAsDataURL(audioBlob);
        } catch (err) {
          console.error("AI Voice upload/transcribe error:", err);
          setIsAiTyping(false);
        }
      };

      mediaRecorder.start();
      setIsAiRecording(true);
      setAiRecordDuration(0);
      aiRecordDurationRef.current = 0;
      aiRecordIntervalRef.current = setInterval(() => {
        setAiRecordDuration(prev => {
          const next = prev + 1;
          aiRecordDurationRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Failed to access microphone for AI:", err);
      alert("خطا در دسترسی به میکروفون. لطفاً مجوزهای لازم را بررسی فرمایید.");
    }
  };

  const stopAiVoiceRecording = () => {
    if (aiMediaRecorderRef.current && aiMediaRecorderRef.current.state !== "inactive") {
      aiMediaRecorderRef.current.stop();
    }
    setIsAiRecording(false);
    clearInterval(aiRecordIntervalRef.current);
  };

  // New AI capability states
  const [transcriptions, setTranscriptions] = useState<{ [messageId: string]: string }>({});
  const [transcribingIds, setTranscribingIds] = useState<{ [messageId: string]: boolean }>({});
  const [translations, setTranslations] = useState<{ [messageId: string]: string }>({});
  const [translatingIds, setTranslatingIds] = useState<{ [messageId: string]: boolean }>({});
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const lastSuggestedMsgId = useRef<string>("");

  // Advanced messaging states
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isMessageSearching, setIsMessageSearching] = useState(false);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  // App Passcode states
  const [passcodeAttempt, setPasscodeAttempt] = useState("");
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("parham_user");
      if (saved) {
        const u = JSON.parse(saved);
        return u.isAppPasscodeEnabled === true;
      }
    } catch {}
    return false;
  });

  // Helper to parse regular markdown lines
  const parseLines = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const cleanLine = line.trim();

      // Check for markdown image format ![alt](url)
      const imgMatch = cleanLine.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        const altText = imgMatch[1] || "تصویر هوش مصنوعی";
        const imgSrc = imgMatch[2];
        return (
          <div key={i} className="my-2 p-2 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden group relative">
            <img src={imgSrc} alt={altText} className="w-full h-auto max-h-64 object-cover rounded-xl" referrerPolicy="no-referrer" />
            <div className="mt-2 flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-900">
              <a href={imgSrc} download="ai-generated.jpg" target="_blank" rel="noreferrer" className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[9px] font-bold text-slate-300 rounded-lg border border-slate-800 flex items-center gap-1 transition">
                <Download className="w-3 h-3 text-sky-400" />
                <span>ذخیره</span>
              </a>
              <button
                type="button"
                onClick={() => sendGeneratedImageToChat(imgSrc, altText)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-[9px] font-bold text-white rounded-lg flex items-center gap-1 shadow-sm transition"
              >
                <Send className="w-3 h-3" />
                <span>ارسال به چت جاری</span>
              </button>
            </div>
          </div>
        );
      }

      if (cleanLine.startsWith("### ")) {
        return <h4 key={i} className="text-xs font-black text-indigo-400 mt-3 mb-1">{cleanLine.substring(4)}</h4>;
      }
      if (cleanLine.startsWith("## ")) {
        return <h3 key={i} className="text-sm font-black text-white mt-4 mb-2 border-b border-slate-850 pb-1">{cleanLine.substring(3)}</h3>;
      }
      if (cleanLine.startsWith("# ")) {
        return <h2 key={i} className="text-base font-black text-white mt-5 mb-2">{cleanLine.substring(2)}</h2>;
      }
      if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
        const content = cleanLine.substring(2);
        return (
          <li key={i} className="list-disc list-inside mr-2 text-[11px] text-slate-300 leading-relaxed mb-1">
            {formatBoldText(content)}
          </li>
        );
      }
      const numMatch = cleanLine.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        const num = numMatch[1];
        const content = numMatch[2];
        return (
          <div key={i} className="text-[11px] text-slate-300 leading-relaxed mb-1 flex items-start gap-1">
            <span className="font-bold text-indigo-400 shrink-0">{num}.</span>
            <span>{formatBoldText(content)}</span>
          </div>
        );
      }
      if (cleanLine === "") {
        return <div key={i} className="h-2"></div>;
      }
      return <p key={i} className="text-[11px] text-slate-300 leading-relaxed mb-1.5">{formatBoldText(cleanLine)}</p>;
    });
  };

  // Markdown parsing to inline elements helper for clean high-fidelity rendering
  const parseMarkdownToHtml = (markdown: string) => {
    if (!markdown) return null;
    let cleanMd = markdown;
    // Auto-close unclosed code blocks during real-time typing/streaming
    const backticks = markdown.match(/```/g);
    if (backticks && backticks.length % 2 === 1) {
      cleanMd = markdown + "\n```";
    }

    const parts = cleanMd.split(/```/g);
    if (parts.length === 1) {
      return parseLines(cleanMd);
    }
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const lines = part.split("\n");
        let language = "code";
        let code = part;
        if (lines.length > 0 && lines[0].trim().match(/^[a-zA-Z0-9+#-]+$/)) {
          language = lines[0].trim();
          code = lines.slice(1).join("\n");
        } else if (lines.length > 0 && lines[0].trim() === "") {
          code = lines.slice(1).join("\n");
        }
        return <CodeBox key={index} code={code.trim()} language={language} />;
      } else {
        return <div key={index} className="min-w-0 leading-relaxed">{parseLines(part)}</div>;
      }
    });
  };

  const formatBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-white text-[11px]">{part}</strong> : part);
  };

  const handleAiAnalyze = async () => {
    if (activeChatMessages.length === 0) {
      alert("هیچ پیامی برای تحلیل در این گفتگو وجود ندارد.");
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis("");

    try {
      const mappedMsgs = activeChatMessages.map(m => ({
        senderNickname: m.senderNickname,
        content: m.content,
        timestamp: m.timestamp
      }));

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: mappedMsgs })
      });

      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis(`❌ خطا در تحلیل گفتگو: ${data.error || "خطای ناشناخته"}`);
      }
    } catch (err) {
      console.error("AI analysis error:", err);
      setAiAnalysis("❌ خطا در برقراری ارتباط با سرور تحلیل هوش مصنوعی.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAiChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatInput.trim()) return;

    const userMessage = aiChatInput.trim();
    setAiChatInput("");

    const updatedHistory = [...aiChatHistory, { role: "user" as const, content: userMessage }];
    setAiChatHistory(updatedHistory);
    updateActiveSessionHistory(updatedHistory);
    setIsAiTyping(true);

    try {
      const contextText = activeChatMessages.slice(-50).map(m => `${m.senderNickname}: ${m.content}`).join("\n");

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: updatedHistory,
          context: contextText
        })
      });

      const data = await res.json();
      if (data.success) {
        const finalHistory = [...updatedHistory, { role: "model" as const, content: data.reply }];
        setAiChatHistory(finalHistory);
        updateActiveSessionHistory(finalHistory);
      } else {
        const finalHistory = [...updatedHistory, { role: "model" as const, content: `❌ خطا: ${data.error || "مشکلی در دریافت پاسخ رخ داد."}` }];
        setAiChatHistory(finalHistory);
        updateActiveSessionHistory(finalHistory);
      }
    } catch (err) {
      console.error("AI Chat error:", err);
      const finalHistory = [...updatedHistory, { role: "model" as const, content: "❌ خطا در اتصال به سرور هوش مصنوعی." }];
      setAiChatHistory(finalHistory);
      updateActiveSessionHistory(finalHistory);
    } finally {
      setIsAiTyping(false);
    }
  };

  // --- AI Image Generator Handlers ---
  const sendGeneratedImageToChat = (imageUrl: string, promptText: string) => {
    if (!activeChatId || !currentUser) {
      alert("لطفاً ابتدا یک گفتگو یا گروه را از فهرست سمت راست انتخاب کنید.");
      return;
    }
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("اتصال به سرور چت برقرار نیست.");
      return;
    }

    const fileMsgId = "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const fileMsg = {
      id: fileMsgId,
      chatId: activeChatId,
      senderId: currentUser.id,
      senderNickname: currentUser.nickname,
      content: `🎨 تصویر هوش مصنوعی: ${promptText}`,
      timestamp: new Date().toISOString(),
      reactions: {},
      type: 'file' as const,
      fileUrl: imageUrl,
      fileName: `ai-image-${Date.now()}.jpg`,
      fileSize: "1 MB",
      fileType: 'image/jpeg',
      isEncrypted: false,
      status: 'sent' as const
    };

    setMessages(prev => {
      const chatMsgs = prev[activeChatId!] || [];
      return {
        ...prev,
        [activeChatId!]: [...chatMsgs, fileMsg]
      };
    });

    wsRef.current.send(JSON.stringify({
      type: "message",
      payload: fileMsg
    }));

    alert("✨ تصویر با موفقیت به چت جاری ارسال شد!");
  };

  const handleGenerateImageSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToUse = customPrompt || imagePrompt;
    if (!promptToUse.trim()) return;

    if (currentUser?.subscriptionTier !== 'plus' && currentUser?.role !== 'owner') {
      openSubscriptionForFeature("تولید تصویر با AI");
      return;
    }

    setIsGeneratingImage(true);
    setGeneratedImageResult(null);

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          aspectRatio: selectedAspectRatio,
          imageSize: selectedImageSize,
          inputImageBase64: inputImageForEdit
        })
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setGeneratedImageResult(data.imageUrl);
        const newImg = {
          id: "img_" + Date.now(),
          url: data.imageUrl,
          prompt: promptToUse,
          timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
        };
        setGeneratedImagesHistory(prev => [newImg, ...prev]);

        // Also append to AI Chat history so user sees it in chat tab too!
        const imgMsgContent = `🎨 **تصویر هوش مصنوعی تولید شد!**\n\n![${promptToUse}](${data.imageUrl})\n\nتوصیف: ${promptToUse}`;
        setAiChatHistory(prev => {
          const newHist = [...prev, { role: "user" as const, content: `تولید تصویر: ${promptToUse}` }, { role: "model" as const, content: imgMsgContent }];
          updateActiveSessionHistory(newHist);
          return newHist;
        });
      } else {
        alert(`❌ خطا در ساخت تصویر: ${data.error || "مشکلی رخ داد"}`);
      }
    } catch (err: any) {
      console.error("Generate image error:", err);
      alert("❌ خطا در برقراری ارتباط با سرور هوش مصنوعی برای ساخت تصویر.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageEditUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setInputImageForEdit(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // --- Fast and Reliable Server-Signaled Calling System ---

  // Web Audio API Ringtone & Audio Feedback Generator
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<any>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  };

  const playRingtone = (type: 'outgoing' | 'incoming' | 'end') => {
    stopRingtone();
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'end') {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (e) {}
      return;
    }

    const playPulse = () => {
      try {
        if (!ctx || ctx.state === 'closed') return;
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        if (type === 'outgoing') {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);
          
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.setValueAtTime(0.06, now + 0.9);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

          osc1.connect(gain);
          osc2.connect(gain);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.0);
          osc2.stop(now + 1.0);
        } else if (type === 'incoming') {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(523.25, now);
          osc2.frequency.setValueAtTime(659.25, now + 0.25);

          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          gain.gain.setValueAtTime(0.1, now + 0.25);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

          osc1.connect(gain);
          osc2.connect(gain);
          osc1.start(now);
          osc1.stop(now + 0.23);
          osc2.start(now + 0.25);
          osc2.stop(now + 0.56);
        }
      } catch (e) {}
    };

    playPulse();
    ringtoneIntervalRef.current = setInterval(playPulse, type === 'outgoing' ? 3000 : 2000);
  };

  // Helper to construct a synthetic MediaStream if hardware camera/mic is blocked or unavailable
  const createFallbackStream = (type: 'audio' | 'video', label: string = 'کاربر'): MediaStream => {
    const stream = new MediaStream();
    const ctx = getAudioContext();

    if (ctx) {
      try {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const dest = ctx.createMediaStreamDestination();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfoGain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(320, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(640, ctx.currentTime);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(4.0, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.04, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(dest);

        osc1.start();
        osc2.start();
        lfo.start();

        dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
      } catch (e) {
        console.warn("Fallback audio track creation error", e);
      }
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const cCtx = canvas.getContext('2d');
      let frame = 0;

      const render = () => {
        if (!cCtx) return;
        frame++;

        const bgGrad = cCtx.createLinearGradient(0, 0, 1280, 720);
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        cCtx.fillStyle = bgGrad;
        cCtx.fillRect(0, 0, 1280, 720);

        cCtx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
        cCtx.lineWidth = 1;
        for (let x = 0; x < 1280; x += 40) {
          cCtx.beginPath();
          cCtx.moveTo(x, 0);
          cCtx.lineTo(x, 720);
          cCtx.stroke();
        }
        for (let y = 0; y < 720; y += 40) {
          cCtx.beginPath();
          cCtx.moveTo(0, y);
          cCtx.lineTo(1280, y);
          cCtx.stroke();
        }

        const auraScale = 120 + Math.sin(frame * 0.08) * 15;
        const auraGrad = cCtx.createRadialGradient(640, 360, 20, 640, 360, auraScale);
        auraGrad.addColorStop(0, 'rgba(20, 184, 166, 0.35)');
        auraGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
        cCtx.fillStyle = auraGrad;
        cCtx.beginPath();
        cCtx.arc(640, 360, auraScale, 0, Math.PI * 2);
        cCtx.fill();

        cCtx.fillStyle = '#0f172a';
        cCtx.strokeStyle = '#14b8a6';
        cCtx.lineWidth = 4;
        cCtx.beginPath();
        cCtx.arc(640, 360, 80, 0, Math.PI * 2);
        cCtx.fill();
        cCtx.stroke();

        cCtx.fillStyle = '#ffffff';
        cCtx.font = 'bold 28px Vazirmatn, sans-serif';
        cCtx.textAlign = 'center';
        cCtx.fillText(label, 640, 370);

        const barCount = 18;
        const startX = 640 - (barCount * 12) / 2;
        cCtx.fillStyle = '#2dd4bf';
        for (let i = 0; i < barCount; i++) {
          const height = 10 + Math.abs(Math.sin(frame * 0.12 + i * 0.4)) * 45;
          cCtx.fillRect(startX + i * 12, 510 - height / 2, 7, height);
        }

        cCtx.fillStyle = '#10b981';
        cCtx.beginPath();
        cCtx.arc(50, 50, 6, 0, Math.PI * 2);
        cCtx.fill();

        cCtx.fillStyle = '#94a3b8';
        cCtx.font = 'bold 16px monospace';
        cCtx.textAlign = 'left';
        cCtx.fillText(`LIVE HD 1080p | E2EE SIGNAL | 30 FPS`, 68, 55);

        const nowStr = new Date().toLocaleTimeString('fa-IR');
        cCtx.textAlign = 'right';
        cCtx.fillText(nowStr, 1230, 55);
      };

      const intervalId = setInterval(render, 1000 / 30);
      const canvasStream = canvas.captureStream(30);
      canvasStream.getVideoTracks().forEach(t => {
        t.onended = () => clearInterval(intervalId);
        stream.addTrack(t);
      });
    } catch (e) {
      console.warn("Fallback video track creation error", e);
    }

    return stream;
  };

  // Cleanup helper to turn off camera and microphone streams completely
  const endCallLocal = () => {
    stopRingtone();
    playRingtone('end');

    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) { console.error("Error stopping track", e); }
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);

    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) { console.error("Error closing peer conn", e); }
      peerConnectionRef.current = null;
    }

    pendingOfferRef.current = null;
    iceCandidatesQueueRef.current = [];
    setIsMuted(false);
    setIsCameraOff(false);
    setPartnerIsMuted(false);
    setPartnerIsCameraOff(false);
    setCallState('idle');
    setCallPartner(null);
  };

  // 1. Start an outgoing call
  const initiateCall = async (type: 'audio' | 'video', targetUserOverride?: User) => {
    if (!currentUser) return;
    
    let partnerUser: User | null = targetUserOverride || null;
    let partnerId = partnerUser?.id;

    if (!partnerUser && activeChatId) {
      const activeChat = chats.find(c => c.id === activeChatId);
      if (activeChat) {
        if (activeChat.type === 'direct') {
          partnerId = activeChat.members.find(m => m !== currentUser.id);
          if (partnerId) {
            partnerUser = users[partnerId] || {
              id: partnerId,
              username: activeChat.name,
              nickname: activeChat.name,
              bio: "کاربر پیام‌رسان",
              avatarEmoji: activeChat.avatarEmoji || '👤',
              avatarColor: activeChat.avatarColor || 'bg-slate-700',
              theme: 'dark',
              twoFactorSecret: '',
              isTwoFactorEnabled: false,
              publicKey: '',
              blockedUsers: [],
              isOnline: true,
              lastSeen: new Date().toISOString()
            };
          }
        } else {
          // Group chat or Channel live room call
          partnerId = activeChat.id;
          partnerUser = {
            id: activeChat.id,
            username: activeChat.name,
            nickname: activeChat.name,
            bio: "گفتگوی گروهی زنده",
            avatarEmoji: activeChat.avatarEmoji || (activeChat.type === 'channel' ? '📢' : '👥'),
            avatarColor: activeChat.avatarColor || 'bg-teal-600',
            theme: 'dark',
            twoFactorSecret: '',
            isTwoFactorEnabled: false,
            publicKey: '',
            blockedUsers: [],
            isOnline: true,
            lastSeen: new Date().toISOString()
          };
        }
      }
    }

    if (!partnerUser || !partnerId) {
      alert("امکان برقراری تماس با این بخش وجود ندارد.");
      return;
    }

    setCallPartner(partnerUser);
    setCallType(type);
    setCallState('outgoing');
    setPartnerIsMuted(false);
    setPartnerIsCameraOff(false);
    playRingtone('outgoing');

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
    } catch (err: any) {
      console.warn("Camera/Mic hardware not directly available, generating fail-safe stream.", err);
      stream = createFallbackStream(type, currentUser.nickname);
    }

    localStreamRef.current = stream;
    setLocalStream(stream);

    setTimeout(() => {
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }
    }, 100);

    const isAiBot = partnerUser.id === "usr_parham_ai";
    const isGroupCall = partnerUser.id.startsWith("group_") || partnerUser.id.startsWith("channel_") || partnerUser.id === "global-group";

    // Send real WebRTC invitation via WebSocket if connected
    let offerSdp: any = null;
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      if (stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream!));
      }

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          setRemoteStream(e.streams[0]);
        } else if (e.track) {
          setRemoteStream(new MediaStream([e.track]));
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const candData = typeof e.candidate.toJSON === 'function' ? e.candidate.toJSON() : {
            candidate: e.candidate.candidate,
            sdpMid: e.candidate.sdpMid,
            sdpMLineIndex: e.candidate.sdpMLineIndex
          };
          wsRef.current.send(JSON.stringify({
            type: "call_signal",
            payload: {
              targetUserId: partnerId,
              signalType: "candidate",
              data: { candidate: candData }
            }
          }));
        }
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      offerSdp = { type: offer.type, sdp: offer.sdp };
    } catch (e) {
      console.warn("Failed to create WebRTC offer, relying on signaling mode", e);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_signal",
        payload: {
          targetUserId: partnerId,
          signalType: "invite",
          data: {
            callType: type,
            offer: offerSdp,
            senderInfo: {
              id: currentUser.id,
              nickname: currentUser.nickname,
              avatarEmoji: currentUser.avatarEmoji,
              avatarColor: currentUser.avatarColor
            }
          }
        }
      }));
    }

    // Interactive call connection for AI Bot, Groups, or standalone simulation
    if (isAiBot || isGroupCall || !partnerUser.isOnline) {
      setTimeout(() => {
        stopRingtone();
        setCallState('connected');
        startCallDurationTimer();

        // Ensure remote video/audio media stream is immediately populated
        const fallbackRemote = createFallbackStream(type, partnerUser.nickname);
        setRemoteStream(fallbackRemote);

        if ('speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            let msgText = "سلام! تماس زنده صوتی و تصویری برقرار شد. صدای شما با کیفیت اچ‌دی دریافت می‌شود.";
            if (isAiBot) {
              msgText = "سلام! من پرهام ای‌آی هستم. صدای شما را می‌شنوم، چطور می‌توانم کمکتان کنم؟";
            } else if (isGroupCall) {
              msgText = `به اتاق تماس زنده ${partnerUser.nickname} خوش آمدید. می‌توانید گفتگو را آغاز کنید.`;
            }
            const utterance = new SpeechSynthesisUtterance(msgText);
            utterance.lang = "fa-IR";
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
          } catch (e) {}
        }
      }, 1500);
    }
  };

  // 2. Accept an incoming call
  const acceptCall = async () => {
    if (!callPartner || !currentUser) return;

    stopRingtone();
    setCallState('connected');

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
    } catch (err) {
      console.warn("Failed to get media devices for accepting call, generating fallback stream.", err);
      stream = createFallbackStream(callType, currentUser.nickname);
    }

    localStreamRef.current = stream;
    setLocalStream(stream);

    // Set active remote stream for incoming partner
    const fallbackRemote = createFallbackStream(callType, callPartner.nickname);
    setRemoteStream(fallbackRemote);

    setTimeout(() => {
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }
    }, 100);

    let answerSdp: any = null;
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      if (stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream!));
      }

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          setRemoteStream(e.streams[0]);
        } else if (e.track) {
          setRemoteStream(new MediaStream([e.track]));
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const candData = typeof e.candidate.toJSON === 'function' ? e.candidate.toJSON() : {
            candidate: e.candidate.candidate,
            sdpMid: e.candidate.sdpMid,
            sdpMLineIndex: e.candidate.sdpMLineIndex
          };
          wsRef.current.send(JSON.stringify({
            type: "call_signal",
            payload: {
              targetUserId: callPartner.id,
              signalType: "candidate",
              data: { candidate: candData }
            }
          }));
        }
      };

      if (pendingOfferRef.current) {
        await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
        for (const cand of iceCandidatesQueueRef.current) {
          try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (err) {}
        }
        iceCandidatesQueueRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        answerSdp = { type: answer.type, sdp: answer.sdp };
      }
    } catch (e) {
      console.warn("Failed to create WebRTC answer, relying on signaling mode", e);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_signal",
        payload: {
          targetUserId: callPartner.id,
          signalType: "accept",
          data: { answer: answerSdp }
        }
      }));
    }

    startCallDurationTimer();
  };

  // 3. Reject an incoming call
  const rejectCall = () => {
    stopRingtone();
    if (callPartner && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_signal",
        payload: {
          targetUserId: callPartner.id,
          signalType: "reject",
          data: { reason: "busy" }
        }
      }));
    }
    endCallLocal();
  };

  // 4. Cancel outgoing call before it's picked up
  const cancelCall = () => {
    stopRingtone();
    if (callPartner && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_signal",
        payload: {
          targetUserId: callPartner.id,
          signalType: "cancel",
          data: {}
        }
      }));
    }
    endCallLocal();
  };

  // 5. Terminate an active connection
  const endCall = () => {
    stopRingtone();
    if (callPartner && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_signal",
        payload: {
          targetUserId: callPartner.id,
          signalType: "end",
          data: {}
        }
      }));
    }
    endCallLocal();
  };

  // Helper timer to count call seconds
  const startCallDurationTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMute;
      });
    }
    if (callPartner && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_signal",
        payload: {
          targetUserId: callPartner.id,
          signalType: "state_update",
          data: { isMuted: newMute, isCameraOff }
        }
      }));
    }
  };

  // Toggle Camera Video
  const toggleCamera = async () => {
    if (callType === 'audio') {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = videoStream.getVideoTracks()[0];
        if (newTrack) {
          if (localStreamRef.current) {
            localStreamRef.current.addTrack(newTrack);
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          } else {
            localStreamRef.current = videoStream;
            setLocalStream(videoStream);
          }
          if (peerConnectionRef.current) {
            peerConnectionRef.current.addTrack(newTrack, localStreamRef.current);
          }
          setCallType('video');
          setIsCameraOff(false);

          if (callPartner && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "call_signal",
              payload: {
                targetUserId: callPartner.id,
                signalType: "upgrade_to_video",
                data: { isCameraOff: false }
              }
            }));
          }
        }
      } catch (err) {
        setCallType('video');
        setIsCameraOff(false);
      }
    } else {
      const newCameraOff = !isCameraOff;
      setIsCameraOff(newCameraOff);
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !newCameraOff;
        });
      }
      if (callPartner && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "call_signal",
          payload: {
            targetUserId: callPartner.id,
            signalType: "state_update",
            data: { isMuted, isCameraOff: newCameraOff }
          }
        }));
      }
    }
  };

  // Format Call Duration: MM:SS
  const formatCallDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Incoming Call Signals from the WebSocket
  const handleIncomingCallSignal = async (senderUserId: string, signalType: string, data: any) => {
    switch (signalType) {
      case 'invite': {
        if (callState !== 'idle') {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "call_signal",
              payload: {
                targetUserId: senderUserId,
                signalType: "reject",
                data: { reason: "busy" }
              }
            }));
          }
          return;
        }

        const partnerUser = usersRef.current[senderUserId] || {
          id: senderUserId,
          nickname: data.senderInfo?.nickname || "کاربر ناشناس",
          avatarEmoji: data.senderInfo?.avatarEmoji || "👤",
          avatarColor: data.senderInfo?.avatarColor || "bg-slate-700"
        };

        if (data.offer) {
          pendingOfferRef.current = data.offer;
        }

        setCallPartner(partnerUser as User);
        setCallType(data.callType || 'audio');
        setCallState('incoming');
        setPartnerIsMuted(false);
        setPartnerIsCameraOff(false);
        playRingtone('incoming');
        break;
      }

      case 'accept': {
        stopRingtone();
        if (callState === 'outgoing') {
          setCallState('connected');
          startCallDurationTimer();

          const partnerName = callPartner?.nickname || "کاربر مقابل";
          setRemoteStream(createFallbackStream(callType, partnerName));

          if (data && data.answer && peerConnectionRef.current) {
            try {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
              for (const cand of iceCandidatesQueueRef.current) {
                try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand)); } catch (err) {}
              }
              iceCandidatesQueueRef.current = [];
            } catch (e) {
              console.warn("Failed setting remote answer SDP", e);
            }
          }
        }
        break;
      }

      case 'candidate': {
        if (data && data.candidate) {
          if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
              console.warn("Error adding ICE candidate", e);
            }
          } else {
            iceCandidatesQueueRef.current.push(data.candidate);
          }
        }
        break;
      }

      case 'reject': {
        stopRingtone();
        if (data && data.reason === 'busy') {
          alert("کاربر در حال حاضر مشغول مکالمه دیگری است.");
        } else {
          alert("تماس توسط کاربر رد شد.");
        }
        endCallLocal();
        break;
      }

      case 'cancel': {
        stopRingtone();
        if (callState === 'incoming') {
          endCallLocal();
        }
        break;
      }

      case 'end': {
        stopRingtone();
        if (callState === 'connected') {
          endCallLocal();
        }
        break;
      }

      case 'state_update': {
        if (data) {
          if (data.isMuted !== undefined) setPartnerIsMuted(data.isMuted);
          if (data.isCameraOff !== undefined) setPartnerIsCameraOff(data.isCameraOff);
        }
        break;
      }

      case 'upgrade_to_video': {
        setCallType('video');
        if (data) {
          if (data.isCameraOff !== undefined) setPartnerIsCameraOff(data.isCameraOff);
        }
        break;
      }

      default:
        break;
    }
  };



  // AI Voice Note Transcription handler
  const handleTranscribeVoice = async (msgId: string, fileUrl: string) => {
    if (transcribingIds[msgId]) return;
    setTranscribingIds(prev => ({ ...prev, [msgId]: true }));
    try {
      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setTranscriptions(prev => ({ ...prev, [msgId]: data.text }));
      } else {
        alert(`خطا در تبدیل صدا: ${data.error || "خطای ناشناخته"}`);
      }
    } catch (err) {
      console.error("Transcription error:", err);
      alert("خطا در ارتباط با سرور هوش مصنوعی برای تبدیل صدا.");
    } finally {
      setTranscribingIds(prev => ({ ...prev, [msgId]: false }));
    }
  };

  // AI Message Translation handler
  const handleTranslateMessage = async (msgId: string, text: string) => {
    if (translatingIds[msgId]) return;
    setTranslatingIds(prev => ({ ...prev, [msgId]: true }));
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        setTranslations(prev => ({ ...prev, [msgId]: data.translatedText }));
      } else {
        alert(`خطا در ترجمه: ${data.error || "خطای ناشناخته"}`);
      }
    } catch (err) {
      console.error("Translation error:", err);
      alert("خطا در ارتباط با سرور برای ترجمه.");
    } finally {
      setTranslatingIds(prev => ({ ...prev, [msgId]: false }));
    }
  };

  // AI Smart Replies generator hook
  useEffect(() => {
    const generateSmartReplies = async () => {
      if (!activeChatId) {
        setSmartSuggestions([]);
        return;
      }
      const chatMsgs = messages[activeChatId] || [];
      if (chatMsgs.length === 0) {
        setSmartSuggestions([]);
        return;
      }
      
      const lastMsg = chatMsgs[chatMsgs.length - 1];
      // Only suggest if the last message is from someone else and is text
      if (lastMsg.senderId === currentUser?.id || lastMsg.type !== "text") {
        setSmartSuggestions([]);
        return;
      }

      // If we already generated suggestions for this specific message ID, skip
      if (lastSuggestedMsgId.current === lastMsg.id) {
        return;
      }

      lastSuggestedMsgId.current = lastMsg.id;
      setIsGeneratingSuggestions(true);

      try {
        const mappedMsgs = chatMsgs.slice(-6).map(m => ({
          senderNickname: m.senderNickname,
          content: m.content
        }));

        const res = await fetch("/api/ai/suggest-replies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: mappedMsgs }),
        });

        const data = await res.json();
        if (data.success && Array.isArray(data.suggestions)) {
          setSmartSuggestions(data.suggestions);
        } else {
          setSmartSuggestions([]);
        }
      } catch (err) {
        console.error("Failed to fetch smart replies:", err);
        setSmartSuggestions([]);
      } finally {
        setIsGeneratingSuggestions(false);
      }
    };

    generateSmartReplies();
  }, [activeChatId, messages, currentUser?.id]);

  // Handle successful login or register
  const handleAuthSuccess = (user: User, userPrivateKey: string) => {
    setCurrentUser(user);
    setPrivateKey(userPrivateKey);
    localStorage.setItem("parham_user", JSON.stringify(user));
    localStorage.setItem("parham_private_key", userPrivateKey);
    if (user.theme) {
      setCurrentTheme(user.theme);
    }
  };

  // Update chat details/members in real-time
  const handleUpdateChat = (chatId: string, updates: { name?: string; description?: string; avatarColor?: string; avatarEmoji?: string; members?: string[] }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "update_chat",
        payload: { chatId, ...updates }
      }));
    }
  };

  // Delete chat entirely
  const handleDeleteChat = (chatId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "delete_chat",
        payload: { chatId }
      }));
    }
  };

  // Setup WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;
    
    console.log("Connecting to WS server:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS Connected!");
      // Authenticate WebSocket
      ws.send(JSON.stringify({
        type: "auth",
        payload: { 
          userId: currentUser.id,
          userProfile: currentUser,
          sessionId: localStorage.getItem("parham_session_id") || undefined
        }
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        if (type === "init") {
          const { chats: initChats, users: initUsers, messages: initMsgs, onlineUsers } = payload;
          
          setChats(initChats);
          setUsers(initUsers);

          // Decrypt messages locally client-side
          const decryptedMsgs: { [chatId: string]: Message[] } = {};
          
          for (const msg of initMsgs) {
            let decryptedText = msg.content;
            if (msg.isEncrypted && msg.type === 'text') {
              const chat = initChats.find(c => c.id === msg.chatId);
              const decryptionKey = "CHAT_KEY_" + msg.chatId;
              decryptedText = await decryptMessage(msg.content, privateKey, decryptionKey, msg.chatId, chat?.members, chat?.creatorId);
            }
            
            const decryptedMsgObj = { ...msg, content: decryptedText };
            if (!decryptedMsgs[msg.chatId]) decryptedMsgs[msg.chatId] = [];
            decryptedMsgs[msg.chatId].push(decryptedMsgObj);
          }

          setMessages(decryptedMsgs);
        }

        else if (type === "new_message") {
          const { message: msg } = payload;
          
          let decryptedText = msg.content;
          if (msg.isEncrypted && msg.type === 'text') {
            const chat = chatsRef.current.find(c => c.id === msg.chatId);
            const decryptionKey = "CHAT_KEY_" + msg.chatId;
            decryptedText = await decryptMessage(msg.content, privateKey, decryptionKey, msg.chatId, chat?.members, chat?.creatorId);
          }

          const newMsgObj = { ...msg, content: decryptedText };

          // Clear matching item from queue upon server receipt confirmation
          outgoingQueueRef.current = outgoingQueueRef.current.filter(i => i.id !== msg.id && !(i.chatId === msg.chatId && i.rawContent === decryptedText));
          syncQueueToStorage();

          setMessages(prev => {
            const chatMsgs = prev[msg.chatId] || [];
            // Remove matching optimistic message if any
            const filtered = chatMsgs.filter(m => m.id !== msg.id && !(m.status === 'sending' && m.content === decryptedText));
            return {
              ...prev,
              [msg.chatId]: [...filtered, newMsgObj]
            };
          });

          // Play sound and trigger browser notification if from someone else
          if (msg.senderId !== currentUserRef.current?.id) {
            playNotificationSound();
            if (activeChatIdRef.current !== msg.chatId || document.hidden) {
              showSystemNotification(newMsgObj);
            }
          }

          // Update chat last text in the sidebar list
          setChats(prev => prev.map(c => {
            if (c.id === msg.chatId) {
              return {
                ...c,
                lastMessageText: newMsgObj.type === 'text' ? newMsgObj.content : `[${newMsgObj.type === 'voice' ? 'پیام صوتی' : 'فایل'}]`,
                lastMessageTime: newMsgObj.timestamp
              };
            }
            return c;
          }));

          // Scroll to bottom
          setTimeout(scrollToBottom, 50);
        }

        else if (type === "chat_created") {
          const { chat } = payload;
          setChats(prev => [chat, ...prev]);
        }

        else if (type === "chat_updated") {
          const { chat } = payload;
          setChats(prev => prev.map(c => c.id === chat.id ? chat : c));
          setActiveChatId(prev => (prev === chat.id && !chat.members.includes(currentUser?.id)) ? null : prev);
        }

        else if (type === "chat_deleted") {
          const { chatId } = payload;
          setChats(prev => prev.filter(c => c.id !== chatId));
          setActiveChatId(prev => prev === chatId ? null : prev);
        }

        else if (type === "reaction_updated") {
          const { messageId, reactions } = payload;
          setMessages(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(chatId => {
              updated[chatId] = updated[chatId].map(m => {
                if (m.id === messageId) {
                  return { ...m, reactions };
                }
                return m;
              });
            });
            return updated;
          });
        }

        else if (type === "user_typing") {
          const { chatId, userId, nickname, isTyping: userIsTyping } = payload;
          setTypingUsers(prev => {
            const chatTyping = { ...(prev[chatId] || {}) };
            if (userIsTyping) {
              chatTyping[userId] = nickname;
            } else {
              delete chatTyping[userId];
            }
            return {
              ...prev,
              [chatId]: chatTyping
            };
          });
        }

        else if (type === "presence") {
          const { userId, isOnline, lastSeen } = payload;
          setUsers(prev => {
            if (!prev[userId]) return prev;
            return {
              ...prev,
              [userId]: {
                ...prev[userId],
                isOnline,
                lastSeen: lastSeen || new Date().toISOString()
              }
            };
          });
        }

        else if (type === "new_user_registered") {
          const { user: registeredUser } = payload;
          setUsers(prev => ({
            ...prev,
            [registeredUser.id]: registeredUser
          }));
        }

        else if (type === "message_edited") {
          const { messageId, chatId, newContent } = payload;
          setMessages(prev => {
            const chatMsgs = prev[chatId] || [];
            return {
              ...prev,
              [chatId]: chatMsgs.map(m => m.id === messageId ? { ...m, content: newContent, isEdited: true } : m)
            };
          });
        }

        else if (type === "message_deleted") {
          const { messageId, chatId, deleteType, userId } = payload;
          setMessages(prev => {
            const chatMsgs = prev[chatId] || [];
            if (deleteType === 'everyone') {
              return {
                ...prev,
                [chatId]: chatMsgs.filter(m => m.id !== messageId)
              };
            } else {
              return {
                ...prev,
                [chatId]: chatMsgs.map(m => {
                  if (m.id === messageId) {
                    const deletedFor = m.deletedFor || [];
                    if (!deletedFor.includes(userId)) {
                      return { ...m, deletedFor: [...deletedFor, userId] };
                    }
                  }
                  return m;
                })
              };
            }
          });
        }

        else if (type === "message_pinned") {
          const { messageId, chatId, isPinned } = payload;
          setMessages(prev => {
            const chatMsgs = prev[chatId] || [];
            return {
              ...prev,
              [chatId]: chatMsgs.map(m => m.id === messageId ? { ...m, isPinned } : m)
            };
          });
        }

        else if (type === "messages_read") {
          const { chatId } = payload;
          setMessages(prev => {
            const chatMsgs = prev[chatId] || [];
            return {
              ...prev,
              [chatId]: chatMsgs.map(m => m.senderId === currentUser.id ? { ...m, status: 'read' } : m)
            };
          });
        }

        else if (type === "user_filtered_status") {
          const { userId, isFiltered } = payload;
          setUsers(prev => {
            if (!prev[userId]) return prev;
            return {
              ...prev,
              [userId]: {
                ...prev[userId],
                isFiltered
              }
            };
          });
        }

        else if (type === "filtered_by_admin") {
          alert("حساب کاربری شما توسط مدیریت فیلتر (مسدود) شده است.");
          setCurrentUser(null);
          setPrivateKey("");
          localStorage.removeItem("parham_user");
          localStorage.removeItem("parham_private_key");
          localStorage.removeItem("parham_session_id");
        }

        else if (type === "session_terminated") {
          alert(payload?.message || "نشست شما منقضی یا از طرف دستگاه دیگری قطع گردید.");
          setCurrentUser(null);
          setPrivateKey("");
          localStorage.removeItem("parham_user");
          localStorage.removeItem("parham_private_key");
          localStorage.removeItem("parham_session_id");
          if (currentUser) {
            localStorage.removeItem(`e2e_priv_${currentUser.id}`);
          }
        }

        else if (type === "session_established") {
          if (payload?.sessionId) {
            localStorage.setItem("parham_session_id", payload.sessionId);
          }
        }

        else if (type === "error") {
          alert(payload.message);
        }

        else if (type === "call_signal") {
          const { senderUserId, signalType, data } = payload;
          handleIncomingCallSignal(senderUserId, signalType, data);
        }

      } catch (err) {
        console.error("Failed to parse incoming WS message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WS Closed. Reconnecting in 3s...");
      setTimeout(() => {
        if (currentUser) {
          setReconnectCounter(prev => prev + 1);
        }
      }, 3000);
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [currentUser, privateKey, reconnectCounter]);

  // Scroll message container
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatId]);

  // Synchronize mark_read delivery status
  useEffect(() => {
    if (activeChatId && currentUser && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "mark_read",
        payload: { chatId: activeChatId, userId: currentUser.id }
      }));
    }
  }, [activeChatId, messages[activeChatId || ""]?.length]);

  // Auto-bind media streams to video elements whenever they render
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState, callType]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState, callType]);

  // Clean up any active call on component unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (e) { console.error("Error stopping track on unmount", e); }
        });
      }
      if (peerConnectionRef.current) {
        try { peerConnectionRef.current.close(); } catch (e) { console.error("Error closing peer conn on unmount", e); }
      }
    };
  }, []);

  // Trigger typing status update to WebSocket
  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);

    if (!isTyping && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeChatId) {
      setIsTyping(true);
      wsRef.current.send(JSON.stringify({
        type: "typing",
        payload: { chatId: activeChatId, isTyping: true }
      }));
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeChatId) {
        setIsTyping(false);
        wsRef.current.send(JSON.stringify({
          type: "typing",
          payload: { chatId: activeChatId, isTyping: false }
        }));
      }
    }, 1500);
  };

  // --------------------------------------------------------------------------
  // HIGH-PERFORMANCE PERSISTENT OUTGOING MESSAGE QUEUE SYSTEM
  // --------------------------------------------------------------------------
  const outgoingQueueRef = useRef<OutgoingQueueItem[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);

  const syncQueueToStorage = () => {
    try {
      localStorage.setItem("parham_messenger_outgoing_queue", JSON.stringify(outgoingQueueRef.current));
    } catch (e) {}
  };

  const processOutgoingQueue = async () => {
    if (isProcessingQueueRef.current) return;
    if (outgoingQueueRef.current.length === 0) return;

    isProcessingQueueRef.current = true;

    try {
      const queueSnapshot = [...outgoingQueueRef.current];

      for (const item of queueSnapshot) {
        if (item.status === 'sent') {
          outgoingQueueRef.current = outgoingQueueRef.current.filter(i => i.id !== item.id);
          syncQueueToStorage();
          continue;
        }

        let delivered = false;

        // 1. Send via WebSocket if socket is open
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({
              type: "send_message",
              payload: {
                msg: {
                  id: item.id,
                  chatId: item.chatId,
                  content: item.content,
                  type: item.type,
                  voiceDuration: item.voiceDuration,
                  fileUrl: item.fileUrl,
                  fileName: item.fileName,
                  fileSize: item.fileSize,
                  fileType: item.fileType,
                  isEncrypted: item.isEncrypted,
                  replyToId: item.replyToId
                }
              }
            }));
          } catch (err) {
            console.warn("WS queue send error:", err);
          }
        }

        // 2. Direct HTTP Endpoint call (guarantees delivery even if WS is flickering)
        try {
          const res = await fetch("/api/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderId: item.senderId,
              msg: {
                id: item.id,
                chatId: item.chatId,
                content: item.content,
                type: item.type,
                voiceDuration: item.voiceDuration,
                fileUrl: item.fileUrl,
                fileName: item.fileName,
                fileSize: item.fileSize,
                fileType: item.fileType,
                isEncrypted: item.isEncrypted,
                replyToId: item.replyToId
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              delivered = true;
            }
          }
        } catch (err) {
          console.warn("HTTP queue send error:", err);
        }

        if (delivered) {
          item.status = 'sent';
          outgoingQueueRef.current = outgoingQueueRef.current.filter(i => i.id !== item.id);
          syncQueueToStorage();

          setMessages(prev => {
            const chatMsgs = prev[item.chatId] || [];
            return {
              ...prev,
              [item.chatId]: chatMsgs.map(m => m.id === item.id ? { ...m, status: 'sent' } : m)
            };
          });
        } else {
          item.retries = (item.retries || 0) + 1;
          syncQueueToStorage();
        }
      }
    } finally {
      isProcessingQueueRef.current = false;
    }
  };

  // Queue restoration & continuous worker loop
  useEffect(() => {
    try {
      const saved = localStorage.getItem("parham_messenger_outgoing_queue");
      if (saved) {
        const parsed: OutgoingQueueItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          outgoingQueueRef.current = parsed;
          setMessages(prev => {
            const updated = { ...prev };
            parsed.forEach(item => {
              const chatMsgs = updated[item.chatId] || [];
              if (!chatMsgs.some(m => m.id === item.id)) {
                const restoredMsg: Message = {
                  id: item.id,
                  chatId: item.chatId,
                  senderId: item.senderId,
                  senderNickname: item.senderNickname,
                  content: item.rawContent || item.content,
                  timestamp: item.timestamp,
                  reactions: {},
                  type: item.type,
                  voiceDuration: item.voiceDuration,
                  fileUrl: item.fileUrl,
                  fileName: item.fileName,
                  fileSize: item.fileSize,
                  fileType: item.fileType,
                  isEncrypted: item.isEncrypted,
                  status: 'sending',
                  replyToId: item.replyToId
                };
                updated[item.chatId] = [...chatMsgs, restoredMsg];
              }
            });
            return updated;
          });
          processOutgoingQueue();
        }
      }
    } catch (e) {}

    const interval = setInterval(() => {
      if (outgoingQueueRef.current.length > 0) {
        processOutgoingQueue();
      }
    }, 2000);

    const handleOnline = () => {
      processOutgoingQueue();
    };

    window.addEventListener("online", handleOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const enqueueAndSendMessage = async (params: {
    chatId: string;
    type: 'text' | 'file' | 'voice';
    rawText: string;
    encryptedText: string;
    isEncrypted: boolean;
    voiceDuration?: number;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    replyToId?: string;
  }) => {
    if (!currentUser) return;

    const tempId = "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    const queueItem: OutgoingQueueItem = {
      id: tempId,
      chatId: params.chatId,
      senderId: currentUser.id,
      senderNickname: currentUser.nickname,
      content: params.encryptedText,
      rawContent: params.rawText,
      type: params.type,
      voiceDuration: params.voiceDuration,
      fileUrl: params.fileUrl,
      fileName: params.fileName,
      fileSize: params.fileSize,
      fileType: params.fileType,
      isEncrypted: params.isEncrypted,
      status: 'sending',
      replyToId: params.replyToId,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    const optimisticMsg: Message = {
      id: tempId,
      chatId: params.chatId,
      senderId: currentUser.id,
      senderNickname: currentUser.nickname,
      content: params.rawText,
      timestamp: queueItem.timestamp,
      reactions: {},
      type: params.type,
      voiceDuration: params.voiceDuration,
      fileUrl: params.fileUrl,
      fileName: params.fileName,
      fileSize: params.fileSize,
      fileType: params.fileType,
      isEncrypted: params.isEncrypted,
      status: 'sending',
      replyToId: params.replyToId
    };

    // Instant local render
    setMessages(prev => {
      const chatMsgs = prev[params.chatId] || [];
      return {
        ...prev,
        [params.chatId]: [...chatMsgs, optimisticMsg]
      };
    });

    setChats(prev => prev.map(c => {
      if (c.id === params.chatId) {
        return {
          ...c,
          lastMessageText: params.type === 'text' ? params.rawText : `[${params.type === 'voice' ? 'پیام صوتی' : 'فایل'}]`,
          lastMessageTime: queueItem.timestamp
        };
      }
      return c;
    }));

    setTimeout(scrollToBottom, 50);

    outgoingQueueRef.current.push(queueItem);
    syncQueueToStorage();
    processOutgoingQueue();
  };

  // OPTIMISTIC ZERO-LATENCY RELIABLE MESSAGE SUBMIT
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || !activeChatId || !currentUser) return;

    const rawText = textInput.trim();
    setTextInput("");

    if (editingMessage) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "edit_message",
          payload: {
            messageId: editingMessage.id,
            chatId: activeChatId,
            newContent: rawText
          }
        }));
      }
      setEditingMessage(null);
      return;
    }

    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const chatKey = "CHAT_KEY_" + activeChat.id;
    const encryptedText = await encryptMessage(rawText, chatKey);
    const replyId = replyingToMessage?.id;
    setReplyingToMessage(null);

    await enqueueAndSendMessage({
      chatId: activeChatId,
      type: 'text',
      rawText,
      encryptedText,
      isEncrypted: true,
      replyToId: replyId
    });
  };

  // CHUNKED HIGH-SPEED FILE UPLOAD
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId || !currentUser) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSpeed("آپلود پرسرعت...");

    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = "upload_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    const startTime = Date.now();

    try {
      let finalData: any = null;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const blobChunk = file.slice(start, end);

        // Convert blob chunk to base64
        const chunkData = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blobChunk);
        });

        const response = await fetch("/api/upload-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadId,
            chunkIndex,
            totalChunks,
            fileName: file.name,
            fileType: file.type,
            chunkData
          })
        });

        if (!response.ok) {
          throw new Error("ارسال بخشی از فایل با خطا مواجه شد.");
        }

        const resData = await response.json();
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setUploadProgress(progress);

        // Calculate dynamic upload speed
        const timeElapsed = (Date.now() - startTime) / 1000; // seconds
        if (timeElapsed > 0.1) {
          const speedMbps = ((end * 8) / (1024 * 1024 * timeElapsed)).toFixed(1);
          setUploadSpeed(`${speedMbps} Mbps`);
        }

        if (resData.completed) {
          finalData = resData;
        }
      }

      if (finalData) {
        await enqueueAndSendMessage({
          chatId: activeChatId,
          type: 'file',
          rawText: `فایل ارسالی: ${file.name}`,
          encryptedText: `فایل ارسالی: ${file.name}`,
          isEncrypted: false,
          fileUrl: finalData.fileUrl,
          fileName: finalData.fileName,
          fileSize: finalData.fileSize,
          fileType: finalData.fileType
        });
      }

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadSpeed("");
      }, 1000);

    } catch (err) {
      console.error("Chunk upload error:", err);
      alert("خطا در آپلود فایل حجیم: " + (err instanceof Error ? err.message : String(err)));
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSpeed("");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // SIMULATED/REAL HIGH-FIDELITY VOICE RECORDER
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        if (!currentUser || !activeChatId) return;

        setIsUploading(true);
        setUploadProgress(10);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            
            const response = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: `voice_${Date.now()}.webm`,
                fileType: "audio/webm",
                fileData: base64data,
                userId: currentUser.id
              })
            });

            const data = await response.json();
            if (response.ok && data.success) {
              const duration = recordDurationRef.current || 3;
              await enqueueAndSendMessage({
                chatId: activeChatId,
                type: 'voice',
                rawText: `پیام صوتی (${duration} ثانیه)`,
                encryptedText: `پیام صوتی (${duration} ثانیه)`,
                isEncrypted: false,
                voiceDuration: duration,
                fileUrl: data.fileUrl
              });
            }
            setIsUploading(false);
            setUploadProgress(0);
          };
          reader.readAsDataURL(audioBlob);
        } catch (err) {
          console.error("Failed to upload recorded voice", err);
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      recordDurationRef.current = 0;
      recordIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => {
          const next = prev + 1;
          recordDurationRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("خطا در دسترسی به میکروفون! لطفاً دسترسی به میکروفون را تایید کنید.");
    }
  };

  const stopVoiceRecording = async () => {
    clearInterval(recordIntervalRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  // AUDIO PLAYBACK MANAGEMENT
  const toggleAudioPlay = (msgId: string, url: string) => {
    if (playingAudioId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      clearInterval(audioIntervalRef.current);
      setPlayingAudioId(null);
    } else {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      clearInterval(audioIntervalRef.current);

      const audio = new Audio(url);
      activeAudioRef.current = audio;
      setPlayingAudioId(msgId);
      setAudioProgress(prev => ({ ...prev, [msgId]: prev[msgId] || 0 }));

      audio.play().catch(err => console.error("Audio playback error", err));

      audioIntervalRef.current = setInterval(() => {
        if (audio.ended) {
          clearInterval(audioIntervalRef.current);
          setPlayingAudioId(null);
          setAudioProgress(prev => ({ ...prev, [msgId]: 0 }));
          activeAudioRef.current = null;
        } else {
          const progress = (audio.currentTime / audio.duration) * 100;
          setAudioProgress(prev => ({
            ...prev,
            [msgId]: isNaN(progress) ? 0 : progress
          }));
        }
      }, 100);
    }
  };

  // EMOJI MESSAGE REACTION DISPATCH
  const handleReactToMessage = (messageId: string, emoji: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "add_reaction",
        payload: { messageId, emoji }
      }));
    }
  };

  // ADVANCED SEARCH
  const triggerAdvancedSearch = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          query: advancedSearchQuery,
          type: searchingMedia,
          chatId: activeChatId
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.results || []);
      }
    } catch (e) {
      console.error("Search query failed", e);
    }
  };

  useEffect(() => {
    if (advancedSearchQuery || searchingMedia !== 'all') {
      triggerAdvancedSearch();
    } else {
      setSearchResults([]);
    }
  }, [advancedSearchQuery, searchingMedia, activeChatId]);

  // CHAT CREATION HANDLER
  const handleCreateChat = (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "create_chat",
        payload
      }));
      setShowNewChat(false);
    }
  };

  // UNBLOCK USER HANDLER
  const handleUnblockUser = async (blockedId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/unblock-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, blockId: blockedId })
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error("Unblock failed", e);
    }
  };

  // BLOCK USER HANDLER
  const handleBlockActiveUser = async () => {
    if (!currentUser || !activeChatId) return;
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat || activeChat.type !== 'direct') return;

    const targetUserId = activeChat.members.find(m => m !== currentUser.id);
    if (!targetUserId) return;

    try {
      const response = await fetch("/api/block-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, blockId: targetUserId })
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);
        alert("کاربر با موفقیت مسدود شد.");
      }
    } catch (e) {
      console.error("Block failed", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("parham_user");
    localStorage.removeItem("parham_private_key");
    localStorage.removeItem("parham_session_id");
    if (currentUser) {
      localStorage.removeItem(`e2e_priv_${currentUser.id}`);
    }
    setCurrentUser(null);
    setPrivateKey("");
    setChats([]);
    setMessages({});
    setActiveChatId(null);
    setShowSettings(false);
  };

  // DELETE MESSAGE SENDER
  const handleDeleteMessage = (messageId: string, deleteType: 'self' | 'everyone') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeChatId) {
      wsRef.current.send(JSON.stringify({
        type: "delete_message",
        payload: {
          messageId,
          chatId: activeChatId,
          deleteType,
          userId: currentUser.id
        }
      }));
    }
    setActiveMenuMessageId(null);
  };

  // PIN MESSAGE SENDER
  const handlePinMessage = (messageId: string, isPinned: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeChatId) {
      wsRef.current.send(JSON.stringify({
        type: "pin_message",
        payload: {
          messageId,
          chatId: activeChatId,
          isPinned
        }
      }));
    }
    setActiveMenuMessageId(null);
  };

  // FORWARD MESSAGE SENDER
  const handleForwardMessage = async (targetChatId: string) => {
    if (!forwardingMessage || !currentUser) return;

    const targetChat = chats.find(c => c.id === targetChatId);
    if (!targetChat) return;

    // Derive stable chat key for the destination chat
    const targetChatKey = "CHAT_KEY_" + targetChat.id;
    const encryptedText = await encryptMessage(forwardingMessage.content, targetChatKey);

    const tempId = "opt_" + Math.random().toString(36).substring(2, 9);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "send_message",
        payload: {
          msg: {
            id: tempId,
            chatId: targetChatId,
            content: encryptedText,
            type: forwardingMessage.type,
            fileUrl: forwardingMessage.fileUrl,
            fileName: forwardingMessage.fileName,
            fileSize: forwardingMessage.fileSize,
            fileType: forwardingMessage.fileType,
            voiceDuration: forwardingMessage.voiceDuration,
            isEncrypted: forwardingMessage.isEncrypted,
            forwardFromNickname: forwardingMessage.senderNickname
          }
        }
      }));
    }

    setForwardingMessage(null);
    alert(`پیام با موفقیت به گفتگوی «${targetChat.name}» هدایت شد.`);
  };

  // SCROLL TO MESSAGE HELPERS
  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-amber-400', 'scale-[1.02]', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-amber-400', 'scale-[1.02]');
      }, 1500);
    }
  };

  // Filter sidebar chats list based on filter tabs & search input
  const filteredChats = chats.filter(c => {
    // Filter type
    if (chatFilter === 'direct' && c.type !== 'direct') return false;
    if (chatFilter === 'group' && c.type !== 'group') return false;
    if (chatFilter === 'channel' && c.type !== 'channel') return false;

    // Filter search string
    if (chatSearchQuery) {
      return getChatDisplayName(c).toLowerCase().includes(chatSearchQuery.toLowerCase());
    }
    return true;
  });

  const activeChat = chats.find(c => c.id === activeChatId);
  const rawActiveChatMessages = activeChatId ? (messages[activeChatId] || []) : [];
  
  // Filter active chat messages based on delete status and dynamic in-chat query
  const activeChatMessages = rawActiveChatMessages.filter(msg => {
    if (msg.deletedFor && msg.deletedFor.includes(currentUser.id)) {
      return false;
    }
    if (messageSearchQuery) {
      return msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase());
    }
    return true;
  });

  // If user not authenticated, render beautiful Persian sign-up/login
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className={`h-screen flex flex-col font-sans theme-transition overflow-hidden ${activeTheme.mainBg} text-slate-100 dir-rtl`} dir="rtl">
      
      {/* Top Navigation / App Status Bar */}
      <header className={`h-14 shrink-0 px-4 flex items-center justify-between border-b ${activeTheme.borderCol} bg-slate-900/60 backdrop-blur-md relative z-20`}>
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center p-2 rounded-xl border ${activeTheme.borderCol} bg-slate-950/80 ${activeTheme.primaryText}`}>
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black text-white">پلتفرم پیام‌رسان فوق امن پرهام</h1>
            <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>رمزنگاری سراسری فعال است (کلید ۲۵۶ بیتی)</span>
            </p>
          </div>
        </div>

        {/* User Profile Bar - Click opens UserProfileModal */}
        <div className="flex items-center gap-2">
          <div 
            onClick={() => setSelectedProfileUserId(currentUser.id)}
            className="flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 p-1.5 px-3 rounded-2xl cursor-pointer transition shadow-sm group"
            title="مشاهده پروفایل کاربری"
          >
            {currentUser.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.nickname} 
                className="w-8 h-8 rounded-xl object-cover border border-slate-700 shadow-sm shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm shrink-0 ${currentUser.avatarColor || 'bg-slate-800'}`}>
                {currentUser.avatarEmoji || '👤'}
              </div>
            )}
            <div className="hidden sm:flex flex-col text-right">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition">{currentUser.nickname}</span>
                {(currentUser.subscriptionTier === 'plus' || currentUser.role === 'owner') && (
                  <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[8px] font-black shadow-sm flex items-center gap-0.5" title="حساب ویژه Plus">
                    <Crown className="w-2.5 h-2.5 text-amber-300" /> Plus
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-400">@{currentUser.username}</span>
            </div>
          </div>

          {/* Plus Subscription Badge / Upgrade Button */}
          {currentUser.subscriptionTier === 'plus' || currentUser.role === 'owner' ? (
            <button
              onClick={() => openSubscriptionForFeature()}
              className="px-2.5 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 rounded-xl text-[10px] font-black flex items-center gap-1 transition shadow-sm shrink-0"
              title="مشاهده وضعیت اشتراک Plus شما"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Plus ⭐</span>
            </button>
          ) : (
            <button
              onClick={() => openSubscriptionForFeature()}
              className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-[10px] font-black flex items-center gap-1 transition shadow-lg shadow-purple-950/60 shrink-0"
              title="ارتقا به حساب ویژه Plus"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">ارتقا به Plus</span>
            </button>
          )}

          {currentUser.role === "owner" && (
            <button
              onClick={() => setShowAdminDashboard(true)}
              className="p-2 bg-amber-600/15 hover:bg-amber-600 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:text-white rounded-xl transition shadow-md flex items-center gap-1.5 shrink-0"
              title="پنل مدیریت کل سیستم (پرهام)"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400 group-hover:text-white" />
              <span className="text-[10px] font-black hidden sm:inline">مدیریت سیستم</span>
            </button>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition shadow-md"
            title="تنظیمات، پوسته و حریم خصوصی"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* SIDEBAR: CHAT LIST */}
        <aside className={`w-full sm:w-80 shrink-0 border-l ${activeTheme.borderCol} ${activeTheme.sidebarBg} flex flex-col h-full z-10 ${activeChatId ? 'hidden sm:flex' : 'flex'}`}>
          
          {/* Chats search */}
          <div className="p-3 space-y-2.5">
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="جستجو در گفتگوها..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className={`w-full pr-10 pl-4 py-2 bg-slate-950 border ${activeTheme.borderCol} rounded-2xl text-xs text-slate-200 focus:outline-none focus:ring-1 ${activeTheme.ringCol} transition`}
              />
            </div>

            {/* Quick Actions / New chat trigger */}
            <button
              onClick={() => setShowNewChat(true)}
              className={`w-full py-2.5 ${activeTheme.primaryBg} ${activeTheme.primaryHoverBg} text-xs font-black rounded-2xl transition flex items-center justify-center gap-2 shadow-md`}
            >
              <span>ایجاد گروه، کانال یا چت جدید</span>
            </button>
          </div>

          {/* Chat Category Filtering Tabs */}
          <div className="flex px-3 pb-2.5 gap-1 border-b border-slate-800/80">
            {['all', 'direct', 'group', 'channel'].map(tab => (
              <button
                key={tab}
                onClick={() => setChatFilter(tab as any)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${chatFilter === tab ? `${activeTheme.primaryBg} text-white shadow-sm` : 'text-slate-400 hover:text-slate-300'}`}
              >
                {tab === 'all' && 'همه'}
                {tab === 'direct' && 'خصوصی'}
                {tab === 'group' && 'گروه‌ها'}
                {tab === 'channel' && 'کانال‌ها'}
              </button>
            ))}
          </div>

          {/* Chats scroll list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredChats.length > 0 ? (
              filteredChats.map(c => {
                const isActive = c.id === activeChatId;
                
                // Get other user's presence and profile info if it is a direct chat
                let isDirectOnline = false;
                let otherUser: any = null;
                if (c.type === 'direct') {
                  const otherUserId = c.members.find(m => m !== currentUser.id);
                  if (otherUserId && users[otherUserId]) {
                    otherUser = users[otherUserId];
                    isDirectOnline = otherUser.isOnline;
                  }
                }

                // Check active typing indicator
                const typingMap = typingUsers[c.id] || {};
                const typingUsernames = Object.values(typingMap);
                const isSomeoneTyping = typingUsernames.length > 0;

                const chatMsgs = messages[c.id] || [];
                const unreadCount = chatMsgs.filter(m => m.senderId !== currentUser?.id && m.status !== "read").length;

                return (
                  <button
                    key={c.id}
                    onClick={() => { setActiveChatId(c.id); setShowAdvancedSearch(false); }}
                    className={`w-full text-right p-3 rounded-2xl border transition flex items-center justify-between group relative ${isActive ? activeTheme.activeItemBg : 'bg-transparent border-transparent hover:bg-slate-800/30'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      
                      {/* Avatar with live status dot */}
                      <div className="relative shrink-0">
                        {otherUser?.avatarUrl ? (
                          <img 
                            src={otherUser.avatarUrl} 
                            alt={getChatDisplayName(c)} 
                            className="w-10 h-10 rounded-2xl object-cover shadow-md"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-md ${c.avatarColor || 'bg-slate-800'}`}>
                            {c.avatarEmoji || '💬'}
                          </div>
                        )}
                        {isDirectOnline && (
                          <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate max-w-[120px]">{getChatDisplayName(c)}</span>
                          {c.type === 'group' && (
                            <span className="px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-black flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" />
                              {(c.members?.length || 1)} عضو
                            </span>
                          )}
                          {c.type === 'channel' && (
                            <span className="px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-black flex items-center gap-1">
                              <Radio className="w-2.5 h-2.5" />
                              کانال
                            </span>
                          )}
                        </div>
                        
                        {isSomeoneTyping ? (
                          <span className="text-[10px] text-emerald-400 font-medium animate-pulse block truncate">
                            {typingUsernames[0]} در حال نوشتن...
                          </span>
                        ) : (
                          <p className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5">
                            {c.description || c.lastMessageText || 'گروه گفتگوی اعضا'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left shrink-0 flex flex-col items-end gap-1.5">
                      <span className="text-[9px] text-slate-500">
                        {c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {unreadCount > 0 && (
                        <span className={`text-[10px] min-w-[18px] h-4.5 px-1.5 rounded-full flex items-center justify-center font-black ${activeTheme.badgeBg} animate-pulse`}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs leading-relaxed">
                گفتگویی یافت نشد.<br/>
                کلید بالا را برای ایجاد چت بفشارید!
              </div>
            )}
          </div>
        </aside>

        {/* ACTIVE CONVERSATION WINDOW */}
        <main className={`flex-1 flex flex-row h-full overflow-hidden ${activeTheme.chatWallpaper} relative ${activeChatId ? 'flex' : 'hidden sm:flex'}`}>
          
          {activeChat ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Active chat header */}
              <div className="h-14 shrink-0 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-4 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  {/* Back button on mobile */}
                  <button
                    onClick={() => setActiveChatId(null)}
                    className="sm:hidden p-1.5 -mr-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
                    title="بازگشت به گفتگوها"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div
                    onClick={() => {
                      if (activeChat.type === 'direct') {
                        const otherId = activeChat.members.find(m => m !== currentUser.id);
                        if (otherId) setSelectedProfileUserId(otherId);
                      } else {
                        setSelectedProfileGroupId(activeChat.id);
                      }
                    }}
                    className="flex items-center gap-3 cursor-pointer group select-none hover:opacity-90 transition"
                    title="نمایش اطلاعات کامل پروفایل"
                  >
                    {(() => {
                      const isDirect = activeChat.type === 'direct';
                      const otherUserId = isDirect ? activeChat.members.find(m => m !== currentUser.id) : null;
                      const otherUser = otherUserId ? users[otherUserId] : null;

                      if (isDirect && otherUser?.avatarUrl) {
                        return (
                          <img 
                            src={otherUser.avatarUrl} 
                            alt={getChatDisplayName(activeChat)} 
                            className="w-10 h-10 rounded-2xl object-cover shadow-md group-hover:ring-2 group-hover:ring-indigo-500/50 transition"
                            referrerPolicy="no-referrer"
                          />
                        );
                      } else {
                        return (
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${activeChat.avatarColor} group-hover:scale-105 transition`}>
                            {activeChat.avatarEmoji}
                          </div>
                        );
                      }
                    })()}
                    <div>
                      <h3 className="text-xs font-bold text-white group-hover:text-indigo-400 group-hover:underline transition">{getChatDisplayName(activeChat)}</h3>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        {(() => {
                          const activeChatTypingMap = typingUsers[activeChat.id] || {};
                          const activeChatTypingUsernames = Object.values(activeChatTypingMap);
                          const isSomeoneTypingInActiveChat = activeChatTypingUsernames.length > 0;

                          if (isSomeoneTypingInActiveChat) {
                            return (
                              <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black">
                                <span>{activeChatTypingUsernames[0]} در حال نوشتن</span>
                                <span className="flex gap-0.5 items-center mt-1">
                                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></span>
                                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></span>
                                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></span>
                                </span>
                              </span>
                            );
                          }

                          return activeChat.type === 'direct' ? (
                            (() => {
                              const otherId = activeChat.members.find(m => m !== currentUser.id);
                              const otherUser = otherId ? users[otherId] : null;
                              return otherUser?.isOnline ? (
                                <span className="text-emerald-400 font-bold">● آنلاین</span>
                              ) : (
                                <span>آفلاین (آخرین بازدید اخیراً)</span>
                              );
                            })()
                          ) : (
                            <span>{activeChat.members.length} عضو فعال</span>
                          );
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (currentUser?.subscriptionTier !== 'plus' && currentUser?.role !== 'owner') {
                        openSubscriptionForFeature("گفتگوی صوتی با AI");
                      } else {
                        setShowGeminiLive(true);
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 hover:text-white transition shadow-sm"
                    title="گفتگوی صوتی زنده با هوش مصنوعی (جمنای لایو)"
                  >
                    <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <span className="hidden sm:inline text-xs font-bold font-sans">جمنای لایو</span>
                  </button>

                  <button
                    onClick={() => setShowAiAssistant(!showAiAssistant)}
                    className={`p-2 rounded-xl border transition ${showAiAssistant ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
                    title="تحلیل گفتگو و دستیار هوش مصنوعی پرهام"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </button>

                  <button
                    onClick={() => setIsMessageSearching(!isMessageSearching)}
                    className={`p-2 rounded-xl border transition ${isMessageSearching ? 'bg-amber-600/10 border-amber-500/30 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
                    title="جستجوی سریع پیام‌ها"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className={`p-2 rounded-xl border transition ${showAdvancedSearch ? `${activeTheme.activeItemBg} ${activeTheme.primaryText}` : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
                    title="ابر جستجوی رسانه و فایل"
                  >
                    <Filter className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => initiateCall('audio')}
                    className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition flex items-center justify-center"
                    title="تماس صوتی رمزنگاری شده"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => initiateCall('video')}
                    className="p-2 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-xl transition flex items-center justify-center"
                    title="تماس تصویری زنده HD"
                  >
                    <Video className="w-4 h-4" />
                  </button>

                  {activeChat.type === 'direct' && (
                    <>
                      <button
                        onClick={handleBlockActiveUser}
                        className="p-2 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition flex items-center justify-center"
                        title="مسدود کردن این کاربر"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* SEARCH PANEL OVERLAY */}
              <AnimatePresence>
                {showAdvancedSearch && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-14 left-0 right-0 bg-slate-900/95 border-b border-slate-800 p-4 z-20 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative">
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          placeholder="کلمه کلیدی یا نام فایل را بنویسید..."
                          value={advancedSearchQuery}
                          onChange={(e) => setAdvancedSearchQuery(e.target.value)}
                          className="w-full pr-9 pl-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                        />
                      </div>

                      {/* Type Filter */}
                      <div className="flex gap-1.5 shrink-0 bg-slate-950 p-1 rounded-xl">
                        {['all', 'media', 'voice', 'file'].map(type => (
                          <button
                            key={type}
                            onClick={() => setSearchingMedia(type as any)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition ${searchingMedia === type ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            {type === 'all' && 'همه'}
                            {type === 'media' && 'رسانه'}
                            {type === 'voice' && 'ویس‌ها'}
                            {type === 'file' && 'فایل‌ها'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Search Results */}
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-0.5">
                      {searchResults.length > 0 ? (
                        searchResults.map(msg => (
                          <div key={msg.id} className="p-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span className="font-bold text-slate-400">{msg.senderNickname}</span>
                              <span>{new Date(msg.timestamp).toLocaleString('fa-IR')}</span>
                            </div>
                            <p className="text-slate-200">{msg.content}</p>
                            {msg.fileUrl && (
                              <a
                                href={msg.fileUrl}
                                download={msg.fileName}
                                className="inline-flex items-center gap-1.5 text-[10px] text-sky-400 hover:underline pt-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>دانلود فایل ({msg.fileName})</span>
                              </a>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-slate-500 text-[10px]">
                          {advancedSearchQuery ? 'هیچ پیام یا رسانه‌ای یافت نشد.' : 'شروع به نوشتن کنید تا نتایج ابر جستجو نمایش داده شوند...'}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FAST IN-CHAT MESSAGE SEARCH BAR */}
              {isMessageSearching && (
                <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between gap-2 relative z-10">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="جستجوی متن پیام در این گفتگو..."
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 transition text-right"
                      dir="rtl"
                      autoFocus
                    />
                    {messageSearchQuery && (
                      <button
                        onClick={() => setMessageSearchQuery("")}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[10px]"
                      >
                        پاک کردن
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setIsMessageSearching(false);
                      setMessageSearchQuery("");
                    }}
                    className="text-xs text-slate-400 hover:text-white transition"
                  >
                    بستن
                  </button>
                </div>
              )}

              {/* PINNED MESSAGES HEADER BANNER */}
              {(() => {
                const pinnedMsgs = rawActiveChatMessages.filter(m => m.isPinned);
                if (pinnedMsgs.length === 0) return null;
                const latestPinned = pinnedMsgs[pinnedMsgs.length - 1];
                return (
                  <div className="px-4 py-1.5 bg-slate-900/60 border-b border-slate-800/40 backdrop-blur flex items-center justify-between gap-3 relative z-10">
                    <div 
                      className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                      onClick={() => scrollToMessage(latestPinned.id)}
                    >
                      <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 rotate-45" />
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-amber-400 block">پیام سنجاق شده</span>
                        <span className="text-[10px] text-slate-300 truncate block">{latestPinned.content || "[فایل / صوتی]"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePinMessage(latestPinned.id, false)}
                      className="text-slate-400 hover:text-rose-400 p-1"
                      title="برداشتن سنجاق"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}

              {/* Message List area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 relative">
                
                {/* Description greeting for empty chats */}
                {activeChatMessages.length === 0 && (
                  <div className="max-w-md mx-auto text-center py-10 bg-slate-900/40 rounded-3xl border border-slate-800/60 p-6 space-y-3 mt-10">
                    <Sparkles className={`w-8 h-8 ${isRedTheme ? 'text-red-400' : 'text-blue-400'} mx-auto animate-pulse`} />
                    <h4 className="text-xs font-black text-white">{getChatDisplayName(activeChat)}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {activeChat.description || "هیچ پیامی در این گفتگو یافت نشد. اولین پیام رمزنگاری شده سرتاسری را بفرستید!"}
                    </p>
                    <div className={`p-2 ${isRedTheme ? 'bg-red-500/5 border-red-500/10 text-red-300' : 'bg-blue-500/5 border-blue-500/10 text-blue-300'} rounded-xl border text-[10px]`}>
                      🛡️ تمام محتویات متنی با رمزنگاری پیشرفته RSA-256 محافظت می‌شوند.
                    </div>
                  </div>
                )}

                {/* Message iteration */}
                {activeChatMessages.map((msg, idx) => {
                  const isOwn = msg.senderId === currentUser.id;
                  const msgSenderUser = isOwn ? currentUser : users[msg.senderId];
                  const bubbleFrame = msgSenderUser?.bubbleBorderFrame || 'default';

                  const getFrameStyle = (frame: string) => {
                    switch (frame) {
                      case 'heart':
                        return {
                          cls: 'border-pink-500/80 shadow-[0_0_12px_rgba(236,72,153,0.35)] ring-1 ring-pink-500/30',
                          decorations: (
                            <>
                              <span className="absolute -top-1 -right-1 text-xs animate-bounce pointer-events-none select-none z-10">💖</span>
                              <span className="absolute -bottom-0.5 -left-0.5 text-[9px] opacity-80 pointer-events-none select-none z-10">💕</span>
                            </>
                          )
                        };
                      case 'fiery':
                        return {
                          cls: 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-1 ring-orange-500/40',
                          decorations: (
                            <>
                              <span className="absolute -top-1 -right-1 text-xs animate-pulse pointer-events-none select-none z-10">🔥</span>
                              <span className="absolute -bottom-0.5 -left-0.5 text-[9px] animate-pulse pointer-events-none select-none z-10">✨</span>
                            </>
                          )
                        };
                      case 'bow':
                        return {
                          cls: 'border-fuchsia-400/80 shadow-[0_0_12px_rgba(232,121,249,0.35)] ring-1 ring-purple-400/30',
                          decorations: (
                            <>
                              <span className="absolute -top-1.5 -right-1 text-xs pointer-events-none select-none z-10">🎀</span>
                              <span className="absolute -bottom-0.5 -left-0.5 text-[9px] pointer-events-none select-none z-10">🎀</span>
                            </>
                          )
                        };
                      case 'emerald_glow':
                        return {
                          cls: 'border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.4)] ring-1 ring-emerald-500/40',
                          decorations: (
                            <>
                              <span className="absolute -top-1 -right-1 text-xs animate-pulse pointer-events-none select-none z-10">✨</span>
                              <span className="absolute -bottom-0.5 -left-0.5 text-[9px] pointer-events-none select-none z-10">💎</span>
                            </>
                          )
                        };
                      case 'cyber_neon':
                        return {
                          cls: 'border-cyan-400/80 shadow-[0_0_16px_rgba(6,182,212,0.45)] ring-1 ring-cyan-400/50',
                          decorations: (
                            <>
                              <span className="absolute -top-1 -right-1 text-xs animate-pulse pointer-events-none select-none z-10">⚡</span>
                              <span className="absolute -bottom-0.5 -left-0.5 text-[9px] pointer-events-none select-none z-10">🌐</span>
                            </>
                          )
                        };
                      default:
                        return { cls: '', decorations: null };
                    }
                  };
                  const frameInfo = getFrameStyle(bubbleFrame);
                  
                  return (
                    <motion.div 
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.08, ease: "easeOut" }}
                      className={`flex flex-col ${isOwn ? 'items-start' : 'items-end'} space-y-1 relative`}
                    >
                      {/* Sender Nickname */}
                      {!isOwn && (
                        <div 
                          onClick={() => setSelectedProfileUserId(msg.senderId)}
                          className="flex items-center gap-1.5 mr-1 mb-0.5 cursor-pointer hover:opacity-80 transition group"
                          title="مشاهده پروفایل کاربری"
                        >
                          <span className="text-[10px] text-slate-400 font-bold group-hover:text-indigo-400 group-hover:underline">{msg.senderNickname}</span>
                          {(() => {
                            const senderUser = users[msg.senderId];
                            if (!senderUser) return null;
                            const isOwner = senderUser.role === "owner" || senderUser.username?.toLowerCase() === "parham";
                            const isAdmin = senderUser.role === "admin";
                            return (
                              <>
                                {isOwner && (
                                  <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] rounded font-black">
                                    👑 مالک سیستم
                                  </span>
                                )}
                                {isAdmin && (
                                  <span className="px-1.5 py-0.2 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] rounded font-black">
                                    🛡️ مدیر ارشد
                                  </span>
                                )}
                                {senderUser.customTitle && (
                                  <span className="px-1.5 py-0.2 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] rounded font-black">
                                    💎 {senderUser.customTitle}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      <div className="flex items-end gap-1.5 max-w-[85%] sm:max-w-[80%] min-w-0 group relative">
                        
                        {/* Option actions and reactions list trigger button */}
                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shrink-0 self-center ${isOwn ? 'order-first' : 'order-last'}`}>
                          <button
                            onClick={() => setReplyingToMessage(msg)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/40 transition shadow"
                            title="پاسخ به این پیام (دوبار کلیک)"
                          >
                            <CornerUpLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/40 transition shadow"
                            title="عملیات پیام"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Quick Reactions list */}
                          <div className="hidden sm:flex items-center gap-0.5 bg-slate-900/60 p-0.5 rounded-lg border border-slate-850">
                            {["👍", "❤️", "🔥", "😂"].map(e => (
                              <button
                                key={e}
                                onClick={() => handleReactToMessage(msg.id, e)}
                                className="p-1 hover:bg-slate-800 rounded text-[10px] transition"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* MESSAGE BUBBLE */}
                        <div 
                          onDoubleClick={() => setReplyingToMessage(msg)}
                          onMouseDown={() => handleMessagePressStart(msg.id)}
                          onMouseUp={() => handleMessagePressEnd(msg.id)}
                          onMouseLeave={() => handleMessagePressEnd(msg.id)}
                          onTouchStart={() => handleMessagePressStart(msg.id)}
                          onTouchEnd={() => handleMessagePressEnd(msg.id)}
                          onTouchMove={() => handleMessagePressEnd(msg.id)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setActiveMenuMessageId(msg.id);
                          }}
                          className={`p-3 rounded-2xl text-xs space-y-1.5 relative shadow-md border cursor-pointer select-text min-w-0 max-w-full ${frameInfo.cls ? `${frameInfo.cls} ${isOwn ? activeTheme.ownBubbleBg : activeTheme.cardBg}` : (isOwn ? `${activeTheme.ownBubbleBg} rounded-tr-none text-right` : `${activeTheme.cardBg} ${activeTheme.borderCol} rounded-tl-none text-right`)} ${isOwn ? 'rounded-tr-none text-right' : 'rounded-tl-none text-right'}`}
                          title="لمس طولانی (۱ ثانیه) یا راست‌کلیک برای عملیات پیام / دوبار کلیک برای پاسخ سریع"
                        >
                          {frameInfo.decorations}
                          
                          {/* Forward From Label */}
                          {msg.forwardFromNickname && (
                            <div className="flex items-center gap-1 mb-1 text-[9px] text-slate-400 border-b border-slate-800/40 pb-0.5 select-none font-medium">
                              <span className="text-amber-400">↪️ هدایت شده از:</span>
                              <span className="font-bold text-slate-300">{msg.forwardFromNickname}</span>
                            </div>
                          )}

                          {/* Reply Quote container if replied message exists */}
                          {msg.replyToId && (() => {
                            const repliedMsg = rawActiveChatMessages.find(m => m.id === msg.replyToId);
                            return (
                              <div 
                                onClick={() => repliedMsg && scrollToMessage(repliedMsg.id)}
                                className="p-1.5 mb-1.5 bg-slate-950/40 border-r-2 border-amber-500 rounded text-[10px] text-slate-300 text-right cursor-pointer hover:bg-slate-950/60 transition block truncate max-w-[200px]"
                              >
                                <span className="font-bold text-amber-400 block text-[8px] mb-0.5">{repliedMsg ? repliedMsg.senderNickname : "پیام حذف شده"}</span>
                                <span className="block truncate">{repliedMsg ? repliedMsg.content || "[فایل / ویس]" : "پیام نامشخص"}</span>
                              </div>
                            );
                          })()}

                          {/* File Display */}
                          {msg.type === 'file' && msg.fileUrl && (() => {
                            const isImage = msg.fileType?.startsWith('image/') || msg.fileName?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
                            const isVideo = msg.fileType?.startsWith('video/') || msg.fileName?.match(/\.(mp4|webm|ogg|mov|mkv|avi|3gp)$/i);
                            const isAudio = msg.fileType?.startsWith('audio/') || msg.fileName?.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i);

                            if (isImage) {
                              return (
                                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 text-right max-w-[280px]">
                                  <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900/40 relative group/img">
                                    <img 
                                      src={msg.fileUrl} 
                                      alt={msg.fileName || "تصویر"} 
                                      className="max-h-48 object-cover w-full cursor-zoom-in hover:scale-102 transition duration-200"
                                      referrerPolicy="no-referrer"
                                      onClick={() => {
                                        setLightboxUrl(msg.fileUrl || null);
                                        setLightboxName(msg.fileName || "تصویر پیش‌نمایش");
                                      }}
                                    />
                                    {/* Overlay with full size zoom hint */}
                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition duration-200 pointer-events-none">
                                      <span className="text-[10px] text-white bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700 font-bold">بزرگنمایی تصویر 🔍</span>
                                    </div>
                                  </div>
                                  <a
                                    href={msg.fileUrl}
                                    download={msg.fileName}
                                    className={`w-full py-1.5 ${activeTheme.primaryBg} ${activeTheme.primaryHoverBg} text-white text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1`}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>دانلود تصویر اصلی</span>
                                  </a>
                                </div>
                              );
                            }

                            if (isVideo) {
                              return (
                                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 text-right max-w-[280px]">
                                  <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 relative max-h-56">
                                    <video 
                                      src={msg.fileUrl} 
                                      controls 
                                      className="max-h-56 w-full object-contain rounded-lg"
                                      preload="metadata"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
                                    <span className="truncate max-w-[150px] font-bold" title={msg.fileName}>{msg.fileName}</span>
                                    <span className="font-mono">{(msg.fileSize ? (msg.fileSize / 1024 / 1024).toFixed(2) : "0")} MB</span>
                                  </div>
                                  <a
                                    href={msg.fileUrl}
                                    download={msg.fileName}
                                    className={`w-full py-1.5 ${activeTheme.primaryBg} ${activeTheme.primaryHoverBg} text-white text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1`}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>دانلود ویدیو با کیفیت کامل</span>
                                  </a>
                                </div>
                              );
                            }

                            if (isAudio) {
                              return (
                                <MusicPlayer
                                  url={msg.fileUrl}
                                  fileName={msg.fileName || "فایل صوتی"}
                                  fileSize={msg.fileSize}
                                />
                              );
                            }

                            // Fallback for regular files
                            return (
                              <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 text-right max-w-[280px]">
                                <div className="flex items-center gap-2.5">
                                  <div className={`p-2.5 ${activeTheme.activeItemBg} ${activeTheme.primaryText} rounded-lg`}>
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0 text-right">
                                    <span className="text-xs font-bold text-white block truncate max-w-[150px]">{msg.fileName}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {(msg.fileSize ? (msg.fileSize / 1024 / 1024).toFixed(2) : "0")} MB
                                    </span>
                                  </div>
                                </div>
                                <a
                                  href={msg.fileUrl}
                                  download={msg.fileName}
                                  className={`w-full py-1.5 ${activeTheme.primaryBg} ${activeTheme.primaryHoverBg} text-white text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>دانلود مستقیم با سرعت بالا</span>
                                </a>
                              </div>
                            );
                          })()}

                          {/* Voice Display */}
                          {msg.type === 'voice' && msg.fileUrl && (
                            <div className="space-y-1.5">
                              <div className="p-2 bg-slate-950/60 border border-slate-800/60 rounded-xl flex items-center gap-2.5 min-w-[200px]">
                                <button
                                  type="button"
                                  onClick={() => toggleAudioPlay(msg.id, msg.fileUrl || "")}
                                  className={`w-8 h-8 rounded-full ${activeTheme.primaryBg} ${activeTheme.primaryHoverBg} text-white flex items-center justify-center shrink-0 transition`}
                                >
                                  {playingAudioId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                                </button>
                                
                                <div className="flex-1 space-y-1 text-right">
                                  {/* Waveform visualizer */}
                                  <div className="flex gap-0.5 items-center h-4 py-0.5">
                                    {Array.from({ length: 18 }).map((_, i) => {
                                      // Generate heights for voice wave
                                      const h = 4 + Math.sin(i * 0.7) * 10;
                                      const isPassed = (audioProgress[msg.id] || 0) > (i * 5.5);
                                      return (
                                        <div
                                          key={i}
                                          style={{ height: `${Math.max(2, h)}px` }}
                                          className={`w-[3px] rounded-full transition ${isPassed ? 'bg-sky-500' : 'bg-slate-600'}`}
                                        />
                                      );
                                    })}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[9px] text-slate-400 font-mono">پیام صوتی • {msg.voiceDuration || 3} ثانیه</span>
                                    <button
                                      type="button"
                                      onClick={() => handleTranscribeVoice(msg.id, msg.fileUrl || "")}
                                      disabled={transcribingIds[msg.id]}
                                      className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 transition"
                                    >
                                      {transcribingIds[msg.id] ? (
                                        <>
                                          <span className="w-2 h-2 border border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                                          <span>در حال تبدیل...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-2.5 h-2.5" />
                                          <span>تبدیل به متن</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {transcriptions[msg.id] && (
                                <div className="p-2 bg-indigo-950/25 border border-indigo-900/35 rounded-lg text-[10px] text-indigo-200 leading-relaxed text-right dir-rtl font-sans select-text">
                                  <strong>📝 متن ویس:</strong> {transcriptions[msg.id]}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Plain text / Encrypted message display */}
                          {msg.type === 'text' && (
                            <div className="space-y-1 text-right min-w-0 break-words">
                              {msg.content.includes("```") ? (
                                parseMarkdownToHtml(msg.content)
                              ) : (
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              )}
                              {translatingIds[msg.id] && (
                                <div className="text-[9px] text-indigo-400 mt-1 flex items-center gap-1 justify-end">
                                  <span className="w-2.5 h-2.5 border border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                                  <span>در حال ترجمه با هوش مصنوعی...</span>
                                </div>
                              )}
                              {translations[msg.id] && (
                                <div className="mt-1 p-2 bg-indigo-950/25 border border-indigo-900/35 rounded-lg text-[10px] text-indigo-200 leading-relaxed text-right font-sans select-text">
                                  <strong>🌍 ترجمه پیام:</strong> {translations[msg.id]}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Reaction badge list */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {Object.entries(msg.reactions).map(([emo, userList]) => (
                                <span 
                                  key={emo} 
                                  className="text-[10px] bg-slate-950/40 border border-slate-850 px-1.5 py-0.5 rounded-lg flex items-center gap-1 select-none"
                                >
                                  <span>{emo}</span>
                                  <span className="font-bold text-slate-500">{(userList as string[]).length}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer with status icon & timestamp */}
                          <div className="flex justify-end items-center gap-1.5 mt-1 text-[9px] text-slate-400">
                            {msg.isEdited && (
                              <span className="text-[8px] text-slate-500 font-bold ml-1">ویرایش شده</span>
                            )}
                            
                            {msg.isPinned && (
                              <Pin className="w-3 h-3 text-amber-400 rotate-45 ml-1 select-none shrink-0" />
                            )}

                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            
                            {isOwn && (
                              <span>
                                {msg.status === 'sending' ? (
                                  <span className="w-2.5 h-2.5 border-1 border-slate-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                                ) : msg.status === 'sent' ? (
                                  <Check className="w-3.5 h-3.5 text-slate-400" />
                                ) : (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                                )}
                              </span>
                            )}
                          </div>

                        </div>

                        {/* MESSAGE DROPDOWN MENU OVERLAY */}
                        {activeMenuMessageId === msg.id && (
                          <div className={`absolute z-30 bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-1.5 w-36 text-right dir-rtl transition-all`} style={{ top: '80%', [isOwn ? 'left' : 'right']: '40px' }}>
                            <button
                              onClick={() => { setReplyingToMessage(msg); setActiveMenuMessageId(null); }}
                              className="w-full text-right px-2.5 py-1.5 hover:bg-slate-800 text-[10px] text-slate-200 rounded-lg transition flex items-center justify-between"
                            >
                              <span>پاسخ دادن</span>
                              <span className="text-slate-500 text-[9px]">Reply</span>
                            </button>
                            
                            <button
                              onClick={() => { navigator.clipboard.writeText(msg.content); alert("متن پیام کپی شد."); setActiveMenuMessageId(null); }}
                              className="w-full text-right px-2.5 py-1.5 hover:bg-slate-800 text-[10px] text-slate-200 rounded-lg transition flex items-center justify-between"
                            >
                              <span>کپی کردن متن</span>
                              <span className="text-slate-500 text-[9px]">Copy</span>
                            </button>

                            {msg.type === 'text' && (
                              <button
                                onClick={() => { handleTranslateMessage(msg.id, msg.content); setActiveMenuMessageId(null); }}
                                className="w-full text-right px-2.5 py-1.5 hover:bg-slate-800 text-[10px] text-indigo-400 rounded-lg transition flex items-center justify-between"
                              >
                                <span>ترجمه با هوش مصنوعی</span>
                                <span className="text-indigo-500/60 text-[9px]">Translate</span>
                              </button>
                            )}

                            {isOwn && msg.type === 'text' && (
                              <button
                                onClick={() => { setEditingMessage(msg); setTextInput(msg.content); setActiveMenuMessageId(null); }}
                                className="w-full text-right px-2.5 py-1.5 hover:bg-slate-800 text-[10px] text-amber-400 rounded-lg transition flex items-center justify-between"
                              >
                                <span>ویرایش پیام</span>
                                <span className="text-amber-500/60 text-[9px]">Edit</span>
                              </button>
                            )}

                            <button
                              onClick={() => { setForwardingMessage(msg); setActiveMenuMessageId(null); }}
                              className="w-full text-right px-2.5 py-1.5 hover:bg-slate-800 text-[10px] text-sky-400 rounded-lg transition flex items-center justify-between"
                            >
                              <span>هدایت کردن</span>
                              <span className="text-sky-500/60 text-[9px]">Forward</span>
                            </button>

                            <button
                              onClick={() => { handlePinMessage(msg.id, !msg.isPinned); setActiveMenuMessageId(null); }}
                              className="w-full text-right px-2.5 py-1.5 hover:bg-slate-800 text-[10px] text-yellow-400 rounded-lg transition flex items-center justify-between"
                            >
                              <span>{msg.isPinned ? "برداشتن سنجاق" : "سنجاق کردن"}</span>
                              <span className="text-yellow-500/60 text-[9px]">{msg.isPinned ? "Unpin" : "Pin"}</span>
                            </button>

                            <div className="border-t border-slate-800/80 my-1"></div>

                            <button
                              onClick={() => { handleDeleteMessage(msg.id, 'self'); setActiveMenuMessageId(null); }}
                              className="w-full text-right px-2.5 py-1.5 hover:bg-slate-800 text-[10px] text-rose-400 rounded-lg transition flex items-center justify-between"
                            >
                              <span>حذف برای خودم</span>
                              <span className="text-rose-400/60 text-[8px]">Delete Self</span>
                            </button>

                            {isOwn && (
                              <button
                                onClick={() => { handleDeleteMessage(msg.id, 'everyone'); setActiveMenuMessageId(null); }}
                                className="w-full text-right px-2.5 py-1.5 hover:bg-slate-800 text-[10px] text-rose-500 rounded-lg transition flex items-center justify-between font-bold"
                              >
                                <span>حذف دوطرفه</span>
                                <span className="text-rose-500/60 text-[8px]">Delete All</span>
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                    </motion.div>
                  );
                })}

                <div ref={messageEndRef} />
              </div>

              {/* CHUNKED FILE UPLOADING TRAY */}
              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="mx-4 p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 relative overflow-hidden"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-white">
                        <span>در حال آپلود فوق‌العاده سریع فایل در ابر...</span>
                        <span className={`font-mono ${isRedTheme ? 'text-red-400' : 'text-blue-400'}`}>{uploadProgress}% ({uploadSpeed})</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div style={{ width: `${uploadProgress}%` }} className={`h-full ${isRedTheme ? 'bg-red-500' : 'bg-blue-500'} transition-all duration-150`} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Input Toolbar / Bar */}
              <div className="p-3 bg-slate-900/60 backdrop-blur-md border-t border-slate-800/80 shrink-0 relative z-10 space-y-2">
                
                {/* AI Smart Suggestions */}
                {smartSuggestions.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto py-1 dir-rtl justify-start items-center select-none">
                    <span className="text-[10px] text-indigo-400 font-bold shrink-0 flex items-center gap-1 bg-indigo-950/50 border border-indigo-900/30 px-2 py-0.5 rounded-lg">
                      <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                      <span>پاسخ هوشمند AI:</span>
                    </span>
                    {smartSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTextInput(s);
                          setSmartSuggestions([]);
                        }}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 hover:text-white hover:bg-indigo-950/25 text-[10px] text-indigo-300 rounded-full transition shrink-0 font-sans cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSmartSuggestions([])}
                      className="text-xs text-slate-500 hover:text-slate-400 font-bold px-1.5 shrink-0"
                    >
                      ×
                    </button>
                  </div>
                )}

                {replyingToMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.12 }}
                    className="flex items-center justify-between px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl mb-2 text-right"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-1 h-7 ${activeTheme.primaryBg} rounded-full shrink-0`} />
                      <div className="min-w-0">
                        <span className={`text-[10px] font-bold ${activeTheme.primaryText} block`}>
                          پاسخ به {replyingToMessage.senderNickname}
                        </span>
                        <span className="text-[11px] text-slate-300 block truncate max-w-[400px]">
                          {replyingToMessage.content || "📁 فایل / ویس / رسانه"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingToMessage(null)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition shrink-0"
                      title="انصراف از پاسخ"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  
                  {/* File attach button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 shrink-0 transition shadow-sm"
                    title="ارسال فایل حجیم"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Text Input area */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="پیام خود را به صورت کاملا سرتاسری رمزنگاری شده بنویسید..."
                      value={textInput}
                      onChange={handleTextInputChange}
                      className={`w-full pr-4 pl-12 py-3 bg-slate-950 border ${activeTheme.borderCol} rounded-2xl text-xs text-slate-100 focus:outline-none focus:ring-1 ${activeTheme.ringCol} transition`}
                    />

                    {/* Rich Emoji Picker Button */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center transition ${showEmojiPicker ? activeTheme.primaryText : 'text-slate-500 hover:text-slate-300'}`}
                      title="انتخاب ایموجی"
                    >
                      <Smile className="w-4.5 h-4.5" />
                    </button>

                    {/* Rich Emoji Picker Popup */}
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <div className="absolute bottom-14 left-0 z-50">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15 }}
                          >
                            <EmojiPicker
                              onSelect={(emoji) => {
                                setTextInput(prev => prev + emoji);
                              }}
                              onClose={() => setShowEmojiPicker(false)}
                            />
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Send and Voice Triggers */}
                  {textInput.trim() ? (
                    <button
                      type="submit"
                      className={`p-3 ${activeTheme.primaryBg} ${activeTheme.primaryHoverBg} text-white rounded-2xl shrink-0 shadow-lg shadow-black/40 hover:scale-105 transition-all duration-150`}
                    >
                      <Send className="w-5 h-5 rotate-180" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (isRecording) {
                          stopVoiceRecording();
                        } else {
                          startVoiceRecording();
                        }
                      }}
                      className={`p-3 rounded-2xl shrink-0 transition-all duration-150 ${isRecording ? 'bg-rose-600 animate-pulse text-white scale-110 ring-4 ring-rose-500/30' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'}`}
                      title={isRecording ? "برای اتمام و ارسال کلیک کنید" : "کلیک کنید تا پیام صوتی ضبط شود"}
                    >
                      {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  )}

                </form>

                {/* Micro record timer label helper */}
                {isRecording && (
                  <div className="text-center text-[10px] text-rose-400 font-bold mt-1.5 animate-pulse">
                    🎤 در حال ضبط پیام صوتی: {recordDuration} ثانیه (برای اتمام ضبط و ارسال، مجدداً روی دکمه میکروفون کلیک کنید)
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className={`p-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl ${isRedTheme ? 'text-red-400' : 'text-blue-400'} shadow-xl max-w-sm`}>
                <HelpCircle className="w-12 h-12 mx-auto mb-2 animate-bounce" />
                <h3 className="text-sm font-extrabold text-white">یک گفتگو یا کانال را انتخاب کنید</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">
                  برای شروع گفتگوی امن سرتاسری، یکی از چت‌های سمت راست را انتخاب کنید یا گفتگوی جدیدی با زدن کلید بسازید.
                </p>
              </div>
            </div>
          )}

          {/* AI ASSISTANT DRAWER PANEL */}
          <AnimatePresence>
            {showAiAssistant && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  width: isAiPanelMaximized ? "100%" : `${aiPanelWidth}px`,
                  maxWidth: "100vw"
                }}
                className="h-full bg-slate-950/98 border-r md:border-r-0 md:border-l border-slate-800/80 backdrop-blur-md flex flex-col z-50 fixed md:relative inset-0 md:inset-auto right-0 top-0 shadow-2xl relative min-w-0 transition-all duration-75"
              >
                {/* Drag Handle for Resizing on Desktop */}
                <div
                  onMouseDown={handleResizeAiPanelStart}
                  onTouchStart={handleResizeAiPanelStart}
                  className="hidden md:flex absolute -left-2 top-0 bottom-0 w-3 cursor-ew-resize items-center justify-center group z-50 hover:bg-indigo-500/20 active:bg-indigo-500/40 transition-colors"
                  title="برای تغییر اندازه کشیده یا رها کنید"
                >
                  <div className="w-1 h-14 bg-slate-700/60 group-hover:bg-indigo-400 group-active:bg-indigo-300 rounded-full transition-colors flex items-center justify-center shadow">
                    <GripVertical className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Header */}
                <div className="h-14 px-3 sm:px-4 border-b border-slate-800 flex items-center justify-between shrink-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-xs font-black text-white font-sans truncate">دستیار هوشمند پرهام</span>
                  </div>

                  {/* Size Preset & Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Quick presets */}
                    <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[9px] font-mono text-slate-400">
                      <button
                        type="button"
                        onClick={() => { setAiPanelWidth(360); setIsAiPanelMaximized(false); }}
                        className={`px-1.5 py-0.5 rounded transition ${!isAiPanelMaximized && aiPanelWidth <= 420 ? 'bg-indigo-600 text-white font-bold' : 'hover:text-white'}`}
                        title="عرض عادی (360px)"
                      >
                        عادی
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAiPanelWidth(580); setIsAiPanelMaximized(false); }}
                        className={`px-1.5 py-0.5 rounded transition ${!isAiPanelMaximized && aiPanelWidth > 420 && aiPanelWidth < 700 ? 'bg-indigo-600 text-white font-bold' : 'hover:text-white'}`}
                        title="عرض پهن (580px)"
                      >
                        پهن
                      </button>
                    </div>

                    {/* Maximize / Minimize toggle */}
                    <button
                      type="button"
                      onClick={() => setIsAiPanelMaximized(!isAiPanelMaximized)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition"
                      title={isAiPanelMaximized ? "کوچک کردن پنل" : "بزرگنمایی کامل (صفحه عریض)"}
                    >
                      {isAiPanelMaximized ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-300" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAiAssistant(false)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition"
                      title="بستن دستیار"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-900 shrink-0">
                  <button
                    onClick={() => setAiTab("analyze")}
                    className={`flex-1 py-2 text-[9px] font-bold border-b-2 transition ${aiTab === "analyze" ? "border-indigo-500 text-indigo-400 bg-indigo-950/10" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                  >
                    تحلیل گفتگو
                  </button>
                  <button
                    onClick={() => setAiTab("chat")}
                    className={`flex-1 py-2 text-[9px] font-black border-b-2 transition ${aiTab === "chat" ? "border-indigo-500 text-indigo-400 bg-indigo-950/10" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                  >
                    گفتگوی هوشمند
                  </button>
                  <button
                    onClick={() => setAiTab("image")}
                    className={`flex-1 py-2 text-[9px] font-black border-b-2 transition ${aiTab === "image" ? "border-indigo-500 text-indigo-400 bg-indigo-950/10" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                  >
                    تولید تصویر 🎨
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {aiTab === "analyze" && (
                    <div className="space-y-4">
                      <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl">
                        <h4 className="text-[11px] font-bold text-indigo-400 mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          تحلیل هوشمند گفتگو
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          با استفاده از هوش مصنوعی پرهام (Gemini Pro)، کل محتوای متنی این گفتگو را از لحاظ روند صحبت, موضوعات اصلی، صمیمیت و نکات برجسته در یک ثانیه آنالیز کنید.
                        </p>
                      </div>

                      <button
                        onClick={handleAiAnalyze}
                        disabled={isAnalyzing}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-[10px] font-extrabold shadow-md shadow-indigo-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isAnalyzing ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>در حال تحلیل...</span>
                          </>
                        ) : (
                          <>
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>آنالیز کل پیام‌ها</span>
                          </>
                        )}
                      </button>

                      {aiAnalysis && (
                        <div className="p-3 bg-slate-900 border border-slate-850 rounded-2xl text-slate-300 text-[11px] leading-relaxed select-text font-sans">
                          {parseMarkdownToHtml(aiAnalysis)}
                        </div>
                      )}
                    </div>
                  )}

                  {aiTab === "chat" && (
                    <div className="h-full flex flex-col justify-between relative overflow-hidden" style={{ minHeight: "380px" }}>
                      
                      {/* AI Chat Header with Hamburger & New Chat Button */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-900 shrink-0">
                        <button
                          onClick={() => setShowAiHamburger(!showAiHamburger)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800/80 transition flex items-center gap-1"
                          title="لیست گفتگوهای هوش مصنوعی"
                        >
                          <Menu className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold">تاریخچه</span>
                        </button>
                        
                        <button
                          onClick={handleCreateNewAiSession}
                          className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 rounded-lg border border-indigo-500/20 transition flex items-center gap-1"
                          title="شروع گفتگوی جدید"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold">جدید</span>
                        </button>
                      </div>

                      {/* Hamburger Menu Overlay (List of AI Chats) */}
                      <AnimatePresence>
                        {showAiHamburger && (
                          <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute inset-0 bg-slate-950/98 z-10 flex flex-col border-r border-slate-900 p-3"
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-900">
                              <span className="text-[10px] font-black text-indigo-400">گفتگوهای هوشمند</span>
                              <button
                                onClick={() => setShowAiHamburger(false)}
                                className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-900 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5">
                              {aiSessions.map((s) => (
                                <div
                                  key={s.id}
                                  onClick={() => {
                                    setActiveAiSessionId(s.id);
                                    setShowAiHamburger(false);
                                  }}
                                  className={`w-full text-right p-2.5 rounded-xl cursor-pointer border transition flex items-center justify-between gap-2 ${s.id === activeAiSessionId ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-900/40 border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
                                >
                                  <div className="flex-1 min-w-0 text-right">
                                    <p className="text-[10px] font-black truncate">{s.title}</p>
                                    <p className="text-[8px] text-slate-500 mt-0.5">
                                      {s.history.length} پیام • {new Date(s.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  {aiSessions.length > 1 && (
                                    <button
                                      onClick={(e) => handleDeleteAiSession(s.id, e)}
                                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-md transition shrink-0"
                                      title="حذف گفتگو"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={handleCreateNewAiSession}
                              className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>ایجاد گفتگوی جدید</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-0 pb-4">
                        {aiChatHistory.length === 0 ? (
                          <div className="text-center py-12 text-slate-500 space-y-2">
                            <Sparkles className="w-8 h-8 text-indigo-600/40 mx-auto" />
                            <p className="text-[10px] leading-relaxed max-w-[200px] mx-auto">
                              هر سوالی درباره این گفتگو، ترجمه، پاسخ‌های پیشنهادی یا موارد عمومی دارید بنویسید. یا دکمه میکروفون را بزنید تا صدای شما ضبط و پاسخ داده شود.
                            </p>
                          </div>
                        ) : (
                          aiChatHistory.map((h, idx) => (
                            <div
                              key={idx}
                              className={`flex flex-col max-w-[95%] sm:max-w-[90%] min-w-0 ${h.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                            >
                              <div
                                className={`p-2.5 sm:p-3 rounded-2xl text-[10px] sm:text-xs leading-relaxed select-text min-w-0 max-w-full w-full overflow-hidden ${h.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-900 border border-slate-850 text-slate-300 rounded-tl-none font-sans"}`}
                              >
                                {h.role === "user" ? h.content : parseMarkdownToHtml(h.content)}
                              </div>
                              <span className="text-[8px] text-slate-500 mt-1">
                                {h.role === "user" ? "شما" : "پرهام هوش مصنوعی"}
                              </span>
                            </div>
                          ))
                        )}
                        {isAiTyping && (
                          <div className="flex flex-col items-start mr-auto max-w-[85%]">
                            <div className="p-2.5 bg-slate-900 border border-slate-850 text-slate-400 rounded-2xl rounded-tl-none text-[10px] flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-225"></span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <form onSubmit={handleAiChatSubmit} className="pt-3 bg-transparent border-t border-slate-900 flex gap-2 shrink-0 items-center">
                        <input
                          type="text"
                          placeholder={isAiRecording ? `در حال ضبط ویس: ${aiRecordDuration}s...` : "از دستیار هوش مصنوعی بپرسید (یا بگید عکس بکش)..."}
                          value={aiChatInput}
                          onChange={(e) => setAiChatInput(e.target.value)}
                          disabled={isAiRecording}
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
                        />
                        
                        <button
                          type="button"
                          onClick={() => {
                            setAiTab("image");
                            if (aiChatInput.trim()) {
                              setImagePrompt(aiChatInput.trim());
                            }
                          }}
                          className="p-2 bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl shrink-0 transition"
                          title="خلق تصویر بر اساس این متن"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={isAiRecording ? stopAiVoiceRecording : startAiVoiceRecording}
                          className={`p-2 rounded-xl border shrink-0 transition-all ${isAiRecording ? 'bg-rose-600 border-rose-500 text-white animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                          title={isAiRecording ? "توقف ضبط و ارسال ویس" : "ضبط ویس برای هوش مصنوعی"}
                        >
                          {isAiRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="submit"
                          disabled={isAiRecording}
                          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shrink-0 shadow-lg shadow-indigo-950/50 transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      </form>
                    </div>
                  )}

                  {aiTab === "image" && (
                    <div className="space-y-4 text-right font-sans">
                      {/* Studio Header Card */}
                      <div className="p-3 bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 rounded-2xl">
                        <h4 className="text-[11px] font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-indigo-400" />
                          تولید و ویرایش تصویر با هوش مصنوعی (Gemini Image Studio)
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          توصیف متنی یا تصویر اولیه بدهید تا هوش مصنوعی پرهام با مدل قدرتمند Gemini با بالاترین کیفیت تصویر شما را خلق کند.
                        </p>
                      </div>

                      {/* Form */}
                      <form onSubmit={(e) => handleGenerateImageSubmit(e)} className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-300 mb-1 block">توصیف تصویر (Prompt):</label>
                          <textarea
                            rows={3}
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            placeholder="مثال: یک شهر آینده‌نگرانه با برج‌های نورانی بنفش و طلایی، کیفیت فوق‌العاده 8K..."
                            className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition custom-scrollbar resize-none"
                          />
                        </div>

                        {/* Aspect Ratio Selector */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-300 mb-1 block">نسبت ابعاد (Aspect Ratio):</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { id: "1:1", label: "1:1 مربع" },
                              { id: "16:9", label: "16:9 عریض" },
                              { id: "9:16", label: "9:16 ستونی" },
                              { id: "4:3", label: "4:3 کشیده" }
                            ].map((aspect) => (
                              <button
                                type="button"
                                key={aspect.id}
                                onClick={() => setSelectedAspectRatio(aspect.id as any)}
                                className={`py-1.5 text-[9px] font-bold rounded-lg border transition ${
                                  selectedAspectRatio === aspect.id
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                {aspect.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Image Resolution Selector */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                            <span>کیفیت و رزولوشن خروجی (Gemini 3 Pro Image):</span>
                            <span className="text-[9px] text-indigo-400 font-mono">1K / 2K / 4K</span>
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: "1K", label: "1K (HD)" },
                              { id: "2K", label: "2K (QHD)" },
                              { id: "4K", label: "4K (UHD Ultra)" }
                            ].map((sz) => (
                              <button
                                type="button"
                                key={sz.id}
                                onClick={() => setSelectedImageSize(sz.id as any)}
                                className={`py-1.5 text-[9px] font-bold rounded-lg border transition ${
                                  selectedImageSize === sz.id
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                {sz.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Image-to-Image Edit option */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-300">تصویر مرجع برای تغییر (اختیاری):</label>
                            {inputImageForEdit && (
                              <button
                                type="button"
                                onClick={() => setInputImageForEdit(null)}
                                className="text-[9px] text-rose-400 hover:underline"
                              >
                                حذف تصویر
                              </button>
                            )}
                          </div>
                          
                          {inputImageForEdit ? (
                            <div className="relative w-full h-24 rounded-xl border border-slate-800 overflow-hidden bg-slate-950 flex items-center justify-center">
                              <img src={inputImageForEdit} alt="مرجع ویرایش" className="h-full w-auto object-cover" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => imageUploadInputRef.current?.click()}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 text-slate-400 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                              <span>بارگذاری تصویر پایه برای تغییر یا ویرایش</span>
                            </button>
                          )}
                          <input
                            type="file"
                            ref={imageUploadInputRef}
                            accept="image/*"
                            onChange={handleImageEditUpload}
                            className="hidden"
                          />
                        </div>

                        {/* Quick Presets */}
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 mb-1 block">پیش‌فرض‌های پیشنهادی:</label>
                          <div className="flex flex-wrap gap-1">
                            {[
                              "یک منظره غروب ساحلی با امواج درخشان و آسمان ارغوانی",
                              "لوگوی مدرن و مینیمال هوش مصنوعی پرهام با خطوط نئونی",
                              "پرتره یک خلبان سفینه فضایی در میان ستاره‌ها",
                              "یک کلبه چوبی مدرن در جنگل برفی هنگام غروب"
                            ].map((preset, idx) => (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => setImagePrompt(preset)}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[9px] text-slate-300 rounded-lg border border-slate-800 truncate max-w-[170px] text-right"
                                title={preset}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isGeneratingImage || !imagePrompt.trim()}
                          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-[10px] font-extrabold shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isGeneratingImage ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              <span>در حال خلق تصویر با هوش مصنوعی...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                              <span>{inputImageForEdit ? "ویرایش و خلق تصویر جدید" : "تولید تصویر هوش مصنوعی"}</span>
                            </>
                          )}
                        </button>
                      </form>

                      {/* Generated Image Result */}
                      {generatedImageResult && (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                          <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            تصویر شما آماده شد:
                          </p>
                          <div className="rounded-xl overflow-hidden border border-slate-800">
                            <img src={generatedImageResult} alt="تصویر خلق شده" className="w-full h-auto max-h-72 object-cover" />
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <a
                              href={generatedImageResult}
                              download="ai-generated.jpg"
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[10px] font-bold rounded-xl border border-slate-800 transition flex items-center justify-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5 text-sky-400" />
                              <span>ذخیره کیفیت اصلی</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => sendGeneratedImageToChat(generatedImageResult, imagePrompt)}
                              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-indigo-600/20"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>ارسال به چت جاری</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Recent Generated Images History */}
                      {generatedImagesHistory.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-900">
                          <h5 className="text-[10px] font-bold text-slate-400">تصاویر اخیر تولید شده:</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {generatedImagesHistory.map((item) => (
                              <div key={item.id} className="p-1.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 group relative">
                                <img src={item.url} alt={item.prompt} className="w-full h-24 object-cover rounded-lg" />
                                <p className="text-[8px] text-slate-400 truncate">{item.prompt}</p>
                                <div className="flex items-center justify-between gap-1 pt-0.5">
                                  <a href={item.url} download target="_blank" rel="noreferrer" className="text-[8px] text-sky-400 hover:underline">
                                    ذخیره
                                  </a>
                                  <button
                                    onClick={() => sendGeneratedImageToChat(item.url, item.prompt)}
                                    className="text-[8px] text-indigo-400 hover:underline"
                                  >
                                    ارسال به چت
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            currentUser={currentUser}
            currentTheme={currentTheme}
            users={users}
            onClose={() => setShowSettings(false)}
            onLogout={handleLogout}
            onUpdateProfile={(updatedUser) => {
              setCurrentUser(updatedUser);
              localStorage.setItem("parham_user", JSON.stringify(updatedUser));
              if (updatedUser.theme) {
                setCurrentTheme(updatedUser.theme);
              }
            }}
            onUnblockUser={handleUnblockUser}
          />
        )}
      </AnimatePresence>

      {/* NEW CHAT / GROUP MODAL */}
      <AnimatePresence>
        {showNewChat && (
          <NewChatModal
            currentUser={currentUser}
            users={users}
            onClose={() => setShowNewChat(false)}
            onCreateChat={handleCreateChat}
          />
        )}
      </AnimatePresence>

      {/* USER PROFILE MODAL */}
      <AnimatePresence>
        {selectedProfileUserId && (
          <UserProfileModal
            currentUser={currentUser}
            targetUserId={selectedProfileUserId}
            users={users}
            onClose={() => setSelectedProfileUserId(null)}
            onInitiateCall={(type, user) => initiateCall(type, user)}
            onUpdateProfile={(updatedUser) => {
              setCurrentUser(updatedUser);
              setUsers(prev => ({
                ...prev,
                [updatedUser.id]: {
                  ...prev[updatedUser.id],
                  ...updatedUser
                }
              }));
            }}
            onLogout={handleLogout}
            onOpenAdminDashboard={() => setShowAdminDashboard(true)}
            onToggleFilter={(userId, filter) => {
              setUsers(prev => {
                if (!prev[userId]) return prev;
                return {
                  ...prev,
                  [userId]: {
                    ...prev[userId],
                    isFiltered: filter
                  }
                };
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* GROUP PROFILE MODAL */}
      <AnimatePresence>
        {selectedProfileGroupId && (
          <GroupProfileModal
            chatId={selectedProfileGroupId}
            chats={chats}
            users={users}
            currentUser={currentUser}
            onClose={() => setSelectedProfileGroupId(null)}
            onSelectMember={(userId) => {
              setSelectedProfileGroupId(null);
              setSelectedProfileUserId(userId);
            }}
            onUpdateChat={handleUpdateChat}
            onDeleteChat={handleDeleteChat}
          />
        )}
      </AnimatePresence>

      {/* SUBSCRIPTION UPGRADE MODAL */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentUser={currentUser}
        onPurchasePlan={handlePurchasePlan}
        lockedFeatureName={subscriptionLockedFeature}
      />

      {/* ADMIN SYSTEM DASHBOARD MODAL */}
      <AnimatePresence>
        {showAdminDashboard && (
          <AdminDashboardModal
            currentUser={currentUser}
            systemUsers={users}
            onClose={() => setShowAdminDashboard(false)}
            onUpdateUserInParent={(userId, updates) => {
              setUsers(prev => {
                if (!prev[userId]) return prev;
                return {
                  ...prev,
                  [userId]: {
                    ...prev[userId],
                    ...updates
                  }
                };
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* REAL-TIME AUDIO & VIDEO CALLING OVERLAY MODAL */}
      <AnimatePresence>
        {callState !== 'idle' && callPartner && (
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 bg-slate-950/98 backdrop-blur-2xl z-[150] flex flex-col items-center justify-between p-6 sm:p-8 select-none"
            dir="rtl"
          >
            {/* Hidden audio element for receiving remote WebRTC audio */}
            <audio
              ref={(el) => {
                remoteAudioRef.current = el;
                if (el) {
                  el.muted = false;
                  el.volume = 1.0;
                  try {
                    const ctx = getAudioContext();
                    if (ctx && ctx.state === 'suspended') ctx.resume();
                  } catch (e) {}
                  if (remoteStream && el.srcObject !== remoteStream) {
                    el.srcObject = remoteStream;
                    el.play().catch(e => console.warn("Audio play error", e));
                  }
                }
              }}
              autoPlay
              playsInline
              className="hidden"
            />

            {/* Call Header */}
            <div className="w-full max-w-lg flex items-center justify-between text-white/90">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${callPartner.avatarColor || 'bg-slate-800'}`}>
                  {callPartner.avatarEmoji || '👤'}
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-black">{callPartner.nickname}</h2>
                  <p className="text-[10px] text-slate-400">
                    {callType === 'video' ? 'تماس تصویری فوق امن' : 'تماس صوتی رمزنگاری شده'}
                  </p>
                </div>
              </div>

              {callState === 'connected' && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    {formatCallDuration(callDuration)}
                  </span>
                </div>
              )}
            </div>

            {/* Main Stage (Videos or Avatar visualizer) */}
            <div className="w-full max-w-2xl flex-1 flex items-center justify-center my-6 relative min-h-[300px]">
              {/* VIDEO CALL STAGE */}
              {callType === 'video' && (
                <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl flex items-center justify-center">
                  {/* Remote video area simulation */}
                  {callState !== 'connected' ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-slate-800/80 flex items-center justify-center text-4xl animate-pulse">
                          {callPartner.avatarEmoji || '👤'}
                        </div>
                        <span className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-75"></span>
                      </div>
                      <span className="text-xs text-slate-300 animate-pulse">در حال برقراری تماس تصویری مستقیم...</span>
                    </div>
                  ) : partnerIsCameraOff ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-4xl border-2 border-slate-700">
                        {callPartner.avatarEmoji || '👤'}
                      </div>
                      <span className="text-xs text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                        دوربین طرف مقابل غیرفعال است
                      </span>
                    </div>
                  ) : remoteStream && remoteStream.getVideoTracks().length > 0 ? (
                    <div className="w-full h-full relative">
                      <video
                        ref={(el) => {
                          remoteVideoRef.current = el;
                          if (el && remoteStream && el.srcObject !== remoteStream) {
                            el.srcObject = remoteStream;
                            el.play().catch(e => console.warn("Remote video play error", e));
                          }
                        }}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 z-10 font-mono">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        <span>تصویر زنده | کیفیت HD</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/40 relative p-6">
                      {/* High tech background scan lines or grid */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950/80 to-slate-950 opacity-90 z-0"></div>
                      
                      {/* Active High-Fi visual container */}
                      <div className="relative z-10 flex flex-col items-center gap-4 max-w-sm text-center">
                        {/* Pulsing ring visualizer */}
                        <div className="relative">
                          <motion.div
                            animate={{ scale: partnerIsMuted ? 1 : [1, 1.15, 1], opacity: partnerIsMuted ? 0.3 : [0.4, 0.8, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className={`absolute -inset-4 rounded-full border-2 ${partnerIsMuted ? 'border-rose-500/20' : 'border-emerald-500/30'} blur-sm`}
                          />
                          <div className={`w-24 h-24 rounded-full ${callPartner.avatarColor || 'bg-slate-800'} flex items-center justify-center text-5xl shadow-2xl border-2 border-slate-700 relative z-10`}>
                            {callPartner.avatarEmoji || '👤'}
                          </div>
                          
                          {/* Signal Status Pin */}
                          <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center z-20">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white/90">{callPartner.nickname}</h4>
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-flex items-center gap-1 font-mono">
                            ● اتصال مستقیم فعال | تأخیر نزدیک به صفر
                          </span>
                        </div>

                        {/* Beautiful sound waves visualizer */}
                        <div className="flex items-end justify-center gap-1.5 h-10 w-48 mt-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((val, i) => (
                            <motion.div
                              key={i}
                              animate={{
                                height: partnerIsMuted ? 4 : [4, Math.max(6, val * (2 + Math.random() * 2.5)), 4]
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.4 + (i % 3) * 0.12,
                                ease: "easeInOut"
                              }}
                              className={`w-1 rounded-full transition-colors ${partnerIsMuted ? 'bg-rose-500/30' : 'bg-emerald-500/80'}`}
                            />
                          ))}
                        </div>

                        {/* Mute banner */}
                        {partnerIsMuted && (
                          <div className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20">
                            <MicOff className="w-3 h-3" />
                            <span>صدای طرف مقابل قطع است</span>
                          </div>
                        )}
                      </div>

                      {/* Floating high-tech overlay badge */}
                      <div className="absolute top-4 right-4 flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 z-10 font-mono">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        <span>کیفیت مکالمه: عالی (Full HD)</span>
                      </div>
                    </div>
                  )}

                  {/* Local Video (Floating Picture-in-Picture) */}
                  <div className="absolute bottom-4 right-4 w-28 sm:w-36 aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-lg z-10">
                    {localStream && !isCameraOff ? (
                      <video
                        ref={(el) => {
                          localVideoRef.current = el;
                          if (el && localStream && el.srcObject !== localStream) {
                            el.srcObject = localStream;
                            el.play().catch(e => console.warn("Local video play error", e));
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-[10px] text-slate-500">
                        دوربین خاموش
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AUDIO CALL STAGE */}
              {callType === 'audio' && (
                <div className="flex flex-col items-center gap-6 justify-center">
                  <div className="relative flex items-center justify-center">
                    {/* Ringing waves */}
                    {callState !== 'connected' && (
                      <>
                        <motion.span
                          animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                          className="absolute w-28 h-28 rounded-full bg-emerald-500/20"
                        />
                        <motion.span
                          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0.6, ease: "easeOut" }}
                          className="absolute w-28 h-28 rounded-full bg-indigo-500/20"
                        />
                      </>
                    )}
                    {callState === 'connected' && (
                      <motion.span
                        animate={{ scale: partnerIsMuted ? 1 : [1, 1.25, 1], opacity: partnerIsMuted ? 0.2 : [0.4, 0.8, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className={`absolute w-32 h-32 rounded-full border-2 ${partnerIsMuted ? 'bg-rose-500/5 border-rose-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}
                      />
                    )}

                    <div className={`w-28 h-28 rounded-3xl ${callPartner.avatarColor || 'bg-indigo-600'} flex items-center justify-center text-5xl shadow-2xl relative z-10 border border-white/10`}>
                      {callPartner.avatarEmoji || '👤'}
                    </div>
                  </div>

                  <div className="text-center space-y-2.5 z-10">
                    <h3 className="text-lg font-black text-white">{callPartner.nickname}</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {callState === 'outgoing' && 'در حال بوق خوردن تماس صوتی مستقیم...'}
                      {callState === 'incoming' && 'تماس صوتی ورودی...'}
                      {callState === 'connected' && 'مکالمه فعال و کاملاً ایمن (سیگنال فوق‌سریع)'}
                    </p>

                    {callState === 'connected' && (
                      <div className="flex flex-col items-center gap-3 mt-4">
                        {/* Audio Wave */}
                        <div className="flex items-end justify-center gap-1 h-8 w-36">
                          {[1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((val, i) => (
                            <motion.div
                              key={i}
                              animate={{
                                height: partnerIsMuted ? 4 : [4, Math.max(6, val * (2 + Math.random() * 3)), 4]
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.4 + (i % 3) * 0.1,
                                ease: "easeInOut"
                              }}
                              className={`w-1 rounded-full transition-colors ${partnerIsMuted ? 'bg-rose-500/30' : 'bg-emerald-500/80'}`}
                            />
                          ))}
                        </div>

                        {partnerIsMuted && (
                          <div className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 animate-pulse">
                            <MicOff className="w-3.5 h-3.5" />
                            <span>میکروفون طرف مقابل غیرفعال است</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Control Bar */}
            <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 px-6 py-4 rounded-3xl backdrop-blur-xl shadow-2xl flex items-center justify-around">
              {/* Incoming Actions */}
              {callState === 'incoming' ? (
                <>
                  <button
                    onClick={rejectCall}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-lg transition-transform group-hover:scale-105">
                      <PhoneOff className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">رد تماس</span>
                  </button>

                  <button
                    onClick={acceptCall}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className="p-4 bg-emerald-500 hover:bg-emerald-450 text-white rounded-2xl shadow-lg transition-transform group-hover:scale-105 animate-bounce">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">پاسخ دادن</span>
                  </button>
                </>
              ) : (
                // Outgoing / Active Controls
                <>
                  {/* Mute Mic */}
                  <button
                    onClick={toggleMute}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className={`p-3.5 rounded-2xl border transition ${isMuted ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}`}>
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] text-slate-400">{isMuted ? 'میکروفون وصل' : 'قطع صدا'}</span>
                  </button>

                  {/* Red End Call */}
                  <button
                    onClick={callState === 'outgoing' ? cancelCall : endCall}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-xl transition-transform group-hover:scale-105">
                      <PhoneOff className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">قطع تماس</span>
                  </button>

                  {/* Toggle Camera (Always available so audio callers can upgrade to video) */}
                  <button
                    onClick={toggleCamera}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className={`p-3.5 rounded-2xl border transition ${isCameraOff || callType === 'audio' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}`}>
                      {isCameraOff || callType === 'audio' ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] text-slate-400">{isCameraOff || callType === 'audio' ? 'روشن دوربین' : 'خاموش دوربین'}</span>
                  </button>
                </>
              )}
            </div>

            {/* Security Notice */}
            <p className="text-[9px] text-slate-500 mt-4 text-center">
              🔒 این مکالمه صوتی/تصویری به صورت رمزنگاری شده و فوق‌سریع توسط پروتکل امن سیگنالینگ برقرار شده و از بالاترین پایداری بدون قطعی برخوردار است.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMAGE LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 select-none cursor-zoom-out"
          >
            {/* Top Bar inside Lightbox */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="absolute top-4 left-4 right-4 flex items-center justify-between text-white dir-rtl"
              dir="rtl"
            >
              <div className="flex flex-col text-right">
                <span className="text-xs font-black truncate max-w-[250px] sm:max-w-md">{lightboxName}</span>
                <span className="text-[9px] text-slate-400">پیش‌نمایش تصویر با رزولوشن اصلی</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={lightboxUrl}
                  download={lightboxName}
                  className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-800 transition flex items-center gap-1.5"
                  title="دانلود تصویر"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-[10px] hidden sm:inline">دانلود فایل</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  className="p-2 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-800 hover:border-rose-900 transition"
                  title="بستن"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Image View */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl max-h-[80vh] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl relative"
            >
              <img
                src={lightboxUrl}
                alt={lightboxName}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* Footer Tip */}
            <span className="text-[10px] text-slate-500 absolute bottom-4">
              برای بستن، بیرون از کادر کلیک کنید
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gemini Live Voice Conversation Modal */}
      <GeminiLiveModal
        isOpen={showGeminiLive}
        onClose={() => setShowGeminiLive(false)}
        onOpenChatTab={() => {
          setShowAiAssistant(true);
          setAiTab("chat");
        }}
      />

    </div>
  );
}
