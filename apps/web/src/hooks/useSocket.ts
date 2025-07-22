import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

interface SocketEvents {
  'conversation:joined': (data: any) => void;
  'conversation:message-response': (data: any) => void;
  'conversation:typing': (data: { sender: string; isTyping: boolean }) => void;
  'conversation:user-typing': (data: { sender: string; isTyping: boolean }) => void;
  'conversation:ended': (data: any) => void;
  'conversation:left': (data: any) => void;
  'conversation:error': (data: { message: string; error?: string }) => void;
  'conversation:voice-transcribed': (data: any) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const { url = 'http://localhost:3001', autoConnect = false } = options;

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, url]);

  const connect = () => {
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(url, {
        transports: ['websocket', 'polling'],
        upgrade: true,
      });
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const emit = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = <K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  };

  const off = <K extends keyof SocketEvents>(event: K, handler?: SocketEvents[K]) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  const joinConversation = (sessionId: string, userId: string) => {
    const token = localStorage.getItem('accessToken');
    emit('conversation:join', { sessionId, userId, token });
  };

  const sendMessage = (message: string) => {
    emit('conversation:message', { message });
  };

  const sendTyping = (isTyping: boolean) => {
    emit('conversation:typing', { isTyping });
  };

  const endConversation = () => {
    emit('conversation:end');
  };

  const leaveConversation = (sessionId?: string) => {
    emit('conversation:leave', { sessionId });
  };

  const sendVoiceMessage = (audioData: any, sessionId: string) => {
    emit('conversation:voice', { audioData, sessionId });
  };

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    connect,
    disconnect,
    emit,
    on,
    off,
    // Conversation-specific methods
    joinConversation,
    sendMessage,
    sendTyping,
    endConversation,
    leaveConversation,
    sendVoiceMessage,
  };
}