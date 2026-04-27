"use client";

import { formatFileName } from "@/lib/utils";

export interface FileItem {
  id: string;
  name: string;
  createdTime: string;
  size: number | null;
}

interface FileListProps {
  files: FileItem[];
  currentFileId?: string;
  onSelect: (file: FileItem) => void;
}

export default function FileList({ files, currentFileId, onSelect }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <svg viewBox="0 0 24 24" className="w-16 h-16 mb-4 opacity-30" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
        <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const isActive = file.id === currentFileId;
        return (
          <button
            key={file.id}
            onClick={() => onSelect(file)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
              isActive
                ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/30"
                : "bg-white/5 hover:bg-white/10 border border-transparent"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isActive ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400"
            }`}>
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${isActive ? "text-white" : "text-slate-200"}`}>
                {formatFileName(file.name)}
              </p>
              <p className="text-sm text-slate-500">{file.name}</p>
            </div>
            {isActive && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse delay-75" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}