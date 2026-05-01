import { useState, useCallback } from 'react';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel existing speech
    window.speechSynthesis.cancel();

    // Clean text by removing markdown characters and symbols for cleaner speech
    const cleanText = text
      .replace(/[*_#\-()\[\]{}]/g, ' ') // Replace symbols with space
      .replace(/\s+/g, ' ')             // Normalize spaces
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES'; // Spanish as requested
    
    // Find a nice Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es')) || voices[0];
    if (spanishVoice) utterance.voice = spanishVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
