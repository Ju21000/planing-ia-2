import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- PARTIE 1 : LE COMPOSANT FILEUPLOAD (Intégré ici pour éviter l'erreur de dossier) ---
function FileUpload({ onFileUpload }: { onFileUpload: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileUpload(file);
  };

  return (
    <div 
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-800/50 transition-all group"
    >
      <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.csv,.md" />
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-gray-800 rounded-full group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <p className="text-lg font-medium text-gray-200">Clique pour analyser un fichier</p>
          <p className="text-sm text-gray-500 mt-1">PDF, TXT, CSV supportés</p>
        </div>
      </div>
    </div>
  );
}

// --- PARTIE 2 : LE COMPOSANT DATATABLE SIMPLIFIÉ ---
function DataTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  const headers = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700 mt-8">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="bg-gray-800 text-gray-100 uppercase font-medium">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-6 py-4">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 bg-gray-900/50">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
              {headers.map((header) => (
                <td key={`${idx}-${header}`} className="px-6 py-4">{String(row[header])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- PARTIE 3 : L'APPLICATION PRINCIPALE ---
export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  const handleProcess = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setLoading(true);
    setError("");

    try {
      // Lecture du fichier
      const text = await uploadedFile.text();
      
      // Appel direct à Gemini (Sans passer par un dossier service pour éviter les erreurs)
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || "";
      if (!apiKey) throw new Error("Clé API manquante dans Vercel !");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Analyse ce contenu et extrais un planning structuré sous forme de tableau JSON. Contenu: ${text.substring(0, 30000)}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();
      
      // Nettoyage basique du JSON (Gemini met parfois des ```json ...)
      const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      
      try {
          const parsedData = JSON.parse(cleanJson);
          setResult(Array.isArray(parsedData) ? parsedData : [parsedData]);
      } catch (e) {
          setResult([{ Résultat: textResponse }]); // Si ce n'est pas du JSON, on affiche le texte
      }

    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Agent de Planification IA
          </h1>
          <p className="text-gray-400">Dépose ton document, l'IA organise ton planning.</p>
        </div>

        {!file ? (
          <FileUpload onFileUpload={handleProcess} />
        ) : (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FileText className="text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {loading && <span className="ml-auto text-blue-400 animate-pulse">Analyse en cours...</span>}
              {!loading && !error && <CheckCircle className="ml-auto text-green-500" />}
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {!loading && result.length > 0 && <DataTable data={result} />}
            
            {!loading && (
                <button onClick={() => setFile(null)} className="mt-6 text-sm text-gray-500 hover:text-white underline">
                    Analyser un autre fichier
                </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
