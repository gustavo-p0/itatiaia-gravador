"use client";

import { useState, useEffect, useRef } from "react";

interface AudioPlayerProps {
  src?: string | null;
  fileId?: string;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onEnded?: () => void;
  onClear?: () => void;
  onSongRecognized?: (song: { title: string; artist: string; album: string | null } | null) => void;
  loadingAudio?: boolean;
  onAudioReady?: () => void;
  onPlayingChange?: (playing: boolean) => void;
}

export default function AudioPlayer({
  src,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onEnded,
  onClear,
  onSongRecognized,
  loadingAudio,
  onAudioReady,
  onPlayingChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    setLoading(true);
    setError(null);
    setProgress(0);
    setDuration(0);
    setPlaying(false);

    audio.src = src;
    audio.load();
  }, [src]);

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleCanPlay = () => {
    setLoading(false);
    onAudioReady?.();
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleError = () => {
    setLoading(false);
    setError("Erro ao carregar áudio");
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    onPlayingChange?.(false);
    onEnded?.();
  };

  const handlePlay = () => {
    setPlaying(true);
    onPlayingChange?.(true);
  };

  const handlePause = () => {
    setPlaying(false);
    onPlayingChange?.(false);
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    try {
      if (playing) {
        await audio.pause();
      } else {
        await audio.play();
      }
    } catch (e) {
      console.error("Playback error:", e);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const skipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
    }
  };

  const skipForward = () => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 15);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setProgress(0);
      setPlaying(false);
      onPlayingChange?.(false);
    }
    onClear?.();
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!src) return null;

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="text-center text-xs py-1 rounded" style={{ backgroundColor: '#3d1008', color: '#fca5a5' }}>{error}</div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs w-10 text-right" style={{ color: '#6b5030' }}>{formatTime(progress)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={progress}
          onChange={seek}
          disabled={!src}
          className="flex-1 h-2 appearance-none cursor-pointer touch-manipulation disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #8b6914 ${(progress / duration) * 100}%, #4a3020 ${(progress / duration) * 100}%)`,
          }}
        />
        <span className="text-xs w-10" style={{ color: '#6b5030' }}>{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button onClick={onPrev} disabled={!hasPrev} className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: hasPrev ? '#3d2b1f' : '#2d1b14', border: '1px solid #4a3020', color: hasPrev ? '#b8860b' : '#4a3020' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>

        <button onClick={skipBack} disabled={!src} className="w-10 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#2d1b14', border: '1px solid #4a3020', color: src ? '#b8860b' : '#4a3020' }}>
          -15
        </button>

        <button onClick={togglePlay} disabled={!src} className="w-12 h-12 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: src ? '#b8860b' : '#2d1b14', border: '3px solid #8b6914', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }}>
          {loading || loadingAudio ? (
            <div className="w-6 h-6 border-2 border-amber-700 border-t-amber-500 rounded-full animate-spin" />
          ) : playing ? (
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-100" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-100" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>

        <button onClick={skipForward} disabled={!src} className="w-10 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#2d1b14', border: '1px solid #4a3020', color: src ? '#b8860b' : '#4a3020' }}>
          +15
        </button>

        <button onClick={onNext} disabled={!hasNext} className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: hasNext ? '#3d2b1f' : '#2d1b14', border: '1px solid #4a3020', color: hasNext ? '#b8860b' : '#4a3020' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>

        <button onClick={stop} disabled={!src} className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: src ? '#3d1008' : '#2d1b14', border: '1px solid #6b2008', color: src ? '#fca5a5' : '#4a3020' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
        </button>
      </div>

      <audio
        ref={audioRef}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        preload="metadata"
      />
    </div>
  );
}