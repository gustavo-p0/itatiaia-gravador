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
      <div className="flex flex-col items-center justify-center py-12">
        <svg viewBox="0 0 24 24" className="w-16 h-16 mb-4" style={{ color: '#4a3728' }} fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
        <p className="text-lg font-medium" style={{ color: '#4a3728' }}>Nenhum arquivo</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {files.map((file) => {
        const isActive = file.id === currentFileId;
        return (
          <button
            key={file.id}
            onClick={() => onSelect(file)}
            className="w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left"
            style={{
              backgroundColor: isActive ? '#3d2b1f' : 'transparent',
              border: isActive ? '1px solid #78350f' : '1px solid transparent'
            }}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{
                backgroundColor: isActive ? '#92400e' : '#2d1f14',
                border: '1px solid #4a3728'
              }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: isActive ? '#fef3c7' : '#92400e' }} fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: isActive ? '#fef3c7' : '#d6d3d1' }}>
                {formatFileName(file.name)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}