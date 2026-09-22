import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Radio,
  Sparkles,
  PhoneCall,
  PhoneOff,
  AlertCircle,
  Headphones,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { floatTo16BitPCMBase64, LiveAudioPlayer } from '../utils/audioStreamer';
import { Product } from '../types';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProduct?: Product | null;
  onSelectProduct?: (product: Product) => void;
}

interface TranscriptItem {
  id: string;
  sender: 'user' | 'aria';
  text: string;
  timestamp: string;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  activeProduct,
  onSelectProduct,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false); // whether Gemini is currently outputting audio
  const [isUserTalking, setIsUserTalking] = useState<boolean>(false); // mic visualizer
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [suggestedPrompts] = useState<string[]>([
    'Which reformer is best for home use?',
    'Tell me about the Wunda Combo Chair.',
    'How do the spring tensions compare?',
    'What are your shipping times to the US or UK?',
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopSession();
    }
  }, [isOpen]);

  const startSession = async () => {
    try {
      setConnectionStatus('connecting');
      setErrorMessage(null);

      // 1. Initialize Audio Player for 24kHz incoming audio
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new LiveAudioPlayer();
      }
      audioPlayerRef.current.init();

      // 2. Connect WebSocket to /api/live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Live Voice] WebSocket connected to server bridge');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ready') {
            setConnectionStatus('connected');
            // If viewing a specific product, send a polite context greeting prompt
            if (activeProduct) {
              const greetingText = `Hello Aria! I am looking at ${activeProduct.name} ($${activeProduct.basePriceUSD} USD). Could you give me a quick overview of why it's special and how it fits into a studio or home Pilates practice?`;
              ws.send(JSON.stringify({ text: greetingText }));
              setTranscripts((prev) => [
                ...prev,
                {
                  id: String(Date.now()),
                  sender: 'user',
                  text: greetingText,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }
          } else if (data.type === 'audio' && data.audio) {
            setIsSpeaking(true);
            audioPlayerRef.current?.playChunk(data.audio);
          } else if (data.type === 'text' && data.text) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'aria') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + data.text },
                ];
              }
              return [
                ...prev,
                {
                  id: String(Date.now()),
                  sender: 'aria',
                  text: data.text,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ];
            });
          } else if (data.type === 'interrupted') {
            audioPlayerRef.current?.stopAll();
            setIsSpeaking(false);
          } else if (data.type === 'turnComplete') {
            setIsSpeaking(false);
          } else if (data.type === 'error' || data.error) {
            setErrorMessage(data.error || 'Live API connection error');
            setConnectionStatus('error');
          }
        } catch (e) {
          console.error('[Live Voice] Error handling server message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('[Live Voice] WebSocket error:', err);
        setErrorMessage('Unable to connect to live voice server. Please check your network or API key.');
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setIsSpeaking(false);
      };

      // 3. Request Microphone access (16kHz for Gemini Live)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Simple volume threshold check to animate visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const avg = sum / inputData.length;
        setIsUserTalking(avg > 0.03);

        const base64Pcm = floatTo16BitPCMBase64(inputData);
        wsRef.current.send(
          JSON.stringify({
            audio: base64Pcm,
            mimeType: 'audio/pcm;rate=16000',
          })
        );
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

    } catch (err: any) {
      console.error('[Live Voice] Failed to start session:', err);
      setErrorMessage(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access to converse with Aria.'
          : err?.message || 'Failed to start live session'
      );
      setConnectionStatus('error');
      stopSession();
    }
  };

  const stopSession = () => {
    // 1. Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // ignore
      }
      wsRef.current = null;
    }

    // 2. Stop audio recorder
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      scriptProcessorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }

    // 3. Stop player
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stopAll();
    }

    setConnectionStatus('idle');
    setIsSpeaking(false);
    setIsUserTalking(false);
  };

  const handleSendPromptText = (prompt: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: prompt }));
      setTranscripts((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'user',
          text: prompt,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#141412] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-stone-800 bg-[#191916] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              {connectionStatus === 'connected' && (
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#141412]"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-serif font-semibold text-lg tracking-wide">
                  Aria · Atelier Concierge
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  Gemini 3.8 Live
                </span>
              </div>
              <p className="text-stone-400 text-xs">
                Real-time, two-way conversational voice assistance for Pilates equipment & apparatus
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product In Context (if launched from a product card) */}
        {activeProduct && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-amber-400 font-semibold shrink-0">In Context:</span>
              <span className="text-stone-200 truncate font-medium">{activeProduct.name}</span>
              <span className="text-amber-400 font-mono shrink-0">${activeProduct.basePriceUSD}</span>
            </div>
            {onSelectProduct && (
              <button
                onClick={() => onSelectProduct(activeProduct)}
                className="text-amber-400 hover:text-amber-300 underline font-medium shrink-0 cursor-pointer"
              >
                View Specs
              </button>
            )}
          </div>
        )}

        {/* Central Visualizer & Conversation Canvas */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4 min-h-[280px]">
          {connectionStatus === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-transparent border border-amber-500/30 flex items-center justify-center">
                  <Headphones className="w-10 h-10 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div className="max-w-md space-y-2">
                <h4 className="text-white font-medium text-base">
                  Speak Directly with our Atelier Specialist
                </h4>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Have questions about carriage glide, maple wood finishes, spring tension, or international delivery? Ask naturally—Aria speaks and listens in real time via the high-fidelity <strong>gemini-3.8-live</strong> model.
                </p>
              </div>

              <div className="w-full max-w-md pt-2">
                <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-2">
                  Sample Topics to Ask
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {suggestedPrompts.map((prompt) => (
                    <div
                      key={prompt}
                      className="px-3 py-2 rounded-xl bg-[#1c1c19] border border-stone-800 text-[11px] text-stone-300 flex items-center justify-between"
                    >
                      <span className="truncate">{prompt}</span>
                      <ChevronRight className="w-3 h-3 text-stone-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {connectionStatus === 'connecting' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                <Radio className="w-8 h-8 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-medium text-sm">Opening Live Audio Stream...</h4>
                <p className="text-stone-400 text-xs">
                  Requesting microphone access and establishing WebSocket to Gemini 3.8 Live
                </p>
              </div>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-6">
              <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h4 className="text-white font-medium text-sm">Connection Issue</h4>
                <p className="text-red-300 text-xs leading-relaxed">
                  {errorMessage || 'Could not connect to the Gemini Live session.'}
                </p>
              </div>
              <button
                onClick={startSession}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Retry Voice Connection
              </button>
            </div>
          )}

          {(connectionStatus === 'connected' || connectionStatus === 'disconnected') && (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Interactive Orb / Visualizer State */}
              <div className="py-4 flex flex-col items-center justify-center bg-[#171715] rounded-2xl border border-stone-800/80 relative overflow-hidden">
                <div className="relative flex items-center justify-center mb-3">
                  {/* Glowing halo rings */}
                  <div
                    className={`absolute rounded-full transition-all duration-300 ${
                      isSpeaking
                        ? 'w-24 h-24 bg-amber-500/30 animate-ping'
                        : isUserTalking
                        ? 'w-20 h-20 bg-emerald-500/30 animate-ping'
                        : 'w-16 h-16 bg-amber-500/10'
                    }`}
                  ></div>

                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border ${
                      isSpeaking
                        ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-lg shadow-amber-500/40 scale-110'
                        : isUserTalking
                        ? 'bg-emerald-500 text-stone-950 border-emerald-300 shadow-lg shadow-emerald-500/40 scale-105'
                        : 'bg-[#22221f] text-stone-400 border-stone-700'
                    }`}
                  >
                    {isSpeaking ? (
                      <Volume2 className="w-7 h-7 animate-pulse" />
                    ) : isUserTalking ? (
                      <Mic className="w-7 h-7 animate-bounce" />
                    ) : (
                      <Radio className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <span className="text-xs font-semibold text-stone-200">
                    {isSpeaking
                      ? 'Aria is speaking...'
                      : isUserTalking
                      ? 'Listening to you...'
                      : isMuted
                      ? 'Microphone muted'
                      : 'Speak now — Aria is listening'}
                  </span>
                  <p className="text-[11px] text-stone-500 font-mono">
                    24kHz Output · 16kHz Studio Audio Input · Real-time Barge-In
                  </p>
                </div>
              </div>

              {/* Quick Prompt Suggestions during call */}
              {transcripts.length === 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] text-stone-400 font-medium">
                    Tap to ask via text or simply speak aloud:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleSendPromptText(p)}
                        className="px-2.5 py-1 rounded-lg bg-[#1c1c19] hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-[11px] text-stone-300 transition-colors cursor-pointer text-left"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Transcript / Dialogue History */}
              <div className="flex-1 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {transcripts.map((t) => (
                  <div
                    key={t.id}
                    className={`flex flex-col ${
                      t.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mb-1 px-1">
                      <span className="font-semibold text-stone-400">
                        {t.sender === 'user' ? 'You' : 'Aria'}
                      </span>
                      <span>·</span>
                      <span>{t.timestamp}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-xs leading-relaxed ${
                        t.sender === 'user'
                          ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-xs'
                          : 'bg-[#1f1f1c] text-stone-200 border border-stone-800 rounded-tl-xs'
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 bg-[#181815] border-t border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Protected by 3-Year Atelier Warranty & DDP Shipping</span>
          </div>

          <div className="flex items-center gap-3">
            {connectionStatus === 'connected' ? (
              <>
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-2xl border transition-colors cursor-pointer flex items-center gap-2 text-xs font-medium ${
                    isMuted
                      ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
                      : 'bg-[#22221f] border-stone-700 text-stone-300 hover:bg-stone-800'
                  }`}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  onClick={stopSession}
                  className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Voice Call</span>
                </button>
              </>
            ) : (
              <button
                onClick={startSession}
                disabled={connectionStatus === 'connecting'}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Start Live Voice Consultation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
