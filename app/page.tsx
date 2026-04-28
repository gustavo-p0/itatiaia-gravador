"use client";

import { useState, useEffect, useCallback } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import FileList, { type FileItem } from "@/components/FileList";
import MusicRecognition from "@/components/MusicRecognition";
import { formatFileName } from "@/lib/utils";

const API_BASE = "";

export default function HomePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<{ title: string; artist: string; album: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <h1 className="text-lg font-bold italic" style={{ fontFamily: 'Georgia, serif', color: '#d4a84b', textShadow: '0 0 10px rgba(212,168,75,0.5)' }}>Itatiaia</h1>
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
                  <div className="w-24 h-24 rounded-full flex items-center justify-center relative" style={{ background: 'repeating-radial-gradient(circle, #111 0, #111 2px, #222 3px, #111 4px)', animation: 'spin 20s linear infinite' }}>
                    <div className="w-16 h-16 rounded-full border-4 border-amber-800/30 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d4a84b 0%, #8b6b3d 50%, #5a4020 100%)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }}>
                      <div className="w-4 h-4 rounded-full bg-amber-900 border border-amber-700/50" />
                    </div>
                  </div>
                </div>
                <h2 className="text-center italic font-bold mb-1" style={{ color: '#d4a84b', fontFamily: 'Georgia, serif' }}>
                  {currentFile ? formatFileName(currentFile.name) : "Nenhuma faixa"}
                </h2>
                <p className="text-center text-sm" style={{ color: '#8b6b3d' }}>Rádio Itatiaia FM</p>
              </div>
              <div className="rounded p-3" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #d4a84b 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.3)', border: '1px solid #a07020' }}>
                <AudioPlayer src={audioUrl} onPrev={handlePrev} onNext={handleNext} hasPrev={currentIndex > 0} hasNext={currentIndex < files.length - 1} onEnded={handleEnded} onClear={handleClear} onSongRecognized={setCurrentSong} />
              </div>
              <MusicRecognition song={currentSong} isListening={false} />
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
    </div>
  );
}