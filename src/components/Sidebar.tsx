import React from 'react';
import { motion } from 'motion/react';
import { Settings, Shield, Cpu, Zap, Info, Layers, Folder, Plus, Trash2, MessageSquare } from 'lucide-react';
import { Skill } from '../lib/skills';
import { Conversation } from '../App';

interface SidebarProps {
  activeModel: string;
  onModelChange: (model: string) => void;
  availableModels: string[];
  projectPath: string;
  onProjectPathChange: (path: string) => void;
  onOpenSettings: () => void;
  onOpenSecurity: () => void;
  onClearHistory: () => void;
  opMode: 'build' | 'plan' | 'talk';
  onOpModeChange: (mode: 'build' | 'plan' | 'talk') => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export default function Sidebar({ 
  activeModel, 
  onModelChange, 
  availableModels,
  projectPath,
  onProjectPathChange,
  onOpenSettings,
  onOpenSecurity,
  onClearHistory,
  opMode,
  onOpModeChange,
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  return (
    <div className="w-80 h-full flex flex-col p-6 glass-panel space-y-6 z-10 overflow-y-auto">
      <div className="flex items-center space-y-1 gap-3">
        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/50 shadow-[0_0_15px_rgba(0,242,255,0.3)]">
          <Zap className="text-cyan-400" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-glow">TURBO ERIC</h1>
          <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Version GB-1.0</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70">
              <Zap size={14} />
              <span>MODO DE OPERACIÓN</span>
            </div>
            <button 
              onClick={onClearHistory}
              title="Limpiar Historial"
              className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2 py-0.5 rounded border border-red-500/20 transition-colors uppercase font-mono tracking-tighter"
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <button 
              onClick={() => onOpModeChange('talk')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${
                opMode === 'talk' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Info size={14} />
              Chat
            </button>
            <button 
              onClick={() => onOpModeChange('plan')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${
                opMode === 'plan' 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Layers size={14} />
              Plan
            </button>
            <button 
              onClick={() => onOpModeChange('build')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${
                opMode === 'build' 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Zap size={14} />
              Build
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 border-b border-cyan-500/20 pb-2">
            <Cpu size={14} />
            <span>MOTOR DE IA</span>
          </div>
          
          <div className="space-y-2">
            <label className="text-[11px] text-zinc-500 uppercase font-bold px-1">Modelo Actual</label>
            <select 
              value={activeModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-300 px-3 py-2 rounded-md outline-none focus:border-cyan-500 transition-colors text-sm font-mono appearance-none"
            >
              {availableModels.length > 0 ? (
                availableModels.map(m => <option key={m} value={m}>{m}</option>)
              ) : (
                <option value="llama3">llama3 (Default)</option>
              )}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 border-b border-cyan-500/20 pb-2">
            <Folder size={14} />
            <span>ENTORNO DE TRABAJO (REAL)</span>
          </div>
          <div className="space-y-3">
            <button 
              onClick={async () => {
                try {
                  // @ts-ignore - File System Access API
                  const handle = await window.showDirectoryPicker();
                  onProjectPathChange(handle.name);
                  // Store the handle globally or in a ref in parent
                  (window as any).projectDirectoryHandle = handle;
                } catch (e) {
                  console.error('Permiso denegado o no soportado');
                }
              }}
              className="w-full p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs font-bold text-cyan-400 flex items-center justify-center gap-2 hover:bg-cyan-500/20 transition-all group"
            >
              <Folder size={16} className="group-hover:scale-110 transition-transform" />
              MONTAR CARPETA LOCAL
            </button>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-600 uppercase font-bold px-1">Ruta Actual</label>
              <div className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 text-zinc-400 rounded-md text-[10px] font-mono truncate">
                {projectPath || 'No vinculada'}
              </div>
            </div>
          </div>
        </div>

        {/* Conversation History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70">
              <MessageSquare size={14} />
              <span>HISTORIAL</span>
            </div>
            <button
              onClick={onNewConversation}
              title="Nueva conversación"
              className="flex items-center gap-1 text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 transition-colors font-mono"
            >
              <Plus size={12} />
              Nueva
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {conversations.map(conv => (
              <motion.div
                key={conv.id}
                layout
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-xs ${
                  conv.id === activeConversationId
                    ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300'
                    : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 border border-transparent'
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <MessageSquare size={12} className="shrink-0 opacity-60" />
                <span className="flex-1 truncate font-mono">{conv.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500/70 hover:text-red-400 shrink-0"
                  title="Eliminar conversación"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800/50 space-y-3 mt-auto">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-lg transition-all text-sm group"
        >
          <Settings size={18} className="group-hover:rotate-45 transition-transform" />
          <span>Configuración Sistema</span>
        </button>
        <button 
          onClick={onOpenSecurity}
          className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-lg transition-all text-sm group"
        >
          <Shield size={18} className="group-hover:scale-110 transition-transform text-zinc-500 group-hover:text-red-400" />
          <span>Protocolos de Seguridad</span>
        </button>
        <div className="mt-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Kernel Linux: Operativo</span>
        </div>
      </div>
    </div>
  );
}
