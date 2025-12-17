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
      className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
      onClick={() => inputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.txt,.csv,.md" // Tu peux adapter selon tes besoins
      />
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-gray-800 rounded-full">
          <Upload className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-200">
            Clique pour uploader un fichier
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, TXT, CSV (Max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
}
