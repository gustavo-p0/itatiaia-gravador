"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  src: string | null;
  onEnded?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onClear?: () => void;
  onSongRecognized?: (song: { title: string; artist: string; album: string | null }) => void;
}

export default function AudioPlayer({ src, onEnded, onPrev, onNext, hasPrev, hasNext, onClear, onSongRecognized }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const savedTime = localStorage.getItem(`audio_pos_${src}`);
    if (savedTime && src && audio.src) {
      const time = parseFloat(savedTime);
      if (!isNaN(time)) audio.currentTime = time;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (src) localStorage.setItem(`audio_pos_${src}`, audio.currentTime.toString());
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => { setPlaying(false); if (src) localStorage.removeItem(`audio_pos_${src}`); onEnded?.(); };
    const handleWaiting = () => { setLoading(true); setError(null); };
    const handlePlaying = () => { 
      setLoading(false); 
      setError(null);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
      if (audio.duration && isFinite(audio.duration) && duration === 0) {
        setDuration(audio.duration);
      }
    };
    const handleError = (e: Event) => { 
      const audioErr = (e.target as HTMLAudioElement)?.error;
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        if (playing || loading) {
          setError(null);
        }
      }, 2000);
      setLoading(false); 
      setPlaying(false); 
      const msg = audioErr?.message || 'Erro ao carregar';
      if (!msg.includes(' Aborted')) {
        setError(msg);
      }
    };
    const handleCanPlay = () => {
      setLoading(false);
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleCanPlayThrough = () => {
      setLoading(false);
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
    };
  }, [onEnded, src, onSongRecognized]);

  useEffect(() => {
    if (audioRef.current && src) {
      setCurrentTime(0);
      setDuration(0);
      setPlaying(false);
      setError(null);
      audioRef.current.src = src;
      audioRef.current.load();
      audioRef.current.play().catch(() => setPlaying(false));
    } else if (!src) {
      setCurrentTime(0);
      setDuration(0);
      setPlaying(false);
    }
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const checkDuration = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    
    const interval = setInterval(checkDuration, 500);
    checkDuration();
    
    return () => clearInterval(interval);
  }, [src]);

  useEffect(() => {
    if (playing && onSongRecognized) {
      startRecognition();
    } else {
      stopRecognition();
    }
    return () => stopRecognition();
  }, [playing, onSongRecognized]);

  const startRecognition = async () => {
    if (mediaRecorderRef.current) return;
    try {
      const audio = audioRef.current;
      if (!audio) return;
      
      const canCapture = typeof (audio as any).captureStream === 'function' || 
                        typeof (audio as any).mozCaptureStream === 'function' ||
                        typeof (audio as any).webkitCaptureStream === 'function';
      if (!canCapture) {
        console.log('captureStream not supported on this browser');
        return;
      }
      
      const stream = (audio as any).captureStream?.() || (audio as any).mozCaptureStream?.() || (audio as any).webkitCaptureStream?.();
      if (!stream || stream.getAudioTracks().length === 0) return;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await recognizeSong(blob);
        if (playing) {
          recognitionTimeoutRef.current = setTimeout(startRecognition, 30000);
        }
      };
      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 10000);
    } catch (err) {
      console.error('Recognition error:', err);
    }
  };

  const stopRecognition = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }
  };

  const recognizeSong = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      const res = await fetch('/api/recognize', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.song && onSongRecognized) {
        onSongRecognized(data.song);
      }
    } catch (err) {
      console.error('Recognition failed:', err);
    }
  };

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

  const SKIP_SECONDS = 10;

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
    if (audio) { audio.pause(); audio.currentTime = 0; setPlaying(false); }
    stopRecognition();
    if (src) localStorage.removeItem(`audio_pos_${src}`);
    if (onClear) onClear();
  }, [onClear, src]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <audio ref={audioRef} preload="metadata" />

      {error && (
        <div className="text-center text-xs py-1 rounded" style={{ backgroundColor: '#3d1008', color: '#fca5a5' }}>{error}</div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-xs font-mono shrink-0 min-w-[3ch] text-center text-black">{formatDuration(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={isFinite(duration) ? duration : 0}
          step={0.1}
          value={isFinite(currentTime) ? currentTime : 0}
          onChange={handleSeek}
          disabled={!src || !isFinite(duration)}
          className="flex-1 h-2 appearance-none rounded-full cursor-pointer touch-manipulation disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #b8860b ${isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0}%, #3d2b1f ${isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0}%)`
          }}
        />
        <span className="text-xs font-mono shrink-0 min-w-[3ch] text-right text-black">{formatDuration(duration || 0)}</span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <button onClick={onPrev} disabled={!hasPrev} className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: hasPrev ? '#3d2b1f' : '#2d1b14', border: '1px solid #4a3020', color: hasPrev ? '#b8860b' : '#4a3020' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" /></svg>
        </button>

        <button onClick={skipBack} disabled={!src} className="w-10 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#2d1b14', border: '1px solid #4a3020', color: src ? '#b8860b' : '#4a3020' }}>
          <span>-{SKIP_SECONDS}</span>
        </button>

        <button onClick={togglePlay} disabled={!src} className="w-12 h-12 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: src ? '#b8860b' : '#2d1b14', border: '3px solid #8b6914', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }}>
          {loading ? <div className="w-6 h-6 border-2 border-amber-700 border-t-amber-500 rounded-full animate-spin" />
          : playing ? <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
          : <svg viewBox="0 0 24 24" className="w-6 h-6 ml-0.5 text-amber-900" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>}
        </button>

        <button onClick={skipForward} disabled={!src} className="w-10 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#2d1b14', border: '1px solid #4a3020', color: src ? '#b8860b' : '#4a3020' }}>
          <span>+{SKIP_SECONDS}</span>
        </button>

        <button onClick={onNext} disabled={!hasNext} className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: hasNext ? '#3d2b1f' : '#2d1b14', border: '1px solid #4a3020', color: hasNext ? '#b8860b' : '#4a3020' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm8.5 0V6h2v12h-2v-6z" /></svg>
        </button>

        <button onClick={stop} disabled={!src} className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: src ? '#3d1008' : '#2d1b14', border: '1px solid #6b2008', color: src ? '#fca5a5' : '#4a3020' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M6 6h12v12H6V6z" /></svg>
        </button>
      </div>
    </div>
  );
}