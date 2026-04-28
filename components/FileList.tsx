"use client";

import { useState } from "react";
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
  const [visibleCount, setVisibleCount] = useState(3);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <svg viewBox="0 0 24 24" className="w-12 h-12 mb-2" style={{ color: '#4a3020' }} fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
        <p style={{ color: '#5a4030' }}>Nenhum arquivo</p>
      </div>
    );
  }

  const visibleFiles = files.slice(0, visibleCount);

  return (
    <div className="flex flex-col">
      <div className="space-y-1 max-h-[140px] overflow-y-auto">
        {visibleFiles.map((file) => {
          const isActive = file.id === currentFileId;
          return (
            <button
              key={file.id}
              onClick={() => onSelect(file)}
              className="w-full flex items-center gap-2 p-2 rounded transition-all text-left"
              style={{
                backgroundColor: isActive ? '#3d2b1f' : 'transparent',
                border: isActive ? '1px solid #8b6b3d' : '1px solid transparent'
              }}
            >
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: isActive ? '#8b6b3d' : '#2d1b14', border: '1px solid #4a3020' }}>
                <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ color: isActive ? '#fef3c7' : '#6b5030' }} fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              <p className="text-sm truncate" style={{ color: isActive ? '#d4a84b' : '#a08060' }}>
                {formatFileName(file.name)}
              </p>
            </button>
          );
        })}
      </div>
      
      {files.length > 3 && visibleCount < files.length && (
        <button 
          onClick={() => setVisibleCount(prev => Math.min(prev + 3, files.length))}
          className="mt-2 text-xs py-1 rounded"
          style={{ color: '#8b6b3d' }}
        >
          Ver mais ({files.length - visibleCount} restantes)
        </button>
      )}
    </div>
  );
}