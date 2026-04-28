"use client";

import { useState, useEffect, useCallback } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import FileList, { type FileItem } from "@/components/FileList";
import InfoModal from "@/components/InfoModal";
import LoadingOverlay from "@/components/LoadingOverlay";

import { formatFileName } from "@/lib/utils";

const API_BASE = "";

export default function HomePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<{ title: string; artist: string; album: string | null } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/files`);
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError("Erro ao carregar arquivos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPwaPrompt(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setShowPwaPrompt(false);
        setDeferredPrompt(null);
      });
    }
  };

  const fetchAudioUrl = useCallback(async (fileId: string) => {
    setAudioUrl(`${API_BASE}/api/files/${fileId}/`);
  }, []);

  useEffect(() => {
    if (files.length > 0 && !currentFile) setCurrentFile(files[0]);
  }, [files, currentFile]);

  useEffect(() => {
    if (currentFile) fetchAudioUrl(currentFile.id);
  }, [currentFile, fetchAudioUrl]);

  const handleFileSelect = useCallback((file: FileItem) => {
    setCurrentFile(file);
    setLoadingAudio(true);
    setAudioUrl(`${API_BASE}/api/files/${file.id}/`);
  }, []);
  const handlePrev = useCallback(() => {
    if (!currentFile) return;
    const idx = files.findIndex(f => f.id === currentFile.id);
    if (idx > 0) setCurrentFile(files[idx - 1]);
  }, [currentFile, files]);
  const handleNext = useCallback(() => {
    if (!currentFile) return;
    const idx = files.findIndex(f => f.id === currentFile.id);
    if (idx < files.length - 1) setCurrentFile(files[idx + 1]);
  }, [currentFile, files]);
  const handleEnded = useCallback(() => handleNext(), [handleNext]);
  const handleClear = useCallback(() => { setAudioUrl(null); setCurrentFile(null); }, []);
  const currentIndex = currentFile ? files.findIndex(f => f.id === currentFile.id) : -1;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #2d251b 0%, #1a1510 100%)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <p style={{ color: '#a18060' }}>Carregando...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: 'linear-gradient(180deg, #2d251b 0%, #1a1510 100%)' }}>
      <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center border-2 border-red-800" style={{ backgroundColor: '#1a0a05' }}>
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-500" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
      </div>
      <h2 className="text-lg font-bold text-amber-200 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Erro de conexão</h2>
      <p className="mb-4" style={{ color: '#8b6b3d' }}>{error}</p>
      <button onClick={fetchFiles} className="px-4 py-2 rounded" style={{ backgroundColor: '#b8860b', color: '#fef3c7' }}>Tentar novamente</button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #3d2b1f 0%, #2d1b14 50%, #1a1209 100%)' }}>
      <header className="px-4 py-3 border-b-2" style={{ borderColor: '#4a3020', background: 'linear-gradient(180deg, #3d2b1f 0%, #2d1b14 100%)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between lg:justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #cd9b32 0%, #a07020 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}>
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-100" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
            </div>
            <h1 className="text-lg font-bold italic" style={{ fontFamily: 'Georgia, serif', color: '#d4a84b', textShadow: '0 0 10px rgba(212,168,75,0.5)' }}>Itatiaia - Dona da Noite</h1>
          </div>
          <button onClick={fetchFiles} className="p-2 rounded lg:absolute lg:right-4" style={{ color: '#8b6b3d' }} title="Atualizar">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" /></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-sm rounded-lg p-4" style={{ background: 'linear-gradient(180deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), 0 4px 8px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.1)' }}>
              <div className="rounded-2xl p-6 mb-4" style={{ background: 'linear-gradient(180deg, #2d251b 0%, #1a1510 100%)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)' }}>
                <div className="flex justify-center mb-4">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full disc-grooves animate-spin" style={{ animationDuration: playing ? '3s' : '20s', animationPlayState: playing ? 'running' : 'paused' }} />
                    <div className="absolute inset-[26%] rounded-full disc-center animate-spin" style={{ animationDuration: playing ? '3s' : '20s', animationPlayState: playing ? 'running' : 'paused' }} />
                    <div className="absolute inset-0 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-amber-900 border-2 border-amber-700" />
                    </div>
                  </div>
                </div>
                <h2 className="text-center italic font-bold mb-1" style={{ color: '#d4a84b', fontFamily: 'Georgia, serif' }}>
                  {currentFile ? formatFileName(currentFile.name) : "Nenhuma faixa"}
                </h2>
                <p className="text-center text-sm" style={{ color: '#8b6b3d' }}>Rádio Itatiaia FM</p>
              </div>
              <div className="rounded p-3 pt-3" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #d4a84b 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #a07020' }}>
                <AudioPlayer src={audioUrl} fileId={currentFile?.id} onPrev={handlePrev} onNext={handleNext} hasPrev={currentIndex > 0} hasNext={currentIndex < files.length - 1} onEnded={handleEnded} onClear={handleClear} onSongRecognized={setCurrentSong} loadingAudio={loadingAudio} onAudioReady={() => setLoadingAudio(false)} onPlayingChange={setPlaying} />
              </div>
              {loadingAudio && <LoadingOverlay />}
              <a
                href="https://wa.me/5531999967074?text=Oi%20Dona%20da%20Noite!"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg w-full mt-3 transition-all"
                style={{ background: '#128c7e', border: '1px solid #4a3020' }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-sm font-medium text-white">Enviar mensagem pro programa</span>
              </a>
              <InfoModal />
            </div>
          </div>
        </div>
        <aside className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l" style={{ borderColor: '#4a3020', background: 'linear-gradient(180deg, #2d1b14 0%, #1a0f08 100%)' }}>
          <div className="p-3 border-b" style={{ borderColor: '#3d2515' }}>
            <h3 className="text-xs uppercase tracking-widest" style={{ color: '#8b6b3d', fontFamily: 'sans-serif' }}>Gravações ({files.length})</h3>
          </div>
          <div className="p-2">
            <FileList files={files} currentFileId={currentFile?.id} onSelect={handleFileSelect} />
          </div>
        </aside>
      </main>

      {showPwaPrompt && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-auto max-w-xs p-3 rounded-lg shadow-lg z-50" style={{ background: 'linear-gradient(180deg, #3d2b1f 0%, #2d1b14 100%)', border: '1px solid #4a3020' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #cd9b32 0%, #a07020 100%)' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-100" fill="currentColor"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm-5 16H7v-2h5v2zm5-4H7v-2h10v2z" /></svg>
            </div>
            <p className="text-sm text-amber-200 flex-1">Instalar app para ter acesso fácil</p>
            <button onClick={handleInstallPwa} className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#b8860b', color: '#fef3c7' }}>Instalar</button>
            <button onClick={() => setShowPwaPrompt(false)} className="p-1 rounded" style={{ color: '#8b6b3d' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
            </button>
          </div>
        </div>
      )}

      <footer className="p-4 text-center" style={{ borderColor: '#4a3020' }}>
        <p className="text-xs" style={{ color: '#5a4030' }}>
          App independente. Sem vínculo com Rede Itasat ou Rádio Itatiaia. As gravações são de autoria do programa.
        </p>
      </footer>
    </div>
  );
}