'use client';

import { useRef } from 'react';

interface Props {
  onCapture: (file: File) => void;
  label?: string;
  className?: string;
}

export default function CameraCapture({ onCapture, label = 'Add photo', className = '' }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  }

  return (
    <div className={'flex gap-2 ' + className}>
      <button
        onClick={() => cameraRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-sm rounded-xl transition-all"
      >
        Take photo
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 border border-[#3D3530] hover:border-purple-700 text-gray-400 hover:text-[#F5F0EB] text-sm rounded-xl transition-all"
      >
        {label}
      </button>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
