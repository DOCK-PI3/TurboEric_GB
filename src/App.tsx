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

const API = 'http://localhost:3001';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

let ollama = new OllamaService();

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<OllamaMessage[]>([]);
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
  const [braveApiKey, setBraveApiKey] = useState(() => localStorage.getItem('braveApiKey') || '');
  const [serperApiKey, setSerperApiKey] = useState(() => localStorage.getItem('serperApiKey') || '');
  const [searchProvider, setSearchProvider] = useState(() => localStorage.getItem('searchProvider') || 'auto');
  const [projectPath, setProjectPath] = useState('');
  const [opMode, setOpMode] = useState<'build' | 'plan' | 'talk'>('build');
  const [modelConfig, setModelConfig] = useState({
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 4096
  });

  const activeConvIdRef = useRef<string | null>(null);
  useEffect(() => { activeConvIdRef.current = activeConversationId; }, [activeConversationId]);

  // Persistir API Keys en localStorage
  useEffect(() => {
    localStorage.setItem('braveApiKey', braveApiKey);
  }, [braveApiKey]);
  useEffect(() => {
    localStorage.setItem('serperApiKey', serperApiKey);
  }, [serperApiKey]);
  useEffect(() => {
    localStorage.setItem('searchProvider', searchProvider);
  }, [searchProvider]);

  // Refs to avoid stale closures without recreating callbacks
  const messagesRef = useRef(messages);
  const inputValueRef = useRef(inputValue);
  const isLoadingRef = useRef(isLoading);
  const activeModelRef = useRef(activeModel);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { inputValueRef.current = inputValue; }, [inputValue]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { activeModelRef.current = activeModel; }, [activeModel]);

  // Load conversations on mount
  useEffect(() => {
    (async () => {
      const res = await fetch(`${API}/api/conversations`);
      const convs: Conversation[] = await res.json();
      if (convs.length === 0) {
        // Create first conversation
        const r = await fetch(`${API}/api/conversations`, { method: 'POST' });
        const conv: Conversation = await r.json();
        setConversations([conv]);
        setActiveConversationId(conv.id);
        const welcome: OllamaMessage = { role: 'assistant', content: '¡Hola! Soy TurboEric_GB, tu asistente avanzado de programación. ¿En qué trabajamos hoy?' };
        setMessages([welcome]);
        await fetch(`${API}/api/conversations/${conv.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: welcome.role, content: welcome.content }),
        });
      } else {
        setConversations(convs);
        const first = convs[0];
        setActiveConversationId(first.id);
        const msgsRes = await fetch(`${API}/api/conversations/${first.id}/messages`);
        const msgs: OllamaMessage[] = await msgsRes.json();
        setMessages(msgs.length > 0 ? msgs : [{ role: 'assistant', content: '¡Hola! Soy TurboEric_GB, tu asistente avanzado de programación. ¿En qué trabajamos hoy?' }]);
      }
    })();
  }, []);

  const loadConversation = async (id: string) => {
    setActiveConversationId(id);
    const res = await fetch(`${API}/api/conversations/${id}/messages`);
    const msgs: OllamaMessage[] = await res.json();
    setMessages(msgs.length > 0 ? msgs : [{ role: 'assistant', content: '¡Hola! ¿En qué puedo ayudarte?' }]);
  };

  const createConversation = async () => {
    const r = await fetch(`${API}/api/conversations`, { method: 'POST' });
    const conv: Conversation = await r.json();
    const welcome: OllamaMessage = { role: 'assistant', content: '¡Hola! Nueva sesión iniciada. ¿En qué trabajamos?' };
    await fetch(`${API}/api/conversations/${conv.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: welcome.role, content: welcome.content }),
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConversationId(conv.id);
    setMessages([welcome]);
  };

  const deleteConversation = async (id: string) => {
    await fetch(`${API}/api/conversations/${id}`, { method: 'DELETE' });

    // Compute next conversations list synchronously from current state
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);

    // Navigate after state update (not inside a setter — avoids side-effects-during-render)
    if (activeConversationId === id) {
      if (updated.length > 0) {
        await loadConversation(updated[0].id);
      } else {
        await createConversation();
      }
    }
  };

  const clearHistory = async () => {
    const id = activeConvIdRef.current;
    if (!id) return;
    await fetch(`${API}/api/conversations/${id}/messages`, { method: 'DELETE' });
    const welcome: OllamaMessage = { role: 'assistant', content: 'Hola de nuevo. Sistema reiniciado. ¿En qué puedo ayudarte ahora?' };
    await fetch(`${API}/api/conversations/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: welcome.role, content: welcome.content }),
    });
    await fetch(`${API}/api/conversations/${id}/title`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Nueva conversación' }),
    });
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: 'Nueva conversación' } : c));
    setMessages([welcome]);
  };

  const { speak, isSpeaking } = useSpeech();

  // Stable refs to avoid stale closures in handleSendMessage without recreating the callback
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
    // Read current values via refs to avoid stale closure AND avoid recreating the callback
    const currentInputValue = inputValueRef.current;
    const currentIsLoading = isLoadingRef.current;
    const currentMessages = messagesRef.current;
    const currentModel = activeModelRef.current;
    const currentSkills = skillsRef.current;
    const currentOpMode = opModeRef.current;
    const currentModelConfig = modelConfigRef.current;
    const currentProjectPath = projectPathRef.current;
    const currentConvId = activeConvIdRef.current;

    const textToSend = content || currentInputValue;
    if (!textToSend.trim() && (!images || images.length === 0)) return;
    if (currentIsLoading) return;

    const activeSkills = currentSkills.filter(s => s.active).map(s => s.name);

    // Build clean system prompt — sent as role:system, never stored in history
    const modeMap = {
      talk: 'Modo chat: responde de forma conversacional, sin generar código salvo que sea necesario.',
      plan: 'Modo plan: analiza y planifica. Prioriza arquitectura, evita bloques de código extensos.',
      build: 'Modo build: genera código de producción y soluciones técnicas directas.',
    };
    let systemContent = modeMap[currentOpMode];
    if (currentProjectPath) systemContent += `\nCarpeta de proyecto: ${currentProjectPath}.`;

    // ── Tool calling instructions ────────────────────────────────────────
    const toolDescriptions: Record<string, string> = {
      search_web: 'Busca información actualizada en internet (clima, noticias, datos en tiempo real, eventos, precios, cualquier cosa que haya cambiado después de tu entrenamiento).',
      execute_terminal: 'Ejecuta comandos bash en el servidor (compilar, instalar, git, scripts).',
      file_manager: 'Lee, escribe, lista y elimina archivos del proyecto.',
      system_monitor: 'Obtiene información del sistema (CPU, memoria, plataforma).',
      code_assistant: 'Analiza, genera y refactoriza código con acceso al proyecto.',
      ollama_cloud: 'Gestiona conexiones a instancias de Ollama locales o remotas.',
    };
    const activeToolNames = currentSkills.filter(s => s.active && s.toolName).map(s => s.toolName!);
    if (activeToolNames.length > 0) {
      systemContent += `\n\n── HERRAMIENTAS DISPONIBLES (puedes invocarlas cuando sea necesario) ──`;
      for (const tn of activeToolNames) {
        const desc = toolDescriptions[tn] || tn;
        systemContent += `\n- ${tn}: ${desc}`;
      }
      systemContent += `\n\n⚠️ IMPORTANTE: Si el usuario pregunta por información que no está en tu entrenamiento (clima actual/previsión, noticias de hoy, precios actuales, datos de internet, eventos recientes, etc.), DEBES usar search_web para obtenerla antes de responder. No digas que no puedes ayudar sin antes haber intentado usar search_web.`;
    }
    if (currentProjectPath) {
      systemContent += `\nSi el usuario pide guardar un archivo, genera un bloque con:\n\`\`\`bash\n# ACCIÓN: GUARDAR_ARCHIVO\n# RUTA: (ruta)\n# CONTENIDO:\n(codigo)\n\`\`\``;
    }

    const systemMessage: OllamaMessage = { role: 'system', content: systemContent };

    const userMessage: OllamaMessage = { 
      role: 'user', 
      content: textToSend,
      images: images && images.length > 0 ? images : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Persist user message
    if (currentConvId) {
      await fetch(`${API}/api/conversations/${currentConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: userMessage.role, content: userMessage.content, images: userMessage.images }),
      });

      // Auto-title from first user message
      const userMsgsCount = currentMessages.filter(m => m.role === 'user').length;
      if (userMsgsCount === 0) {
        const title = textToSend.slice(0, 50).trim();
        await fetch(`${API}/api/conversations/${currentConvId}/title`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });
        setConversations(prev => prev.map(c => c.id === currentConvId ? { ...c, title } : c));
      }
    }

    try {
      const chatMessages = [systemMessage, ...currentMessages, userMessage];
      let assistantResponse = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const activeTools = getActiveTools(currentSkills);

      await ollama.chat(
        currentModel,
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

      // Persist assistant message
      if (currentConvId && assistantResponse) {
        await fetch(`${API}/api/conversations/${currentConvId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'assistant', content: assistantResponse }),
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu solicitud. Asegúrate de que Ollama esté corriendo en la URL configurada y que CORS esté habilitado.' }]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  // ⚡ Empty deps — all values read from refs to avoid recreating callback on every message/input change

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
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewConversation={createConversation}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
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
        />          <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          ollamaUrl={ollamaUrl}
          setOllamaUrl={setOllamaUrl}
          config={modelConfig}
          setConfig={setModelConfig}
          skills={skills}
          onToggleSkill={toggleSkill}
          braveApiKey={braveApiKey}
          onBraveApiKeyChange={setBraveApiKey}
          serperApiKey={serperApiKey}
          onSerperApiKeyChange={setSerperApiKey}
          searchProvider={searchProvider}
          onSearchProviderChange={setSearchProvider}
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
