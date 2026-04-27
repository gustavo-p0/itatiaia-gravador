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
      setError("Erro ao carregar arquivos. Verifique se o Apps Script foi deployado.");
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const fetchAudioUrl = useCallback(async (fileId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/files/${fileId}`);
      const data = await res.json();
      if (data.url) {
        setAudioUrl(data.url);
      }
    } catch (err) {
      console.error("Failed to fetch audio URL:", err);
    }
  }, []);

  useEffect(() => {
    if (files.length > 0 && !currentFile) {
      setCurrentFile(files[0]);
    }
  }, [files, currentFile]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

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

  const currentIndex = currentFile ? files.findIndex((f) => f.id === currentFile.id) : -1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Carregando gravações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-400" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Erro de conexão</h2>
        <p className="text-slate-400 mb-6 max-w-md">{error}</p>
        <button
          onClick={fetchFiles}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium rounded-xl hover:from-indigo-400 hover:to-violet-400 transition-all"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Itatiaia Player</h1>
            <p className="text-xs text-slate-500">Rádio Itatiaia</p>
          </div>
        </div>

        <button
          onClick={fetchFiles}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Atualizar"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
        </button>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 animate-pulse-glow" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-16 h-16 text-white" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">
                {currentFile ? formatFileName(currentFile.name) : "Nenhuma faixa selecionada"}
              </h2>
              <p className="text-slate-500">Rádio Itatiaia</p>
            </div>

            <div className="w-full max-w-lg">
              <AudioPlayer
                src={audioUrl}
                onPrev={handlePrev}
                onNext={handleNext}
                hasPrev={currentIndex > 0}
                hasNext={currentIndex < files.length - 1}
                onEnded={handleEnded}
              />
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-black/20 overflow-y-auto">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Gravações ({files.length})
            </h3>
          </div>
          <div className="p-4">
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