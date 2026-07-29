import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Disc, Music } from "lucide-react";

interface MusicPlayerProps {
  url: string;
  fileName: string;
  fileSize?: number;
}

export default function MusicPlayer({ url, fileName, fileSize }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLInputElement | null>(null);

  // Initialize and clean up audio
  useEffect(() => {
    const audio = new Audio(url);
    audio.volume = volume;
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    const onTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, [url]);

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Pause any other playing audio in the document if needed
      const allAudios = document.querySelectorAll("audio");
      allAudios.forEach(el => el.pause());

      audioRef.current.play().catch(err => {
        console.error("Audio playback failed:", err);
      });
      setIsPlaying(true);
    }
  };

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Mute / Unmute
  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Format time (mm:ss)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formattedSize = fileSize 
    ? (fileSize / 1024 / 1024).toFixed(2) + " MB" 
    : "ناشناخته";

  return (
    <div className="p-3 bg-slate-900/95 border border-slate-800 rounded-2xl w-full max-w-[280px] text-right dir-rtl space-y-2.5 shadow-xl select-none" dir="rtl">
      {/* Track info with Disc spinning effect */}
      <div className="flex items-center gap-3">
        {/* Rotating CD Vinyl */}
        <div className="relative shrink-0">
          <div className={`w-11 h-11 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg relative overflow-hidden ${isPlaying ? "animate-spin" : ""}`} style={{ animationDuration: "4s" }}>
            {/* Grooves */}
            <div className="absolute inset-1.5 rounded-full border border-slate-900/50"></div>
            <div className="absolute inset-3 rounded-full border border-slate-900/50"></div>
            {/* Center label */}
            <div className="w-3.5 h-3.5 rounded-full bg-indigo-500/80 border border-slate-950 flex items-center justify-center z-10">
              <div className="w-1 h-1 rounded-full bg-slate-950"></div>
            </div>
            <Music className="w-4 h-4 text-indigo-400 absolute opacity-40" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold text-slate-100 block truncate leading-tight" title={fileName}>
            {fileName}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
            {formattedSize} • موسیقی دیجیتال
          </span>
        </div>
      </div>

      {/* Progress Bar & Seeker */}
      <div className="space-y-1">
        <input
          type="range"
          ref={progressRef}
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
        />
        <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Container */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all shadow-md ${isPlaying ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/40" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40"}`}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Volume & Status */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 hover:text-slate-200 transition"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <span className="text-[8px] font-bold text-slate-500 bg-slate-950/50 px-1.5 py-0.5 rounded-md">
            {isPlaying ? "در حال پخش" : "آماده"}
          </span>
        </div>
      </div>
    </div>
  );
}
