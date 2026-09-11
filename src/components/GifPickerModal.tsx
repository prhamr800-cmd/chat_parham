import React, { useState, useEffect, useRef } from "react";
import { X, Search, Sparkles, Image, Flame, Heart, Smile, Film, Plus, Upload, Wand2, Scissors, Play, Pause, Download, Trash2, BookmarkCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { convertFileToGif } from "../utils/gifEncoder";

interface GifPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
  appLanguage?: 'fa' | 'en';
}

const CATEGORIES = [
  { id: 'trending', labelFa: 'داغ‌ترین‌ها 🔥', labelEn: 'Trending 🔥', query: 'trending' },
  { id: 'my_saved', labelFa: 'گیف‌های من 💾', labelEn: 'My Saved 💾', query: '' },
  { id: 'reactions', labelFa: 'واکنش‌ها 😂', labelEn: 'Reactions 😂', query: 'funny reaction' },
  { id: 'love', labelFa: 'عاشقانه ❤️', labelEn: 'Love ❤️', query: 'love heart' },
  { id: 'dance', labelFa: 'رقص و شادی 💃', labelEn: 'Dance 💃', query: 'party dance' },
  { id: 'cats', labelFa: 'گربه‌ها 🐱', labelEn: 'Cats 🐱', query: 'cute cat' },
  { id: 'anime', labelFa: 'انیمه 🌸', labelEn: 'Anime 🌸', query: 'anime' },
  { id: 'memes', labelFa: 'میم 🐸', labelEn: 'Memes 🐸', query: 'meme' },
];

const CURATED_GIFS: { [cat: string]: string[] } = {
  trending: [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdW4yOW85ZmgxcGtyOHl4b2N0czBxbzdxZW1xdXZ1cXg1djl4OTYwayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlHFRb4OMYYYR32/giphy.gif',
    'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
    'https://media.giphy.com/media/l3vR85PnGsBwu1PFK/giphy.gif',
    'https://media.giphy.com/media/3o7TKsjRrfIPjeiVyM/giphy.gif',
    'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
    'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
    'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif',
    'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
  ],
  reactions: [
    'https://media.giphy.com/media/3o7abKhOpu0NwenH3y/giphy.gif',
    'https://media.giphy.com/media/26AHPxxnKS4hAU3SM/giphy.gif',
    'https://media.giphy.com/media/xT9IgG5083m3gVvxbO/giphy.gif',
    'https://media.giphy.com/media/l0AM4lA0x7d6U/giphy.gif',
    'https://media.giphy.com/media/xUPGcq6cAnsm2lp21y/giphy.gif',
    'https://media.giphy.com/media/l3fQf1OEAq0iri9RC/giphy.gif',
  ],
  love: [
    'https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif',
    'https://media.giphy.com/media/l2R013m46deVn0eb6/giphy.gif',
    'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif',
    'https://media.giphy.com/media/3o6Zt8qDiPE2nq3kay/giphy.gif',
  ],
  dance: [
    'https://media.giphy.com/media/l41Yh18f5TbiWHE0o/giphy.gif',
    'https://media.giphy.com/media/3o7qDQ4kcSD1U8Ivt6/giphy.gif',
    'https://media.giphy.com/media/l3vRlT2k2L35Cnn5C/giphy.gif',
    'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
  ],
  cats: [
    'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
    'https://media.giphy.com/media/BzyTuYCmvSORqs1ABM/giphy.gif',
    'https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif',
    'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif',
  ],
  anime: [
    'https://media.giphy.com/media/133QeNpREBm3o3/giphy.gif',
    'https://media.giphy.com/media/8vUEXZA2ixBwA/giphy.gif',
    'https://media.giphy.com/media/Od0QRnNRy3fz3Xz2yL/giphy.gif',
    'https://media.giphy.com/media/9wA43k2v7aJtm/giphy.gif',
  ],
  memes: [
    'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
    'https://media.giphy.com/media/5wWf7H0qoWaNnkZBucU/giphy.gif',
    'https://media.giphy.com/media/3o85xGocUH8RYoDKKs/giphy.gif',
    'https://media.giphy.com/media/l3q2K12v7LgVW3VzG/giphy.gif',
  ]
};

export default function GifPickerModal({
  isOpen,
  onClose,
  onSelectGif,
  appLanguage = 'fa'
}: GifPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('trending');
  const [onlineGifs, setOnlineGifs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Saved Custom GIFs State
  const [savedGifs, setSavedGifs] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("parham_custom_saved_gifs");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveGifToLibrary = (url: string) => {
    if (!url || url.startsWith("data:")) return; // Prevent storing huge base64 in localStorage
    setSavedGifs(prev => {
      if (prev.includes(url)) return prev;
      const updated = [url, ...prev];
      try {
        localStorage.setItem("parham_custom_saved_gifs", JSON.stringify(updated));
      } catch (e) {
        console.warn("localStorage quota exceeded for saved gifs", e);
      }
      return updated;
    });
  };

  const removeGifFromLibrary = (url: string) => {
    setSavedGifs(prev => {
      const updated = prev.filter(g => g !== url);
      try {
        localStorage.setItem("parham_custom_saved_gifs", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Conversion & Video Trimmer States
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [convertError, setConvertError] = useState<string | null>(null);

  // Video Trimmer Modal state
  const [trimmerFile, setTrimmerFile] = useState<File | null>(null);
  const [trimmerVideoUrl, setTrimmerVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(4);
  const [isPlayingTrim, setIsPlayingTrim] = useState<boolean>(true);
  const [targetMaxDim, setTargetMaxDim] = useState<number>(320); // 320p lightweight default

  const handleCustomFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || Boolean(file.name.match(/\.(mp4|webm|mov|avi|mkv|3gp)$/i));

    if (isVideo) {
      // Open Trimmer Editor
      const url = URL.createObjectURL(file);
      setTrimmerFile(file);
      setTrimmerVideoUrl(url);
      setStartTime(0);
      setEndTime(4);
      setConvertError(null);
    } else {
      // Process photo directly
      processGifConversion(file);
    }
  };

  const processGifConversion = async (
    file: File,
    trimRange?: { startTime: number; endTime: number; targetMaxDim?: number }
  ) => {
    setIsConverting(true);
    setConvertProgress(10);
    setConvertError(null);

    try {
      // 1. Convert video/image to GIF Data URL & Blob
      const result = await convertFileToGif(file, (progress) => {
        setConvertProgress(Math.min(90, Math.round(10 + progress * 0.8)));
      }, { ...trimRange, targetMaxDim: trimRange?.targetMaxDim || targetMaxDim });

      setConvertProgress(92);

      // 2. Upload converted GIF to server
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `custom_gif_${Date.now()}.gif`,
          fileType: "image/gif",
          fileData: result.dataUrl
        })
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        throw new Error(errJson.error || "خطا در آپلود گیف به سرور. لطفاً زمان گیف را کوتاه‌تر کنید.");
      }

      const uploadData = await uploadRes.json();
      setConvertProgress(100);

      const finalGifUrl = uploadData.downloadUrl || uploadData.fileUrl;
      if (!finalGifUrl || finalGifUrl.startsWith("data:")) {
        throw new Error("آدرس آپلود شده گیف نامعتبر است.");
      }

      // Save to library and select
      saveGifToLibrary(finalGifUrl);
      onSelectGif(finalGifUrl);
      
      closeTrimmer();
      onClose();
    } catch (err: any) {
      console.error("GIF conversion error:", err);
      setConvertError(err.message || "خطا در تبدیل فایل به گیف انیمیشنی");
    } finally {
      setIsConverting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const closeTrimmer = () => {
    if (trimmerVideoUrl) {
      URL.revokeObjectURL(trimmerVideoUrl);
    }
    setTrimmerFile(null);
    setTrimmerVideoUrl(null);
  };

  // Loop preview video within trim bounds
  useEffect(() => {
    if (!videoRef.current || !trimmerVideoUrl) return;
    const vid = videoRef.current;

    const handleTimeUpdate = () => {
      if (!vid || vid.readyState < 1) return;
      try {
        if (vid.currentTime >= endTime || vid.currentTime < startTime) {
          vid.currentTime = startTime;
        }
      } catch (e) {
        // ignore seek error
      }
    };

    vid.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      vid.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [trimmerVideoUrl, trimmerFile, startTime, endTime]);

  // Fetch GIFs from backend /api/gifs proxy (aggregating Google Tenor + Giphy)
  const fetchGifs = async (query: string, currentOffset: number, append = false) => {
    if (selectedCat === 'my_saved') return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/gifs?q=${encodeURIComponent(query)}&offset=${currentOffset}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.gifs) && data.gifs.length > 0) {
          setOnlineGifs(prev => append ? [...prev, ...data.gifs] : data.gifs);
          setHasMore(data.gifs.length >= 10);
        } else if (!append) {
          setOnlineGifs([]);
          setHasMore(false);
        }
      }
    } catch (e) {
      console.warn("GIF fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (selectedCat === 'my_saved') return;
    setOffset(0);
    const activeQuery = searchQuery.trim() || (CATEGORIES.find(c => c.id === selectedCat)?.query || '');
    const timer = setTimeout(() => {
      fetchGifs(activeQuery, 0, false);
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(timer);
  }, [isOpen, searchQuery, selectedCat]);

  const handleLoadMore = () => {
    const nextOffset = offset + 24;
    setOffset(nextOffset);
    const activeQuery = searchQuery.trim() || (CATEGORIES.find(c => c.id === selectedCat)?.query || '');
    fetchGifs(activeQuery, nextOffset, true);
  };

  if (!isOpen) return null;

  const currentGifs = selectedCat === 'my_saved'
    ? savedGifs
    : (onlineGifs.length > 0 ? onlineGifs : (CURATED_GIFS[selectedCat] || CURATED_GIFS.trending));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          className={`bg-slate-900 border border-slate-700/70 rounded-3xl w-full overflow-hidden shadow-2xl flex flex-col relative transition-all duration-300 ${
            trimmerFile ? 'max-w-4xl h-[90vh] max-h-[820px]' : 'max-w-lg max-h-[85vh]'
          }`}
        >
          {/* VIDEO TRIMMER EDITOR OVERLAY */}
          {trimmerFile && trimmerVideoUrl && (
            <div className="absolute inset-0 z-[60] bg-slate-950 p-5 md:p-6 flex flex-col justify-between overflow-y-auto scrollbar-thin">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>{appLanguage === 'en' ? 'Professional GIF Studio & Trimmer' : 'ویرایشگر و برش ویدیو برای ساخت گیف باکیفیت'}</span>
                      <span className="text-[10px] font-mono bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">
                        {targetMaxDim >= 480 ? 'HD 480p' : '360p'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {appLanguage === 'en'
                        ? 'Select range and rendering quality for your custom GIF animation'
                        : 'بازه زمانی مورد نظر و کیفیت خروجی را برای تبدیل به گیف انیمیشنی انتخاب کنید'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeTrimmer}
                  disabled={isConverting}
                  className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Workspace Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 my-4 items-start flex-1 min-h-0">
                {/* Large Video Theater Stage (7 cols on md) */}
                <div className="md:col-span-7 flex flex-col gap-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center min-h-[220px] max-h-[360px] md:max-h-[420px] shadow-2xl group">
                    <video
                      ref={videoRef}
                      src={trimmerVideoUrl}
                      autoPlay
                      muted
                      playsInline
                      onLoadedMetadata={(e) => {
                        const dur = e.currentTarget.duration || 4;
                        setVideoDuration(dur);
                        setEndTime(Math.min(4, dur));
                      }}
                      className="w-full h-full max-h-[360px] md:max-h-[420px] object-contain rounded-2xl"
                    />

                    {/* Play / Step controls overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2 bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (!videoRef.current) return;
                            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 0.5);
                          }}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/60 text-[10px] font-mono"
                          title="۰.۵ ثانیه قبل"
                        >
                          -0.5s
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!videoRef.current) return;
                            if (isPlayingTrim) {
                              videoRef.current.pause();
                              setIsPlayingTrim(false);
                            } else {
                              videoRef.current.play();
                              setIsPlayingTrim(true);
                            }
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow"
                        >
                          {isPlayingTrim ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          <span>{isPlayingTrim ? (appLanguage === 'en' ? 'Pause' : 'توقف') : (appLanguage === 'en' ? 'Play' : 'پخش')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!videoRef.current) return;
                            videoRef.current.currentTime = Math.min(videoDuration, videoRef.current.currentTime + 0.5);
                          }}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/60 text-[10px] font-mono"
                          title="۰.۵ ثانیه بعد"
                        >
                          +0.5s
                        </button>
                      </div>

                      <div className="text-[11px] font-mono text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                        {(videoRef.current?.currentTime || startTime).toFixed(1)}s / {videoDuration.toFixed(1)}s
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Control & Quality Panel (5 cols on md) */}
                <div className="md:col-span-5 space-y-4">
                  {/* Quality & Resolution Mode */}
                  <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Sparkles className="w-4 h-4" />
                        <span>کیفیت گیف و رنگ‌بندی:</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTargetMaxDim(480)}
                        className={`p-2.5 rounded-xl border text-right transition flex flex-col gap-0.5 ${
                          targetMaxDim >= 480
                            ? 'bg-amber-500/15 border-amber-500/60 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-black flex items-center justify-between">
                          <span>کیفیت HD (480p)</span>
                          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">پیشنهادی</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">رنگ‌های تفکیک‌شده عالی و حرکات روان</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetMaxDim(320)}
                        className={`p-2.5 rounded-xl border text-right transition flex flex-col gap-0.5 ${
                          targetMaxDim < 480
                            ? 'bg-amber-500/15 border-amber-500/60 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-black">کیفیت معمولی (360p)</span>
                        <span className="text-[10px] text-slate-400 font-normal">حجم کمتر برای چت سریع</span>
                      </button>
                    </div>
                  </div>

                  {/* Trimmer Controls */}
                  <div className="space-y-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                      <span>برش بازه زمانی:</span>
                      <span className="font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                        {startTime.toFixed(1)}s - {endTime.toFixed(1)}s (طول: {(endTime - startTime).toFixed(1)} ثانیه)
                      </span>
                    </div>

                    {/* Range Scrubbers */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>زمان شروع</span>
                          <span className="font-mono text-amber-400">{startTime.toFixed(1)} ثانیه</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(0, endTime - 0.5)}
                          step="0.1"
                          value={startTime}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setStartTime(val);
                            if (videoRef.current) videoRef.current.currentTime = val;
                          }}
                          className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>زمان پایان</span>
                          <span className="font-mono text-pink-400">{endTime.toFixed(1)} ثانیه</span>
                        </div>
                        <input
                          type="range"
                          min={startTime + 0.5}
                          max={videoDuration || 10}
                          step="0.1"
                          value={endTime}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setEndTime(val);
                            if (videoRef.current) videoRef.current.currentTime = val;
                          }}
                          className="w-full accent-pink-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400 font-bold block mb-1.5">میانبر سریع بازه:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setStartTime(0);
                            setEndTime(Math.min(4, videoDuration || 4));
                          }}
                          className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 font-bold"
                        >
                          ۴ ثانیه اول
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const mid = (videoDuration || 4) / 2;
                            setStartTime(Math.max(0, mid - 2));
                            setEndTime(Math.min(videoDuration || 4, mid + 2));
                          }}
                          className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 font-bold"
                        >
                          میانه ویدیو
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const dur = videoDuration || 4;
                            setStartTime(Math.max(0, dur - 4));
                            setEndTime(dur);
                          }}
                          className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 font-bold"
                        >
                          ۴ ثانیه آخر
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress or Actions */}
              {isConverting ? (
                <div className="mt-2 p-4 bg-indigo-950/80 border border-indigo-500/40 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 animate-spin text-amber-400" />
                      <span>در حال فریم‌برداری فشرده و تفکیک رنگ باکیفیت گیف...</span>
                    </span>
                    <span className="font-mono text-amber-300 text-sm font-black">{convertProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-400 via-purple-500 to-pink-500 h-full transition-all duration-300"
                      style={{ width: `${convertProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={closeTrimmer}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (trimmerFile) {
                        processGifConversion(trimmerFile, { startTime, endTime, targetMaxDim });
                      }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/25 transition flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4 text-amber-300" />
                    <span>تأیید و ساخت گیف انیمیشنی HD 🎬</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{appLanguage === 'en' ? 'Send Animated GIF' : 'ارسال گیف انیمیشنی (GIF)'}</span>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    Giphy & Tenor
                  </span>
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden file input for custom video/photo to GIF conversion */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCustomFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />

          {/* Convert Any Photo/Video to GIF Banner */}
          <div className="px-3 pt-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isConverting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/20 flex items-center justify-between border border-indigo-400/30 transition duration-200 group"
            >
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
                <span>{appLanguage === 'en' ? 'Create GIF from Any Video/Photo ✨' : 'تبدیل هر فرمت ویدیو یا عکس به گیف ✨'}</span>
              </div>
              <span className="bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold border border-white/20">
                {appLanguage === 'en' ? 'Upload & Convert' : 'انتخاب فایل 📁'}
              </span>
            </button>

            {/* Converting Progress State */}
            {isConverting && (
              <div className="mt-2.5 p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>{appLanguage === 'en' ? 'Converting video/photo to animated GIF...' : 'در حال فریم‌برداری و ساخت گیف انیمیشنی...'}</span>
                  </span>
                  <span className="font-mono text-amber-300">{convertProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full transition-all duration-300"
                    style={{ width: `${convertProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Conversion Error */}
            {convertError && (
              <div className="mt-2 p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl font-bold text-right">
                ⚠️ {convertError}
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="p-3 bg-slate-950/30">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder={appLanguage === 'en' ? 'Search billions of GIFs (Giphy & Tenor)...' : 'جستجو در میلیاردها گیف گوگل و گیفی...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          {!searchQuery && (
            <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-none border-b border-slate-800/60">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCat(cat.id); setOnlineGifs([]); }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition shrink-0 flex items-center gap-1 ${
                    selectedCat === cat.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{appLanguage === 'en' ? cat.labelEn : cat.labelFa}</span>
                  {cat.id === 'my_saved' && savedGifs.length > 0 && (
                    <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded-full font-mono">
                      {savedGifs.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* GIF Grid */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {currentGifs.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {currentGifs.map((gifUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500 transition shadow-md"
                    >
                      <picture className="w-full h-full block">
                        <img
                          src={gifUrl}
                          alt={`تصویر متحرک گیف برای گفتگو در پیام‌رسان پریوو — شماره ${idx + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          loading="lazy"
                          decoding="async"
                          onClick={() => {
                            saveGifToLibrary(gifUrl);
                            onSelectGif(gifUrl);
                            onClose();
                          }}
                        />
                      </picture>

                      {/* Hover Actions Overlay */}
                      <div className="absolute inset-0 bg-slate-950/85 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-2">
                        <button
                          type="button"
                          onClick={() => {
                            saveGifToLibrary(gifUrl);
                            onSelectGif(gifUrl);
                            onClose();
                          }}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg shadow transition"
                        >
                          {appLanguage === 'en' ? 'Send GIF' : 'ارسال گیف'}
                        </button>

                        <div className="flex items-center gap-1 w-full">
                          <a
                            href={gifUrl}
                            download={`gif_${idx}.gif`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-bold rounded-lg transition flex items-center justify-center gap-1 border border-slate-700/60"
                            title="دانلود گیف"
                          >
                            <Download className="w-3 h-3 text-emerald-400" />
                            <span>دانلود</span>
                          </a>

                          {selectedCat === 'my_saved' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeGifFromLibrary(gifUrl);
                              }}
                              className="p-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800 transition"
                              title="حذف از گیف‌های من"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                saveGifToLibrary(gifUrl);
                              }}
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 transition"
                              title="ذخیره در گیف‌های من"
                            >
                              <BookmarkCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCat !== 'my_saved' && hasMore && (
                  <div className="text-center pt-2">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/60 transition shadow flex items-center justify-center gap-2 mx-auto"
                    >
                      {isLoading ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                          <span>{appLanguage === 'en' ? 'Loading more...' : 'در حال دریافت گیف‌های بیشتر...'}</span>
                        </>
                      ) : (
                        <span>{appLanguage === 'en' ? 'Load More GIFs 🔥' : 'مشاهده گیف‌های بیشتر 🔥'}</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : isLoading ? (
              <div className="py-12 text-center text-xs text-indigo-400 font-bold animate-pulse flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{appLanguage === 'en' ? 'Searching millions of GIFs...' : 'در حال جستجو در میلیاردها گیف...'}</span>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                {selectedCat === 'my_saved'
                  ? (appLanguage === 'en' ? 'No saved GIFs yet. Convert any photo/video to save it here!' : 'هنوز هیچ گیفی ذخیره نکرده‌اید. عکس یا ویدیویی تبدیل کنید تا اینجا ذخیره شود!')
                  : (appLanguage === 'en' ? 'No GIFs found' : 'گیفی یافت نشد')}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
