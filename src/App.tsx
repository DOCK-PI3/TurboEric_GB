/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import Avatar from './components/Avatar';
import SettingsModal from './components/SettingsModal';
import SecurityModal from './components/SecurityModal';
import { OllamaService, OllamaMessage } from './lib/ollama';
import { INITIAL_SKILLS, Skill, getActiveTools, executeSkillTool } from './lib/skills.tsx';
import { useSpeech } from './hooks/useSpeech';
import { Zap, AlertTriangle } from 'lucide-react';

let ollama = new OllamaService();

export default function App() {
  const [messages, setMessages] = useState<OllamaMessage[]>(() => {
    const saved = localStorage.getItem('turboeric_history');
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: '¡Hola! Soy TurboEric_GB, tu asistente avanzado de programación. He cargado mis protocolos de skills y estoy listo para ayudarte a hackear el kernel o desarrollar tu próxima gran idea. ¿En qué trabajamos hoy?' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('turboeric_history', JSON.stringify(messages));
  }, [messages]);

  const clearHistory = () => {
    const defaultMsg: OllamaMessage[] = [{ role: 'assistant', content: 'Hola de nuevo. Sistema reiniciado. ¿En qué puedo ayudarte ahora?' }];
    setMessages(defaultMsg);
  };
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [activeModel, setActiveModel] = useState('llama3.1:8b');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  
  // New States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [projectPath, setProjectPath] = useState('');
  const [opMode, setOpMode] = useState<'build' | 'plan' | 'talk'>('build');
  const [modelConfig, setModelConfig] = useState({
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 4096
  });

  const { speak, isSpeaking } = useSpeech();

  // Refs to avoid stale closures in handleSendMessage without re-creating the callback
  const skillsRef = useRef(skills);
  const opModeRef = useRef(opMode);
  const modelConfigRef = useRef(modelConfig);
  const projectPathRef = useRef(projectPath);
  useEffect(() => { skillsRef.current = skills; }, [skills]);
  useEffect(() => { opModeRef.current = opMode; }, [opMode]);
  useEffect(() => { modelConfigRef.current = modelConfig; }, [modelConfig]);
  useEffect(() => { projectPathRef.current = projectPath; }, [projectPath]);

  useEffect(() => {
    ollama = new OllamaService(ollamaUrl);
    checkOllama();
  }, [ollamaUrl]);

  const checkOllama = async () => {
    setOllamaStatus('checking');
    const isConnected = await ollama.testConnection();
    if (isConnected) {
      setOllamaStatus('connected');
      const models = await ollama.listModels();
      setAvailableModels(models);
      if (models.length > 0 && !models.includes(activeModel)) {
        // Pick first chat-capable model (skip embedding models)
        const chatModel = models.find(m => !m.includes('embed')) ?? models[0];
        setActiveModel(chatModel);
      }
    } else {
      setOllamaStatus('error');
    }
  };

  const handleSendMessage = useCallback(async (content?: string, images?: string[]) => {
    const textToSend = content || inputValue;
    if (!textToSend.trim() && (!images || images.length === 0)) return;

    if (isLoading) return;

    // Read current values via refs to avoid stale closure
    const currentSkills = skillsRef.current;
    const currentOpMode = opModeRef.current;
    const currentModelConfig = modelConfigRef.current;
    const currentProjectPath = projectPathRef.current;

    // Inject Context
    const activeSkills = currentSkills.filter(s => s.active).map(s => s.name);

    let modeContext = '';
    switch (currentOpMode) {
      case 'talk':
        modeContext = '[MODO_CHAT]: Eres un asistente amigable. No generes código a menos que sea necesario.';
        break;
      case 'plan':
        modeContext = '[MODO_PLAN]: Analiza y planifica. No generes bloques de código extensos. Prioriza la arquitectura.';
        break;
      case 'build':
        modeContext = '[MODO_BUILD]: Genera código de producción y soluciones técnicas directas.';
        break;
    }

    const systemContext = `[SISTEMA]: TurboEric_GB v1.0.
[ENTORNO]: Directorio de trabajo vinculado: "${currentProjectPath || 'No definido (pide al usuario que use "MONTAR CARPETA" en el sidebar)'}".
[HABILIDADES_ACTIVAS]: ${activeSkills.join(', ') || 'Básicas'}.
[PODER_REAL]: Si el usuario ha montado una carpeta, puedes EDITAR ARCHIVOS REALES. Para hacerlo, genera un bloque con \# ACCIÓN: GUARDAR_ARCHIVO. El usuario verá un botón "Desplegar" que escribirá el archivo directamente en su disco.
[FORMATO_ESCRITURA]:
\`\`\`bash
# ACCIÓN: GUARDAR_ARCHIVO
# RUTA: (nombre del archivo)
# CONTENIDO:
(codigo)
\`\`\`
No dudes en pedir al usuario que monte su carpeta de proyecto para que puedas trabajar directamente sobre sus archivos .sh, .py, .js, etc.`;

    const textWithContext = `${modeContext}\n${systemContext}\n\n${textToSend}`;

    const userMessage: OllamaMessage = { 
      role: 'user', 
      content: textWithContext,
      images: images && images.length > 0 ? images : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const chatMessages = [...messages, userMessage];
      let assistantResponse = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const activeTools = getActiveTools(currentSkills);

      await ollama.chat(
        activeModel,
        chatMessages,
        (chunk) => {
          assistantResponse += chunk;
          setMessages(prev =>
            prev.map((msg, idx) =>
              idx === prev.length - 1 ? { ...msg, content: assistantResponse } : msg,
            ),
          );
        },
        {
          temperature: currentModelConfig.temperature,
          top_p: currentModelConfig.topP,
          num_predict: currentModelConfig.maxTokens,
        },
        activeTools.length > 0 ? activeTools : undefined,
        activeTools.length > 0 ? executeSkillTool : undefined,
      );
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu solicitud. Asegúrate de que Ollama esté corriendo en la URL configurada y que CORS esté habilitado.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, activeModel, projectPath]);

  const toggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="flex h-screen bg-[#050508] text-zinc-300 overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-900/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-900/40 rounded-full blur-[120px]" />
        <div className="fixed inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <Sidebar 
        activeModel={activeModel} 
        onModelChange={setActiveModel} 
        availableModels={availableModels} 
        projectPath={projectPath}
        onProjectPathChange={setProjectPath}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onClearHistory={clearHistory}
        opMode={opMode}
        onOpModeChange={setOpMode}
      />

      <main className="flex-1 flex flex-col relative">
        <Chat 
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSendMessage={handleSendMessage}
          onSpeak={speak}
          isLoading={isLoading}
          isSpeaking={isSpeaking}
        />

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          ollamaUrl={ollamaUrl}
          setOllamaUrl={setOllamaUrl}
          config={modelConfig}
          setConfig={setModelConfig}
          skills={skills}
          onToggleSkill={toggleSkill}
        />

        <SecurityModal 
          isOpen={isSecurityOpen} 
          onClose={() => setIsSecurityOpen(false)}
        />

        {/* 3D Avatar Corner */}
        <div className="absolute top-6 right-8 w-48 h-48 pointer-events-auto z-20 group">
          <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all duration-700" />
          <div className="relative w-full h-full glass-panel rounded-full border-cyan-500/20 overflow-hidden bg-gradient-to-t from-cyan-900/10 to-transparent">
            <Avatar />
            {isSpeaking && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
                <div className="w-1 h-3 bg-cyan-400 animate-[bounce_0.6s_ease-in-out_infinite]" />
                <div className="w-1 h-5 bg-cyan-400 animate-[bounce_0.6s_ease-in-out_infinite_0.1s]" />
                <div className="w-1 h-2 bg-cyan-400 animate-[bounce_0.6s_ease-in-out_infinite_0.2s]" />
                <div className="w-1 h-4 bg-cyan-400 animate-[bounce_0.6s_ease-in-out_infinite_0.3s]" />
              </div>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="absolute bottom-6 right-8 flex items-center gap-4 z-20">
          <AnimatePresence>
            {ollamaStatus === 'error' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                className="flex items-center gap-3 px-4 py-2 bg-red-950/40 border border-red-500/30 rounded-full text-red-400 text-[10px] font-mono font-bold uppercase tracking-widest backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.1)]"
              >
                <AlertTriangle size={14} className="animate-pulse" />
                Ollama: Desconectado - Ejecuta 'ollama serve'
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/40 border border-zinc-800 rounded-full text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-widest backdrop-blur-md">
            <Zap size={14} className={ollamaStatus === 'connected' ? 'text-cyan-400' : 'text-zinc-600'} />
            System: {ollamaStatus === 'connected' ? 'Optimizado' : 'Bajo Rendimiento'}
          </div>
        </div>
      </main>
    </div>
  );
}
