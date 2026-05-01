import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Lock, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
  const protocols = [
    { name: "Cifrado de Terminal E2E", status: "Activo", icon: <Lock size={16} /> },
    { name: "Aislamiento de Kernel Linux", status: "Activo", icon: <Shield size={16} /> },
    { name: "Monitor de Privacidad Local", status: "Vigilando", icon: <Eye size={16} /> },
    { name: "Validación de Código IA", status: "Restringido", icon: <AlertCircle size={16} /> },
  ];

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
            className="relative w-full max-w-md glass-panel rounded-3xl border-red-500/30 overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.1)]"
          >
            <div className="p-6 border-b border-zinc-800 bg-red-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="text-red-400" size={20} />
                <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">Protocolos de Seguridad</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <Shield size={40} className="text-red-500" />
              </div>
              
              <div className="space-y-3">
                {protocols.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3 text-zinc-400">
                      {p.icon}
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full uppercase">
                      <CheckCircle2 size={10} />
                      {p.status}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                <p className="text-xs text-zinc-500 leading-relaxed italic">
                  "TurboEric_GB prioriza la ejecución en local. Toda inferencia realizada a través de Ollama permanece dentro de tu perímetro de red. No hay fuga de datos externos detectada."
                </p>
              </div>

              <button 
                onClick={onClose}
                className="w-full btn-tech bg-red-500/10 border-red-500/50 text-red-400 py-3 font-bold hover:bg-red-500 hover:text-black transition-all"
              >
                Cerrar Protocolo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
