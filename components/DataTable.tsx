import React, { useState } from 'react';
import { ScheduleEvent } from '../types';
import DownloadIcon from './icons/DownloadIcon';
import NotionIcon from './icons/NotionIcon';
import { createNotionPageFromData } from '../services/notionService';

interface DataTableProps {
  data: ScheduleEvent[];
  fileName: string;
  onReset: () => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, fileName, onReset }) => {
  const [notionToken, setNotionToken] = useState('');
  const [parentId, setParentId] = useState('');
  const [notionState, setNotionState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [notionUrl, setNotionUrl] = useState('');
  const [notionError, setNotionError] = useState('');

  // Vérification stricte : Présence = FNAC ou non.
  const isFnacPresence = (presence: string) => {
    return presence && presence.toUpperCase().includes('FNAC');
  };

  const handleDownloadCSV = () => {
    const headers = ['NOM', 'Date', 'Présence (FNAC)', 'Heure de Début', 'Heure de Fin', 'Heure de Repas', 'En Téléphonie', '% Tel', 'Description'];
    
    const escapeCSV = (value: string | null | undefined) => {
        if (value === null || value === undefined) return '""';
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
    };

    const formatCsvDate = (dateStr: string): string => {
        if (!dateStr) return '';
        const dateParts = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!dateParts) return dateStr;
        const [, day, month, year] = dateParts;
        return `${year}-${month}-${day}`;
    };

    const csvRows = [
      headers.join(','),
      ...data.map(event => {
        return [
            escapeCSV(event.nom),
            escapeCSV(formatCsvDate(event.date)),
            // EXPORT CSV STRICT : TRUE ou FALSE
            escapeCSV(isFnacPresence(event.presence) ? 'TRUE' : 'FALSE'), 
            escapeCSV(event.heureDebut),
            escapeCSV(event.heureFin),
            escapeCSV(event.heureRepas),
            escapeCSV(event.enTelephonie && event.enTelephonie !== 'aucun' ? event.enTelephonie : ''),
            escapeCSV(event.pourcentageTel !== undefined ? event.pourcentageTel.toFixed(2) : ''),
            escapeCSV(event.description),
        ].join(',');
      })
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName.replace(/\.[^/.]+$/, "")}_optimized.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateNotionPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotionState('loading');
    setNotionError('');
    setNotionUrl('');
    try {
        const url = await createNotionPageFromData(notionToken, parentId, data, fileName);
        setNotionUrl(url);
        setNotionState('success');
    } catch (error: any) {
        setNotionError(error.message || "Erreur de création Notion.");
        setNotionState('error');
    }
  };


  return (
    <div className="w-full max-w-[90rem] mx-auto space-y-8 animate-fade-in-up">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800">
        <div className="p-8 border-b border-slate-200/60 dark:border-slate-700/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Planning Optimisé</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full">Gemini 3 Pro</span>
            </div>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Source : <span className="font-semibold text-slate-700 dark:text-slate-200">{fileName}</span></p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
                onClick={onReset}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:ring-2 focus:ring-slate-200"
            >
                Nouveau fichier
            </button>
            <button
                onClick={handleDownloadCSV}
                disabled={data.length === 0}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-slate-900 dark:bg-blue-600 rounded-xl shadow-lg hover:bg-slate-800 dark:hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Export CSV
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/60 dark:divide-slate-700/60">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50">
              <tr>
                {['Nom', 'Date', 'Présence (FNAC)', 'Début', 'Fin', 'Repas', 'Téléphonie', '% Tel', 'Description Originale'].map((head) => (
                    <th key={head} scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {head}
                    </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-slate-100 dark:divide-slate-800/50">
              {data.map((event, index) => {
                const isFnac = isFnacPresence(event.presence);
                return (
                <tr key={index} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">{event.nom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-mono">{event.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {/* CASE A COCHER VISUELLE UNIQUEMENT POUR FNAC */}
                    <div className="flex items-center justify-start pl-4">
                        <div className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                            isFnac 
                            ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' 
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}>
                            {isFnac ? (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <span className="text-slate-400 dark:text-slate-500 text-[10px]">•</span>
                            )}
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 font-mono">{event.heureDebut || <span className="text-slate-300 dark:text-slate-600">-</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 font-mono">{event.heureFin || <span className="text-slate-300 dark:text-slate-600">-</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 font-mono">{event.heureRepas || <span className="text-slate-300 dark:text-slate-600">-</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {event.enTelephonie && event.enTelephonie !== 'aucun' ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            event.enTelephonie === 'matin' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' 
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}>
                            {event.enTelephonie.charAt(0).toUpperCase() + event.enTelephonie.slice(1)}
                        </span>
                    ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-mono text-slate-600 dark:text-slate-400">
                    {event.pourcentageTel !== undefined ? `${event.pourcentageTel.toFixed(0)}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-slate-500 dark:text-slate-500 max-w-xs truncate hover:whitespace-normal hover:overflow-visible hover:relative hover:bg-white hover:dark:bg-slate-800 hover:shadow-lg hover:z-10 hover:p-4 rounded transition-all cursor-help">
                      {event.description}
                  </td>
                </tr>
              )}})}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-xl p-8 border border-white/20 dark:border-slate-800">
        <div className="flex items-center mb-6">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl mr-4">
                <NotionIcon className="w-8 h-8 text-slate-900 dark:text-white"/>
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Exportation Notion</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Synchronisez directement ce planning avec votre espace de travail.</p>
            </div>
        </div>

        <form onSubmit={handleCreateNotionPage} className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Jeton d'Intégration</label>
                <input
                    type="password"
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    className="block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="secret_..."
                    required
                />
            </div>
            <div className="md:col-span-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ID Page Parente</label>
                <input
                    type="text"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="32 character ID"
                    required
                />
            </div>

            <div className="md:col-span-3 flex items-end">
                <button
                    type="submit"
                    disabled={notionState === 'loading' || data.length === 0}
                    className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {notionState === 'loading' ? 'Synchronisation...' : "Créer la base Notion"}
                </button>
            </div>
        </form>

        {notionState === 'success' && (
            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-center animate-pulse-once">
                <svg className="h-5 w-5 text-emerald-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">Page créée avec succès !</span>
                <a href={notionUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:underline">
                    Voir sur Notion &rarr;
                </a>
            </div>
        )}

        {notionState === 'error' && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start">
                <svg className="h-5 w-5 text-red-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-red-700 dark:text-red-300">{notionError}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;