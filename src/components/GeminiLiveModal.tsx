import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, Radio, MessageSquare, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GeminiLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChatTab?: () => void;
  appLanguage?: 'fa' | 'en';
}

const VOICES = [
  { id: "Zephyr", name: "زفیر (Zephyr - صمیمی و آرام)", nameEn: "Zephyr (Friendly & Calm)" },
  { id: "Kore", name: "کوره (Kore - گرم و شمرده)", nameEn: "Kore (Warm & Measured)" },
  { id: "Puck", name: "پک (Puck - پرانرژی)", nameEn: "Puck (Energetic)" },
  { id: "Fenrir", name: "فنریر (Fenrir - بم و جدی)", nameEn: "Fenrir (Deep & Serious)" },
  { id: "Charon", name: "کارون (Charon - متین)", nameEn: "Charon (Balanced)" },
];

export const GeminiLiveModal: React.FC<GeminiLiveModalProps> = ({
  isOpen,
  onClose,
  onOpenChatTab,
  appLanguage = 'fa'
}) => {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "speaking" | "error">("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("Zephyr");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<Array<{ sender: "user" | "ai"; text: string; time: string }>>([]);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlaybackTimeRef = useRef<number>(0);
  const isSpeakingTimeoutRef = useRef<any>(null);

  const isMicMutedRef = useRef(isMicMuted);
  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const isSpeakerMutedRef = useRef(isSpeakerMuted);
  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
  }, [isSpeakerMuted]);

  // Connect & Start Live Session
  const startLiveSession = async () => {
    setStatus("connecting");
    setErrorMessage(null);

    try {
      // 1. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // 2. Setup WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/live?voice=${encodeURIComponent(selectedVoice)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Gemini Live Client] WS connected, initializing audio contexts...");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "status" && data.status === "connected") {
            setStatus("connected");
          } else if (data.type === "audio") {
            if (!isSpeakerMutedRef.current && data.audio) {
              setStatus("speaking");
              if (isSpeakingTimeoutRef.current) clearTimeout(isSpeakingTimeoutRef.current);
              isSpeakingTimeoutRef.current = setTimeout(() => {
                setStatus("connected");
              }, 800);

              playPcmAudio(data.audio);
            }
          } else if (data.type === "interrupted") {
            // Reset audio playback queue on interruption
            if (outputAudioCtxRef.current) {
              nextPlaybackTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
            setStatus("connected");
          } else if (data.type === "outputTranscription") {
            if (data.text) {
              addTranscript("ai", data.text);
            }
          } else if (data.type === "inputTranscription") {
            if (data.text) {
              addTranscript("user", data.text);
            }
          } else if (data.type === "error") {
            console.error("[Gemini Live Error]", data.error);
            setStatus("error");
            setErrorMessage(data.error || "خطایی در برقراری ارتباط صوتی رخ داد.");
          }
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WS Live Error:", err);
        setStatus("error");
        setErrorMessage("امکان اتصال به سرور جمنای لایو وجود ندارد.");
      };

      ws.onclose = () => {
        console.log("[Gemini Live Client] WS closed");
        setStatus((prev) => (prev === "error" ? "error" : "disconnected"));
      };

      // 3. Setup Audio Capture (16kHz for Gemini input)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMicMutedRef.current || ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate audio visualizer level
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const avg = sum / inputData.length;
        setAudioLevel(Math.min(100, Math.round(avg * 400)));

        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64
        let binary = "";
        const bytes = new Uint8Array(pcm16.buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Pcm = btoa(binary);

        ws.send(JSON.stringify({ audio: base64Pcm }));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      // 4. Setup Audio Playback (24kHz for Gemini output)
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextPlaybackTimeRef.current = outputCtx.currentTime;

    } catch (err: any) {
      console.error("Failed to initialize live audio:", err);
      setStatus("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("دسترسی به میکروفون توسط مرورگر تایید نشد.");
      } else {
        setErrorMessage(err.message || "راه‌اندازی سیستم صوتی ناموفق بود.");
      }
    }
  };

  const playPcmAudio = (base64Pcm: string) => {
    try {
      const outputCtx = outputAudioCtxRef.current;
      if (!outputCtx) return;

      if (outputCtx.state === "suspended") {
        outputCtx.resume();
      }

      const binaryStr = atob(base64Pcm);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);

      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 32768 : 32767);
      }

      const audioBuffer = outputCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const sourceNode = outputCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(outputCtx.destination);

      const now = outputCtx.currentTime;
      const startTime = Math.max(now, nextPlaybackTimeRef.current);
      sourceNode.start(startTime);
      nextPlaybackTimeRef.current = startTime + audioBuffer.duration;
    } catch (e) {
      console.error("Playback PCM error:", e);
    }
  };

  const addTranscript = (sender: "user" | "ai", text: string) => {
    const timeStr = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    setTranscripts((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].sender === sender) {
        const last = prev[prev.length - 1];
        const updated = [...prev];
        updated[updated.length - 1] = { ...last, text: last.text + " " + text };
        return updated.slice(-20);
      }
      return [...prev, { sender, text, time: timeStr }].slice(-20);
    });
  };

  const stopLiveSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    setStatus("disconnected");
  };

  useEffect(() => {
    if (isOpen) {
      startLiveSession();
    } else {
      stopLiveSession();
    }

    return () => {
      stopLiveSession();
    };
  }, [isOpen, selectedVoice]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md ${appLanguage === 'fa' ? 'dir-rtl' : 'dir-ltr'}`} dir={appLanguage === 'fa' ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[520px]"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative px-6 py-4 border-b border-slate-800/80 flex items-center justify-between z-10 bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Radio className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5 font-sans">
                  {appLanguage === 'en' ? 'Gemini Live Voice Chat' : 'گفتگوی صوتی زنده با جمنای'}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono">
                    Live API
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  {appLanguage === 'en' ? 'Zero-latency smart voice assistant' : 'دستیار هوشمند صوتی بدون تاخیر پرهام'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                stopLiveSession();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="بستن مکالمه صوتی"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Visualizer Body */}
          <div className="relative flex-1 p-6 flex flex-col items-center justify-center text-center z-10 space-y-6">
            
            {/* Pulsing Voice Orb Visualizer */}
            <div className="relative flex items-center justify-center my-4">
              {/* Outer pulsing ring */}
              <motion.div
                animate={{
                  scale: status === "speaking" ? [1, 1.4, 1] : status === "connected" ? [1, 1.1, 1] : 1,
                  opacity: status === "speaking" ? [0.4, 0.8, 0.4] : 0.2
                }}
                transition={{ repeat: Infinity, duration: status === "speaking" ? 1.2 : 2.5, ease: "easeInOut" }}
                className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 blur-xl opacity-30"
              />

              {/* Dynamic level ring */}
              <div
                style={{
                  transform: `scale(${1 + Math.min(0.5, audioLevel / 100)})`,
                  transition: "transform 0.08s ease-out"
                }}
                className={`w-28 h-28 rounded-full border-2 flex items-center justify-center transition-colors shadow-2xl ${
                  status === "speaking"
                    ? "border-sky-400 bg-sky-500/20 shadow-sky-500/40"
                    : status === "connected"
                    ? "border-indigo-500 bg-indigo-600/20 shadow-indigo-500/30"
                    : status === "connecting"
                    ? "border-amber-500 bg-amber-500/10 shadow-amber-500/20 animate-spin"
                    : "border-slate-700 bg-slate-800/40"
                }`}
              >
                <div className="w-20 h-20 rounded-full bg-slate-950/90 border border-slate-700/80 flex items-center justify-center relative">
                  {status === "connecting" ? (
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                  ) : status === "speaking" ? (
                    <Sparkles className="w-9 h-9 text-sky-400 animate-bounce" />
                  ) : status === "connected" ? (
                    <Mic className={`w-8 h-8 transition-colors ${isMicMuted ? 'text-rose-400' : 'text-indigo-400'}`} />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-rose-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Status Label */}
            <div className="space-y-1">
              {status === "connecting" && (
                <p className="text-xs font-bold text-amber-400 animate-pulse flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  در حال اتصال به جمنای لایو...
                </p>
              )}
              {status === "connected" && (
                <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  آماده! می‌توانید صحبت کنید...
                </p>
              )}
              {status === "speaking" && (
                <p className="text-xs font-bold text-sky-400 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  پرهام در حال پاسخگویی است...
                </p>
              )}
              {status === "error" && (
                <p className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1">
                  {errorMessage || "خطا در برقراری ارتباط صوتی"}
                </p>
              )}
            </div>

            {/* Live Subtitle Transcript Box */}
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3 h-28 overflow-y-auto custom-scrollbar text-right space-y-2 dir-rtl">
              {transcripts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[11px] text-slate-500 font-sans">
                  زیرنویس زنده مکالمه صوتی شما اینجا نمایش داده می‌شود...
                </div>
              ) : (
                transcripts.map((t, idx) => (
                  <div
                    key={idx}
                    className={`text-[11px] leading-relaxed font-sans ${
                      t.sender === "user" ? "text-slate-300" : "text-sky-300 font-medium"
                    }`}
                  >
                    <span className="text-[9px] font-mono text-slate-500 ml-1">[{t.time}]</span>
                    <span className="font-bold ml-1">{t.sender === "user" ? "شما:" : "پرهام:"}</span>
                    {t.text}
                  </div>
                ))
              )}
            </div>

            {/* Voice Selection */}
            <div className="w-full flex items-center justify-between bg-slate-950/50 border border-slate-800/80 rounded-xl px-3 py-2 text-xs">
              <span className="text-slate-400 font-sans text-[11px]">صدا و گوینده:</span>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={status === "connecting"}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-indigo-500 font-sans cursor-pointer"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Control Buttons */}
          <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between z-10 gap-3">
            <div className="flex items-center gap-2">
              {/* Mic Mute Toggle */}
              <button
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`p-3 rounded-2xl border transition flex items-center gap-1.5 text-xs font-bold ${
                  isMicMuted
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                    : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750"
                }`}
                title={isMicMuted ? "وصل کردن میکروفون" : "قطع کردن میکروفون (Mute)"}
              >
                {isMicMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                <span className="hidden sm:inline">{isMicMuted ? "میکروفون قطع" : "میکروفون فعال"}</span>
              </button>

              {/* Speaker Mute Toggle */}
              <button
                onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                className={`p-3 rounded-2xl border transition flex items-center gap-1.5 text-xs font-bold ${
                  isSpeakerMuted
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                    : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750"
                }`}
                title={isSpeakerMuted ? "وصل کردن بلندگو" : "بی‌صدا کردن بلندگو"}
              >
                {isSpeakerMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onOpenChatTab && (
                <button
                  onClick={() => {
                    stopLiveSession();
                    onClose();
                    onOpenChatTab();
                  }}
                  className="px-3 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>چت متنی AI</span>
                </button>
              )}

              <button
                onClick={() => {
                  stopLiveSession();
                  onClose();
                }}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-2xl transition shadow-lg shadow-rose-600/20"
              >
                پایان مکالمه
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GeminiLiveModal;
