"use client";

import { useState, useEffect, useCallback } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import FileList, { type FileItem } from "@/components/FileList";
import { formatFileName } from "@/lib/utils";

const API_BASE = "";

export default function HomePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const fetchAudioUrl = useCallback(async (fileId: string) => {
    try {
      setAudioUrl(`${API_BASE}/api/files/${fileId}`);
    } catch (err) {
      console.error("Failed to fetch audio:", err);
    }
  }, []);

  useEffect(() => {
    if (files.length > 0 && !currentFile) {
      setCurrentFile(files[0]);
    }
  }, [files, currentFile]);

  useEffect(() => {
    if (currentFile) {
      fetchAudioUrl(currentFile.id);
    }
  }, [currentFile, fetchAudioUrl]);

  const handleFileSelect = useCallback((file: FileItem) => {
    setCurrentFile(file);
  }, []);

  const handlePrev = useCallback(() => {
    if (!currentFile) return;
    const currentIndex = files.findIndex((f) => f.id === currentFile.id);
    if (currentIndex > 0) {
      setCurrentFile(files[currentIndex - 1]);
    }
  }, [currentFile, files]);

  const handleNext = useCallback(() => {
    if (!currentFile) return;
    const currentIndex = files.findIndex((f) => f.id === currentFile.id);
    if (currentIndex < files.length - 1) {
      setCurrentFile(files[currentIndex + 1]);
    }
  }, [currentFile, files]);

  const handleEnded = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleClear = useCallback(() => {
    setAudioUrl(null);
    setCurrentFile(null);
  }, []);

  const currentIndex = currentFile ? files.findIndex((f) => f.id === currentFile.id) : -1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1612' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p style={{ color: '#92400e' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ backgroundColor: '#1a1612' }}>
        <div className="w-16 h-16 mb-6 rounded-full bg-red-900/30 flex items-center justify-center border-2 border-red-800">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-500" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-amber-100 mb-2" style={{ color: '#fcd34d' }}>Erro de conexão</h2>
        <p className="text-amber-700 mb-6 max-w-md" style={{ color: '#92400e' }}>{error}</p>
        <button
          onClick={fetchFiles}
          className="px-6 py-3 rounded-lg font-bold transition-all"
          style={{ backgroundColor: '#b45309', color: '#fef3c7' }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a1612' }}>
      <div className="p-4 border-b" style={{ borderColor: '#3d2b1f', backgroundColor: '#2d1f14' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#92400e' }}>
              <svg viewBox="0 0 24 24" className="w-7 h-7" style={{ color: '#fef3c7' }} fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#fef3c7', fontFamily: 'Georgia, serif' }}>ITATIAIA</h1>
              <p className="text-xs" style={{ color: '#92400e' }}>Rádio fm · 610 kHz</p>
            </div>
          </div>

          <button
            onClick={fetchFiles}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#b45309' }}
            title="Atualizar"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="rounded-2xl p-8 w-full max-w-md" style={{ backgroundColor: '#2d1f14', border: '3px solid #4a3728', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4" style={{ backgroundColor: '#1a1612', border: '4px solid #4a3728' }}>
                  <div className="w-24 h-24 rounded-full animate-pulse" style={{ backgroundColor: '#78350f' }} />
                </div>
                <h2 className="text-lg font-bold mb-1" style={{ color: '#fef3c7', fontFamily: 'Georgia, serif' }}>
                  {currentFile ? formatFileName(currentFile.name) : "Nenhuma faixa"}
                </h2>
                <p className="text-sm" style={{ color: '#92400e' }}>Rádio Itatiaia FM</p>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: '#1a1612', border: '2px solid #3d2b1f' }}>
                <AudioPlayer
                  src={audioUrl}
                  onPrev={handlePrev}
                  onNext={handleNext}
                  hasPrev={currentIndex > 0}
                  hasNext={currentIndex < files.length - 1}
                  onEnded={handleEnded}
                  onClear={handleClear}
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l" style={{ borderColor: '#3d2b1f', backgroundColor: '#251a11' }}>
          <div className="p-3 border-b" style={{ borderColor: '#3d2b1f' }}>
            <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: '#b45309' }}>
              Gravações ({files.length})
            </h3>
          </div>
          <div className="p-2">
            <FileList
              files={files}
              currentFileId={currentFile?.id}
              onSelect={handleFileSelect}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}