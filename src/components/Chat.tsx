import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Volume2, User, Bot, Sparkles, Terminal as TerminalIcon, Paperclip, X, Save } from 'lucide-react';
import { OllamaMessage } from '../lib/ollama';

interface ChatProps {
  messages: OllamaMessage[];
  inputValue: string;
  onInputChange: (val: string) => void;
  onSendMessage: (content?: string, images?: string[]) => void;
  onSpeak: (text: string) => void;
  isLoading: boolean;
  isSpeaking: boolean;
}

export default function Chat({ messages, inputValue, onInputChange, onSendMessage, onSpeak, isLoading, isSpeaking }: ChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<{name: string, content: string | null, type: 'image' | 'file'}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        reader.onload = (ev) => {
          const base64 = ev.target?.result as string;
          setAttachments(prev => [...prev, { name: file.name, content: base64.split(',')[1], type: 'image' }]);
        };
        reader.readAsDataURL(file);
      } else if (file.name.endsWith('.md')) {
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          setAttachments(prev => [...prev, { name: file.name, content: text, type: 'file' }]);
        };
        reader.readAsText(file);
      }
    }
    if (e.target) e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    
    let finalContent = inputValue;
    const images: string[] = [];
    
    attachments.forEach(att => {
      if (att.type === 'image' && att.content) {
        images.push(att.content);
      } else if (att.type === 'file' && att.content) {
        finalContent += `\n\n[ARCHIVO: ${att.name}]\n${att.content}`;
      }
    });

    onSendMessage(finalContent, images);
    setAttachments([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950/20 glass-panel border-l-0">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between px-8 bg-zinc-900/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2 h-2 absolute -top-1 -right-1 bg-green-500 rounded-full animate-ping" />
            <Bot size={20} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100">TERMINAL DE COMANDO</h2>
            <p className="text-[10px] font-mono text-zinc-500">CANAL ENCRIPTADO / LATENCIA: 42ms</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
            <TerminalIcon size={12} />
            SSH: LOCALHOST
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center text-cyan-500/30">
                <Sparkles size={32} />
              </div>
              <div>
                <h3 className="text-zinc-400 font-semibold italic text-lg uppercase tracking-tight">¿Qué vamos a buildear hoy, Turbo Eric?</h3>
                <p className="text-zinc-600 text-sm max-w-xs mx-auto mt-2">Personaliza el entorno con las habilidades de la izquierda para máxima eficiencia.</p>
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border ${
                  msg.role === 'user' 
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-400' 
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.1)]'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                
                <div className="space-y-2">
                  <div className={`p-4 rounded-2xl relative ${
                    msg.role === 'user'
                      ? 'bg-zinc-100 text-zinc-900 rounded-tr-none'
                      : 'bg-zinc-900/60 text-zinc-300 border border-zinc-800 rounded-tl-none font-mono text-sm leading-relaxed'
                  }`}>
                    {msg.content}
                    
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex gap-2 mt-4 flex-wrap">
                        {msg.images.map((img, idx) => (
                          <img 
                            key={idx} 
                            src={`data:image/png;base64,${img}`} 
                            className="max-w-[200px] rounded-lg border border-zinc-700/50 shadow-lg" 
                            alt="Adjunto"
                          />
                        ))}
                      </div>
                    )}
                    
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-4">
                        <button 
                          onClick={() => onSpeak(msg.content)}
                          className={`p-2 rounded-lg border transition-all ${
                            isSpeaking ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/50'
                          }`}
                          title="Leer mensaje"
                        >
                          <Volume2 size={14} />
                        </button>
                        
                        {msg.content.includes('# ACCIÓN: GUARDAR_ARCHIVO') && (
                          <button 
                            onClick={async () => {
                              const match = msg.content.match(/# RUTA: (.*)\n# CONTENIDO:\n([\s\S]*?)```/);
                              if (match) {
                                const path = match[1].trim();
                                const content = match[2].trim();
                                const fileName = path.split('/').pop() || 'script.sh';
                                
                                // Check if we have a mounted directory handle
                                const directoryHandle = window.projectDirectoryHandle;
                                
                                if (directoryHandle) {
                                  try {
                                    // Try to save directly to mounted directory
                                    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
                                    const writable = await fileHandle.createWritable();
                                    await writable.write(content);
                                    await writable.close();
                                    alert(`¡Archivo ${fileName} guardado con éxito en la carpeta montada!`);
                                  } catch (e) {
                                    console.error('Error al guardar directamente:', e);
                                    // Fallback to download if direct save fails
                                    const blob = new Blob([content], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = fileName;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }
                                } else {
                                  // No handle, just download
                                  const blob = new Blob([content], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = fileName;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition-all uppercase tracking-tighter"
                          >
                            <Save size={14} />
                            Desplegar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className={`text-[9px] font-mono uppercase tracking-widest ${msg.role === 'user' ? 'text-right text-zinc-600' : 'text-zinc-700'}`}>
                    {msg.role === 'user' ? 'Transmitiendo...' : 'Procesado por Ollama'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-pulse">
                  <Bot size={16} />
                </div>
                <div className="space-y-1">
                  <div className="flex gap-1 p-3">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-6 py-2 flex gap-2 flex-wrap"
          >
            {attachments.map((att, i) => (
              <div key={i} className="relative group/att">
                <div className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs pr-8">
                  {att.type === 'image' ? (
                    <img src={`data:image/png;base64,${att.content}`} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <TerminalIcon size={14} className="text-cyan-400" />
                  )}
                  <span className="text-zinc-400 max-w-[100px] truncate">{att.name}</span>
                </div>
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white scale-0 group-hover/att:scale-100 transition-transform shadow-lg"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-6 bg-zinc-950/20">
        <div className="max-w-4xl mx-auto relative group">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,.md"
            multiple 
          />
          <div className="absolute inset-0 bg-cyan-500/5 blur-xl group-focus-within:bg-cyan-500/15 transition-all" />
          <div className="relative glass-panel rounded-2xl flex items-center p-2 pl-4 border-zinc-800 transition-all focus-within:border-cyan-500 group-focus-within:shadow-[0_0_20px_rgba(0,242,255,0.05)]">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-500 hover:text-cyan-400 transition-colors"
            >
              <Paperclip size={18} />
            </button>
            <textarea
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="¿Qué necesitas programar hoy? Adjunta archivos si es necesario..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 py-3 resize-none max-h-32 min-h-[44px]"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
              className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 flex items-center justify-center transition-all disabled:opacity-50 disabled:grayscale disabled:hover:bg-cyan-500 disabled:cursor-not-allowed m-1 shadow-[0_0_15px_rgba(0,242,255,0.4)]"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="flex justify-between px-2 mt-2">
            <p className="text-[9px] font-mono text-zinc-600 uppercase">Input: UTF-8 / Model: {isLoading ? 'CARGANDO...' : 'LISTO'}</p>
            <p className="text-[9px] font-mono text-zinc-600 uppercase">Shift + Enter para nueva línea</p>
          </div>
        </div>
      </div>
    </div>
  );
}
