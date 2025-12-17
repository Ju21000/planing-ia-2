import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div 
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <div className="flex flex-col items-center gap-2">
        <Upload className="w-8 h-8 text-blue-400" />
        <p className="text-gray-200">Clique pour ajouter un fichier</p>
      </div>
    </div>
  );
}
