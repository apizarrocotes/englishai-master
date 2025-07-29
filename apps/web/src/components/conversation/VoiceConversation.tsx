'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square,
  MessageCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface VoiceConversationProps {
  lessonId: string;
  scenarioType: string;
  onMessageSent?: (message: string, audioBlob?: Blob) => void;
  onResponseReceived?: (response: string, audioBlob?: Blob) => void;
  onConversationEnd?: () => void;
  disabled?: boolean;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioBlob?: Blob;
  isPlaying?: boolean;
}

export default function VoiceConversation({
  lessonId,
  scenarioType,
  onMessageSent,
  onResponseReceived,
  onConversationEnd,
  disabled = false
}: VoiceConversationProps) {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize audio context and WebSocket connection
  useEffect(() => {
    initializeAudioContext();
    connectWebSocket();

    return () => {
      cleanup();
    };
  }, []);

  const initializeAudioContext = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      setError('Audio not supported in this browser');
    }
  };

  const connectWebSocket = () => {
    try {
      setConnectionStatus('connecting');
      const token = TokenStorage.getAccessToken();
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Connect to voice WebSocket endpoint
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Get API URL from environment variable or derive from current location
      let host: string;
      if (process.env.NEXT_PUBLIC_API_URL) {
        const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
        host = apiUrl.host;
      } else {
        host = window.location.hostname === 'localhost' ? 'localhost:3001' : `${window.location.hostname}:3001`;
      }
      
      const wsUrl = `${protocol}//${host}/api/voice/realtime?lessonId=${lessonId}&token=${encodeURIComponent(token)}`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setError(null);
      };

      ws.onmessage = (event) => {
        handleWebSocketMessage(event.data);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection failed. Please try again.');
        setConnectionStatus('disconnected');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setError('Failed to establish voice connection');
    }
  };

  const handleWebSocketMessage = (data: string) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'audio_response':
          handleAudioResponse(message.audio, message.text);
          break;
        case 'transcription':
          handleTranscription(message.text);
          break;
        case 'error':
          setError(message.error);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  const handleAudioResponse = (audioBase64: string, text: string) => {
    try {
      // Convert base64 to blob
      const audioData = atob(audioBase64);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });

      const newMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date(),
        audioBlob
      };

      setMessages(prev => [...prev, newMessage]);

      // Auto-play if audio is enabled
      if (isAudioEnabled) {
        playAudio(audioBlob);
      }

      if (onResponseReceived) {
        onResponseReceived(text, audioBlob);
      }
    } catch (error) {
      console.error('Failed to handle audio response:', error);
      setError('Failed to process voice response');
    }
  };

  const handleTranscription = (text: string) => {
    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    if (onMessageSent) {
      onMessageSent(text);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // Convert to base64 and send to WebSocket
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            wsRef.current?.send(JSON.stringify({
              type: 'audio_data',
              audio: base64,
              format: 'webm'
            }));
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.start(250); // Send data every 250ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Microphone access denied or not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Send end signal
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'audio_end'
        }));
      }
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  };

  const playAudio = async (audioBlob: Blob) => {
    try {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const cleanup = () => {
    if (mediaRecorderRef.current && isRecording) {
      stopRecording();
    }
    
    if (wsRef.current) {
      wsRef.current.close();
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Voice Conversation</h3>
            <p className="text-sm text-gray-600">{scenarioType}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-700' 
                : connectionStatus === 'connecting'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              {connectionStatus}
            </div>
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                isAudioEnabled 
                  ? 'text-blue-600 hover:bg-blue-50' 
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-75">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.audioBlob && (
                    <button
                      onClick={() => playAudio(message.audioBlob!)}
                      className="ml-2 p-1 rounded hover:bg-black/10 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Recording Controls */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-4">
          {/* Recording Timer */}
          {isRecording && (
            <div className="text-sm text-gray-600">
              {formatTime(recordingTime)}
            </div>
          )}

          {/* Main Recording Button */}
          <motion.button
            onClick={toggleRecording}
            disabled={disabled || connectionStatus !== 'connected'}
            className={`relative p-4 rounded-full transition-all ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : disabled || connectionStatus !== 'connected'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
          >
            {isRecording ? (
              <Square className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
            
            {/* Recording indicator */}
            {isRecording && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </motion.button>

          {/* Recording hint */}
          <div className="text-xs text-gray-500 text-center max-w-32">
            {isRecording ? 'Tap to stop recording' : 'Hold to record or tap to start'}
          </div>
        </div>
      </div>
    </div>
  );
}