import React, { useState, useCallback } from 'react';
import UploadIcon from './icons/UploadIcon';
import CalendarIcon from './icons/CalendarIcon';

interface FileUploadProps {
  pdfFile: File | null;
  imageFile: File | null;
  onPdfSelect: (file: File) => void;
  onImageSelect: (file: File) => void;
  onAnalyze: () => void;
  disabled: boolean;
  instructions: string;
  onInstructionsChange: (value: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
    pdfFile, 
    imageFile, 
    onPdfSelect, 
    onImageSelect, 
    onAnalyze, 
    disabled, 
    instructions, 
    onInstructionsChange 
}) => {
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [isDraggingImg, setIsDraggingImg] = useState(false);

  const handleDragEnterPdf = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!disabled) setIsDraggingPdf(true);
  }, [disabled]);

  const handleDragLeavePdf = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDraggingPdf(false);
  }, []);

  const handleDropPdf = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDraggingPdf(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type === 'application/pdf') {
      onPdfSelect(files[0]);
    } else {
        alert("Veuillez déposer un fichier PDF.");
    }
  }, [onPdfSelect, disabled]);

  const handleDragEnterImg = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!disabled) setIsDraggingImg(true);
  }, [disabled]);

  const handleDragLeaveImg = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDraggingImg(false);
  }, []);

  const handleDropImg = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDraggingImg(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      onImageSelect(files[0]);
    } else {
        alert("Veuillez déposer une image valide.");
    }
  }, [onImageSelect, disabled]);

  const bgClassPdf = isDraggingPdf 
    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 scale-[1.02]' 
    : 'bg-white/40 dark:bg-slate-800/40 border-slate-300 dark:border-slate-600 hover:border-blue-400';
    
  const bgClassImg = isDraggingImg 
    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 scale-[1.02]' 
    : 'bg-white/40 dark:bg-slate-800/40 border-slate-300 dark:border-slate-600 hover:border-purple-400';

  return (
    <div className="w-full max-w-5xl mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-700/50">
        
        <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Extraction Planning RH
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
                Analysez et fusionnez vos plannings PDF et photos manuscrites avec <span className="font-bold text-blue-600 dark:text-blue-400">Gemini 3 Pro</span>.
            </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* PDF UPLOAD */}
            <div className="flex flex-col h-full">
                <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 ml-1">
                    1. Planning Principal (PDF) <span className="text-red-500">*</span>
                </label>
                <label
                    onDragEnter={handleDragEnterPdf}
                    onDragLeave={handleDragLeavePdf}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropPdf}
                    className={`group relative flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ease-out shadow-sm ${bgClassPdf} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="flex flex-col items-center justify-center px-4 text-center z-10">
                        {pdfFile ? (
                            <>
                                <div className="p-4 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl mb-3 shadow-sm">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                </div>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate max-w-[250px]">{pdfFile.name}</p>
                                <p className="text-sm text-slate-500 mt-1">Cliquez pour remplacer</p>
                            </>
                        ) : (
                            <>
                                <div className="mb-4 p-3 rounded-full bg-slate-100 dark:bg-slate-700/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                    <UploadIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                </div>
                                <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                                    Glissez votre PDF ici
                                </p>
                                <p className="text-sm text-slate-400 mt-1">ou cliquez pour parcourir</p>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => e.target.files?.[0] && onPdfSelect(e.target.files[0])}
                        accept="application/pdf"
                        disabled={disabled}
                    />
                </label>
            </div>

            {/* IMAGE UPLOAD */}
            <div className="flex flex-col h-full">
                <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 ml-1 flex justify-between items-center">
                    <span>2. Ajouts / Corrections (Image)</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">OPTIONNEL</span>
                </label>
                <label
                    onDragEnter={handleDragEnterImg}
                    onDragLeave={handleDragLeaveImg}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropImg}
                    className={`group relative flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ease-out shadow-sm ${bgClassImg} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="flex flex-col items-center justify-center px-4 text-center z-10">
                         {imageFile ? (
                            <>
                                <div className="p-4 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl mb-3 shadow-sm">
                                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate max-w-[250px]">{imageFile.name}</p>
                                <p className="text-sm text-slate-500 mt-1">Cliquez pour remplacer</p>
                            </>
                        ) : (
                            <>
                                <div className="mb-4 p-3 rounded-full bg-slate-100 dark:bg-slate-700/50 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                                    <svg className="w-8 h-8 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                                    Ajouter une photo
                                </p>
                                <p className="text-sm text-slate-400 mt-1">corrections manuscrites, etc.</p>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => e.target.files?.[0] && onImageSelect(e.target.files[0])}
                        accept="image/*"
                        disabled={disabled}
                    />
                </label>
            </div>
        </div>

        <div className="mb-10">
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 ml-1">
                Instructions Spécifiques
            </label>
            <textarea
                rows={2}
                className="block w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-inner placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                placeholder="Ex: 'Attention, le planning manuscrit pour Julien remplace celui du PDF'..."
                value={instructions}
                onChange={(e) => onInstructionsChange(e.target.value)}
                disabled={disabled}
            />
        </div>

        <button
            onClick={onAnalyze}
            disabled={!pdfFile || disabled}
            className={`w-full py-5 px-6 rounded-2xl flex items-center justify-center space-x-3 text-lg font-bold text-white transition-all transform shadow-xl ${
                !pdfFile || disabled 
                ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-70' 
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:scale-[1.01] hover:shadow-blue-500/30'
            }`}
        >
            {disabled ? (
                <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyse en cours...</span>
                </div>
            ) : (
                <>
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                   <span>Lancer l'Analyse Gemini 3 Pro</span>
                </>
            )}
        </button>
    </div>
  );
};

export default FileUpload;