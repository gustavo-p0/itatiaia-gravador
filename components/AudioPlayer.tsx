"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatDuration, PLAYBACK_RATES } from "@/lib/utils";

interface AudioPlayerProps {
  src: string | null;
  onEnded?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onClear?: () => void;
}

export default function AudioPlayer({
  src,
  onEnded,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onClear,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };
    const handleEnded = () => {
      setPlaying(false);
      onEnded?.();
    };
    const handleWaiting = () => { setLoading(true); setError(null); };
    const handlePlaying = () => { setLoading(false); setError(null); };
    const handleError = () => { 
      setLoading(false); 
      setPlaying(false);
      setError(audio.error?.message || 'Erro ao carregar');
    };
    const handleCanPlay = () => setLoading(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("progress", handleProgress);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("progress", handleProgress);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [onEnded]);

  useEffect(() => {
    if (audioRef.current && src) {
      audioRef.current.src = src;
      audioRef.current.load();
      audioRef.current.play().catch(() => setPlaying(false));
    }
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    if (playing) audio.pause();
    else audio.play().catch(() => {});
    setPlaying(!playing);
  }, [playing, src]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = parseFloat(e.target.value);
  }, [duration]);

  const handlePlaybackRate = useCallback((rate: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, []);

  const SKIP_SECONDS = 30;

  const skipBack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = Math.max(0, audio.currentTime - SKIP_SECONDS);
  }, [duration]);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = Math.min(duration, audio.currentTime + SKIP_SECONDS);
  }, [duration]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    }
    if (onClear) onClear();
  }, [onClear]);

return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <audio ref={audioRef} preload="metadata" />

      {error && (
        <div className="text-center text-red-400 text-xs py-2 bg-red-500/10 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-mono w-10 shrink-0">{formatDuration(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          disabled={!src}
          className="flex-1 h-2 appearance-none bg-white/10 rounded-full cursor-pointer touch-manipulation disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, rgb(99, 102, 241) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration ? (currentTime / duration) * 100 : 0}%)`
          }}
        />
        <span className="text-xs text-slate-400 font-mono w-10 shrink-0 text-right">{formatDuration(duration || 0)}</span>
      </div>

      <div className="flex items-center justify-center gap-1 min-w-0">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all ${
            hasPrev ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white/5 text-white/30 cursor-not-allowed"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
          </svg>
        </button>

        <button
          onClick={skipBack}
          disabled={!src}
          className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all text-xs font-bold ${
            src ? "bg-white/5 hover:bg-white/10 text-white/70" : "bg-white/5 text-white/30 cursor-not-allowed"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
          </svg>
        </button>

        <button
          onClick={togglePlay}
          disabled={!src}
          className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all ${
            src
              ? "bg-gradient-to-r from-indigo-500 to-violet-500 active:scale-95"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : playing ? (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6 ml-0.5" fill="currentColor">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          )}
        </button>

        <button
          onClick={skipForward}
          disabled={!src}
          className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all text-xs font-bold ${
            src ? "bg-white/5 hover:bg-white/10 text-white/70" : "bg-white/5 text-white/30 cursor-not-allowed"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
          </svg>
        </button>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all ${
            hasNext ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white/5 text-white/30 cursor-not-allowed"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zm8.5 0V6h2v12h-2v-6z" />
          </svg>
        </button>

        <button
          onClick={stop}
          disabled={!src}
          className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all ${
            src ? "bg-red-500/20 hover:bg-red-500/30 text-red-400" : "bg-white/5 text-white/30 cursor-not-allowed"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M6 6h12v12H6V6z" />
          </svg>
        </button>
      </div>
    </div>
  );
}