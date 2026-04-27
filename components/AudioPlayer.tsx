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
}

export default function AudioPlayer({
  src,
  onEnded,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
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
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        setBuffered(bufferedEnd);
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

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
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

  return (
    <div className="flex flex-col gap-6 w-full">
      <audio ref={audioRef} preload="metadata" />

      {error && (
        <div className="text-center text-red-400 text-sm py-2 bg-red-500/10 rounded-lg">
          {error}
        </div>
      )}

      <div className="h-2 bg-white/10 rounded-full cursor-pointer group relative" onClick={seek}>
        <div
          className="h-full bg-white/20 rounded-full absolute"
          style={{ width: duration ? `${(buffered / duration) * 100}%` : "0%" }}
        />
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full relative transition-all"
          style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
        </div>
      </div>

      <div className="flex justify-between text-sm text-slate-400 font-mono">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration || 0)}</span>
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            hasPrev ? "bg-white/10 hover:bg-white/20 text-white active:scale-90" : "bg-white/5 text-white/30 cursor-not-allowed"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
          </svg>
        </button>

        <button
          onClick={skipBack}
          disabled={!src}
          className={`px-4 py-3 rounded-full flex items-center justify-center transition-all text-sm font-bold ${
            src ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white" : "bg-white/5 text-white/30 cursor-not-allowed"
          }`}
          title={`-${SKIP_SECONDS}s`}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
          </svg>
          <span className="ml-1">{SKIP_SECONDS}</span>
        </button>

        <button
          onClick={togglePlay}
          disabled={!src}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            src
              ? "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 active:scale-95 shadow-lg shadow-indigo-500/30"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          ) : playing ? (
            <svg viewBox="0 0 24 24" className="w-12 h-12" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-12 h-12 ml-1" fill="currentColor">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          )}
        </button>

        <button
          onClick={skipForward}
          disabled={!src}
          className={`px-4 py-3 rounded-full flex items-center justify-center transition-all text-sm font-bold ${
            src ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white" : "bg-white/5 text-white/30 cursor-not-allowed"
          }`}
          title={`+${SKIP_SECONDS}s`}
        >
          <span className="mr-1">{SKIP_SECONDS}</span>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
          </svg>
        </button>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            hasNext ? "bg-white/10 hover:bg-white/20 text-white active:scale-90" : "bg-white/5 text-white/30 cursor-not-allowed"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zm8.5 0V6h2v12h-2v-6z" />
          </svg>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <span className="text-sm font-mono">{playbackRate}x</span>
          </button>
          {showSpeedMenu && (
            <div className="absolute bottom-full mb-2 right-0 bg-[#14141f] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRate(rate)}
                  className={`block w-full px-4 py-2.5 text-sm font-mono transition-colors ${
                    rate === playbackRate ? "bg-indigo-500/20 text-indigo-400" : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}