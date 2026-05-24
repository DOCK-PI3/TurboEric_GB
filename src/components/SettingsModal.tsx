import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Cpu, Database, Save, Sliders, Layers, Search, Globe } from 'lucide-react';
import { Skill } from '../lib/skills';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
  config: {
    temperature: number;
    topP: number;
    maxTokens: number;
  };
  setConfig: (config: any) => void;
  skills: Skill[];
  onToggleSkill: (id: string) => void;
  braveApiKey: string;
  onBraveApiKeyChange: (key: string) => void;
  serperApiKey: string;
  onSerperApiKeyChange: (key: string) => void;
  searchProvider: string;
  onSearchProviderChange: (key: string) => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  ollamaUrl, 
  setOllamaUrl, 
  config, 
  setConfig,
  skills,
  onToggleSkill,
  braveApiKey,
  onBraveApiKeyChange,
  serperApiKey,
  onSerperApiKeyChange,
  searchProvider,
  onSearchProviderChange,
}: SettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg glass-panel rounded-3xl border-cyan-500/30 overflow-hidden shadow-[0_0_50px_rgba(0,242,255,0.1)]"
          >
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="text-cyan-400" size={20} />
                <h2 className="text-lg font-bold tracking-tight text-glow">CONFIGURACIÓN DEL NÚCLEO</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Ollama Connection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 border-b border-cyan-500/20 pb-2">
                  <Database size={14} />
                  <span>CONEXIÓN OLLAMA</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-zinc-500 uppercase font-bold px-1">Endpoint de la API</label>
                  <input 
                    type="text" 
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 text-sm font-mono text-zinc-300"
                    placeholder="http://localhost:11434"
                  />
                  <p className="text-[10px] text-zinc-600 px-1 italic">Asegúrate de ejecutar con OLLAMA_ORIGINS="*"</p>
                </div>
              </div>

              {/* Brave Search API */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 border-b border-cyan-500/20 pb-2">
                  <Search size={14} />
                  <span>BRAVE SEARCH API</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-zinc-500 uppercase font-bold px-1">API Key</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={braveApiKey}
                      onChange={(e) => onBraveApiKeyChange(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pr-10 outline-none focus:border-cyan-500 text-sm font-mono text-zinc-300"
                      placeholder="BSA... (opcional — mejora calidad y fiabilidad)"
                    />
                    {braveApiKey && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#22c55e]" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-600 px-1 italic">
                    Sin API key se usa DuckDuckGo + SearXNG como fallback.{' '}
                    <a href="https://api-dashboard.search.brave.com/" target="_blank" rel="noopener noreferrer" 
                       className="text-cyan-500/70 hover:text-cyan-400 underline">
                      Obtén tu API key gratis
                    </a>
                  </p>
                </div>
              </div>

              {/* Serper.dev API */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 border-b border-cyan-500/20 pb-2">
                  <Globe size={14} />
                  <span>SERPER.DEV API (GOOGLE)</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-zinc-500 uppercase font-bold px-1">API Key</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={serperApiKey}
                      onChange={(e) => onSerperApiKeyChange(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pr-10 outline-none focus:border-cyan-500 text-sm font-mono text-zinc-300"
                      placeholder="... (opcional — 2500 consultas gratis/mes, sin tarjeta)"
                    />
                    {serperApiKey && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#22c55e]" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-600 px-1 italic">
                    Provee resultados de Google. Sin API key se usa DuckDuckGo + SearXNG.{' '}
                    <a href="https://serper.dev" target="_blank" rel="noopener noreferrer" 
                       className="text-cyan-500/70 hover:text-cyan-400 underline">
                      Obtén tu API key gratis
                    </a>
                  </p>
                </div>
              </div>

              {/* Preferred Search Provider */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 border-b border-cyan-500/20 pb-2">
                  <Search size={14} />
                  <span>PROVEEDOR DE BÚSQUEDA PREFERIDO</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-zinc-500 uppercase font-bold px-1">Proveedor primario</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'auto', label: 'Auto', desc: 'Brave → Serper → DDG → SearXNG' },
                      { value: 'brave', label: 'Brave', desc: 'Brave Search primero' },
                      { value: 'serper', label: 'Serper.dev', desc: 'Google Search primero' },
                      { value: 'duckduckgo', label: 'DuckDuckGo', desc: 'Solo gratis, sin API key' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onSearchProviderChange(opt.value)}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          searchProvider === opt.value
                            ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20'
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <p className={`text-xs font-semibold ${searchProvider === opt.value ? 'text-cyan-300' : 'text-zinc-300'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-600 px-1 italic">
                    El proveedor seleccionado se intenta primero. Si falla o no hay key configurada, se usan los siguientes en cadena.
                  </p>
                </div>
              </div>

              {/* Model Parameters */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 border-b border-cyan-500/20 pb-2">
                  <Sliders size={14} />
                  <span>PARÁMETROS DE INFERENCIA</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between px-1">
                      <label className="text-[11px] text-zinc-500 uppercase font-bold">Temperatura</label>
                      <span className="text-xs font-mono text-cyan-400">{config.temperature}</span>
                    </div>
                    <input 
                      type="range" min="0" max="2" step="0.1" 
                      value={config.temperature}
                      onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between px-1">
                      <label className="text-[11px] text-zinc-500 uppercase font-bold">Top P</label>
                      <span className="text-xs font-mono text-cyan-400">{config.topP}</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={config.topP}
                      onChange={(e) => setConfig({...config, topP: parseFloat(e.target.value)})}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Skills Management */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 border-b border-cyan-500/20 pb-2">
                  <Layers size={14} />
                  <span>HABILIDADES DEL SISTEMA (SKILLS)</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skills.map((skill) => (
                    <motion.div
                      key={skill.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onToggleSkill(skill.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        skill.active 
                          ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20' 
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className={`${skill.active ? 'text-cyan-400' : 'text-zinc-600'}`}>
                        {skill.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-semibold truncate ${skill.active ? 'text-zinc-200' : 'text-zinc-500'}`}>
                          {skill.name}
                        </p>
                      </div>
                      {skill.active && (
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 shadow-[0_0_8px_#00f2ff]" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full btn-tech bg-cyan-500/10 border-cyan-500/50 text-cyan-400 py-4 font-bold flex items-center justify-center gap-2 hover:bg-cyan-500 hover:text-black mt-4"
              >
                <Save size={18} />
                Guardar y Sincronizar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
