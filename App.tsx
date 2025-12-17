import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import Loader from './components/Loader';
import { extractScheduleFromDocs } from './services/geminiService';
import { ScheduleEvent } from './types';
import { processAndPadSchedule } from './utils/scheduleProcessor';

type AppState = 'idle' | 'loading' | 'success' | 'error';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [scheduleData, setScheduleData] = useState<ScheduleEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');

  const handlePdfSelect = useCallback((file: File) => {
    setPdfFile(file);
    setError(null);
  }, []);

  const handleImageSelect = useCallback((file: File) => {
    setImageFile(file);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!pdfFile) return;

    setAppState('loading');
    setError(null);

    try {
      const rawData = await extractScheduleFromDocs(pdfFile, imageFile, additionalInstructions);
      const processedData = processAndPadSchedule(rawData);
      setScheduleData(processedData);
      setAppState('success');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de l\'analyse.');
      setAppState('error');
    }
  }, [pdfFile, imageFile, additionalInstructions]);
  
  const handleReset = useCallback(() => {
    setAppState('idle');
    setScheduleData([]);
    setError(null);
    setPdfFile(null);
    setImageFile(null);
    setAdditionalInstructions('');
  }, []);

  const renderContent = () => {
    switch (appState) {
      case 'idle':
        return <FileUpload 
                  pdfFile={pdfFile}
                  imageFile={imageFile}
                  onPdfSelect={handlePdfSelect}
                  onImageSelect={handleImageSelect}
                  onAnalyze={handleAnalyze}
                  disabled={false}
                  instructions={additionalInstructions}
                  onInstructionsChange={setAdditionalInstructions} 
                />;
      case 'loading':
        return <div className="max-w-md mx-auto w-full scale-110"><Loader message={`Analyse structurelle en cours...`} /></div>;
      case 'success':
        return <DataTable data={scheduleData} fileName={pdfFile?.name || 'Document'} onReset={handleReset} />;
      case 'error':
        return (
          <div className="text-center max-w-lg mx-auto p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-200 dark:border-red-900/50">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Échec du Système</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed font-mono text-sm">{error}</p>
            <button
              onClick={handleReset}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-lg hover:shadow-red-500/30"
            >
              Réinitialiser le protocole
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className={`min-h-screen w-full flex flex-col relative overflow-hidden transition-colors duration-700 font-sans ${appState === 'loading' ? 'bg-slate-950' : 'bg-slate-50 dark:bg-slate-950'}`}>
      
      {/* Background Gradients Modernes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-400/20 dark:bg-blue-900/20 blur-[120px] transition-all duration-1000 ${appState === 'loading' ? 'opacity-30 scale-125 bg-cyan-600/20' : ''}`} />
        <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-400/20 dark:bg-purple-900/20 blur-[120px] transition-all duration-1000 ${appState === 'loading' ? 'opacity-30 scale-125 bg-fuchsia-600/20' : ''}`} />
      </div>

      <div className="relative z-10 w-full flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[95rem] mx-auto flex justify-center">
          {renderContent()}
        </div>
      </div>
      
      <footer className="relative z-10 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <p className="flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${appState === 'loading' ? 'bg-cyan-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></span>
            Propulsé par Google Gemini 3 Pro
        </p>
      </footer>
    </main>
  );
};

export default App;