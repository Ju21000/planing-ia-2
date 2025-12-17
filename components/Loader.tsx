import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => (
  <div className="relative flex flex-col items-center justify-center w-full max-w-lg mx-auto">
    
    {/* CSS injecté localement pour les animations spécifiques du Cyborg */}
    <style>{`
      @keyframes scan {
        0%, 100% { top: 10%; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        50% { top: 90%; }
      }
      @keyframes glitch {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
      }
      .animate-scan {
        animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }
      .animate-glitch {
        animation: glitch 3s infinite;
      }
    `}</style>

    {/* Conteneur Holographique */}
    <div className="relative p-10 bg-slate-900/90 backdrop-blur-2xl rounded-[3rem] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
      
      {/* Grille de fond décorative */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <div className="relative flex flex-col items-center z-10">
        
        {/* TÊTE CYBORG ANIMÉE */}
        <div className="relative w-40 h-40 mb-8">
            {/* Cercle externe rotatif (Data Ring) */}
            <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-slate-700 border-t-cyan-500 animate-[spin_3s_linear_infinite]"></div>
            
            {/* Cercle interne rotatif inverse (Processing) */}
            <div className="absolute inset-3 rounded-full border-[2px] border-slate-700 border-b-purple-500 animate-[spin_4s_linear_infinite_reverse]"></div>

            {/* Le Visage Cyborg SVG */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-8 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                <defs>
                    <linearGradient id="cyborgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                </defs>
                
                {/* Structure du crâne */}
                <path 
                    d="M30,20 L70,20 L85,35 L85,75 L65,90 L35,90 L15,75 L15,35 Z" 
                    fill="none" 
                    stroke="url(#cyborgGradient)" 
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="animate-glitch"
                />
                
                {/* Détails circuits */}
                <path d="M15,35 L30,20 M70,20 L85,35 M85,75 L65,90 M35,90 L15,75" stroke="#475569" strokeWidth="1" />
                <path d="M30,50 L45,50 L50,45" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
                
                {/* L'Oeil Bionique */}
                <circle cx="65" cy="45" r="4" fill="#ef4444" className="animate-pulse shadow-[0_0_10px_#ef4444]" />
                <circle cx="65" cy="45" r="8" stroke="#ef4444" strokeWidth="0.5" fill="none" className="animate-ping opacity-20" />
            </svg>

            {/* Laser Scanner Vertical */}
            <div className="absolute left-0 w-full h-1 bg-cyan-400/80 shadow-[0_0_15px_#22d3ee] animate-scan z-20"></div>
        </div>

        {/* Texte et Status */}
        <h3 className="text-2xl font-mono font-bold text-white mb-2 tracking-widest uppercase">
            Traitement <span className="text-cyan-400">IA</span>
        </h3>
        
        <div className="flex items-center space-x-2 mb-4">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-xs font-mono text-cyan-300 uppercase tracking-wide">
                Gemini-3-Pro :: <span className="text-white">Active</span>
            </p>
        </div>

        <p className="text-sm text-slate-400 max-w-xs text-center font-mono border-t border-slate-700 pt-4 mt-2">
            {message}
        </p>
      </div>
    </div>

    {/* Effet de lueur sous le composant */}
    <div className="absolute -bottom-10 w-3/4 h-10 bg-cyan-500/20 blur-3xl rounded-full"></div>
  </div>
);

export default Loader;