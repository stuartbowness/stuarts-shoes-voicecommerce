'use client';
import { useLayercodePipeline } from '@layercode/react-sdk';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface VoiceConsoleProps {
  onCommand: (text: string) => void;
}

export function VoiceConsole({ onCommand }: VoiceConsoleProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const hasInitialized = useRef(false);
  const lastProcessedTime = useRef(0);
  const recognitionRef = useRef<any>(null);
  const lastProcessedTranscript = useRef<string>('');
  
  // Try Web Speech API as backup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        console.log('🎤 Web Speech API started');
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          console.log('🎤 Web Speech API transcript:', finalTranscript);
          setTranscript(finalTranscript);
          onCommand(finalTranscript.trim());
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('🎤 Web Speech API error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        console.log('🎤 Web Speech API ended');
        setIsListening(false);
      };
    }
  }, [onCommand]);
  
  const startWebSpeech = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        console.log('🎤 Starting Web Speech API...');
      } catch (error) {
        console.error('🎤 Error starting Web Speech API:', error);
      }
    }
  };
  
  const stopWebSpeech = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };
  
  // Add window event listener as backup for LayerCode events
  useEffect(() => {
    const handleLayercodeEvent = (event: any) => {
      console.log('🌐 Window LayerCode event:', event);
      if (event.detail && event.detail.transcript) {
        console.log('🎯 Found transcript in window event:', event.detail.transcript);
        onCommand(event.detail.transcript);
      }
    };
    
    // Listen for custom LayerCode events
    window.addEventListener('layercode-transcript', handleLayercodeEvent);
    window.addEventListener('layercode-data', handleLayercodeEvent);
    
    return () => {
      window.removeEventListener('layercode-transcript', handleLayercodeEvent);
      window.removeEventListener('layercode-data', handleLayercodeEvent);
    };
  }, [onCommand]);
  
  // Poll for LayerCode webhook transcripts
  useEffect(() => {
    const pollForTranscript = async () => {
      try {
        const response = await fetch('/api/latest-transcript');
        const data = await response.json();
        
        if (data.transcript && data.transcript !== lastProcessedTranscript.current) {
          console.log('🎯 Got LayerCode webhook transcript:', data.transcript);
          lastProcessedTranscript.current = data.transcript;
          setTranscript(data.transcript);
          onCommand(data.transcript);
        }
      } catch (error) {
        console.error('❌ Error polling for transcript:', error);
      }
    };
    
    // Poll every 500ms when LayerCode is connected
    const interval = setInterval(pollForTranscript, 500);
    
    return () => clearInterval(interval);
  }, [onCommand]);
  
  const { agentAudioAmplitude, status, sendMessage } = useLayercodePipeline({
    pipelineId: process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID!,
    authorizeSessionEndpoint: '/api/authorize',
    onDataMessage: (data) => {
      console.log('🔊 LayerCode data received:', data);
      console.log('🔊 Data type:', typeof data, 'Keys:', Object.keys(data));
      
      // Prevent duplicate processing
      const now = Date.now();
      if (now - lastProcessedTime.current < 1000) {
        console.log('⏱️ Skipping duplicate within 1 second');
        return;
      }
      
      // Try different possible transcript fields
      const transcript = data.transcript || data.text || data.message || data.content || data.user_input;
      
      if (transcript && transcript.trim()) {
        console.log('✅ Found transcript:', transcript);
        console.log('📞 Calling onCommand with:', transcript);
        lastProcessedTime.current = now;
        try {
          onCommand(transcript.trim());
          console.log('✅ onCommand called successfully');
        } catch (error) {
          console.error('❌ Error calling onCommand:', error);
        }
      } else {
        console.log('❌ No transcript found in data. Full data:', JSON.stringify(data, null, 2));
      }
    },
    onError: (error) => {
      console.error('🚨 LayerCode error:', error);
    },
    onStatusChange: (newStatus) => {
      console.log('📊 LayerCode status changed to:', newStatus);
    },
    enableMicrophone: true,
    enableSpeaker: true,
  });

  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return { icon: Mic, text: 'Ready to listen', color: 'text-blue-500' };
      case 'connecting':
        return { icon: Loader2, text: 'Connecting...', color: 'text-gray-500' };
      default:
        return { icon: MicOff, text: 'Disconnected', color: 'text-gray-400' };
    }
  };

  const { icon: Icon, text, color } = getStatusDisplay();

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${color} ${status === 'connecting' ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium text-gray-700">{text}</span>
          <AudioBars amplitude={agentAudioAmplitude} />
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          <button 
            onClick={() => {
              console.log('🧪 Manual voice test triggered');
              onCommand('show me running shoes');
            }}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Test Voice
          </button>
          <button 
            onClick={() => {
              console.log('🔍 Checking for LayerCode transcript data...');
              // Check if LayerCode has stored transcript data anywhere accessible
              console.log('Window layercode objects:', Object.keys(window).filter(key => key.toLowerCase().includes('layer')));
              console.log('Document elements with layercode:', document.querySelectorAll('[id*="layer"], [class*="layer"]'));
              
              // Try to trigger voice command with hardcoded transcript for testing
              onCommand('show me trail running shoes under 150');
            }}
            className="bg-purple-500 text-white px-2 py-1 rounded text-xs"
          >
            Force Search
          </button>
          <button 
            onClick={isListening ? stopWebSpeech : startWebSpeech}
            className={`${isListening ? 'bg-red-500' : 'bg-blue-500'} text-white px-2 py-1 rounded text-xs`}
          >
            {isListening ? 'Stop' : 'Web Speech'}
          </button>
        </div>
        {transcript && (
          <div className="text-xs text-gray-600 mt-1 bg-gray-100 p-1 rounded">
            Last: {transcript}
          </div>
        )}
      </div>
    </div>
  );
}

function AudioBars({ amplitude }: { amplitude: number }) {
  const normalizedAmplitude = Math.min(Math.max(amplitude * 5, 0), 1);
  const heights = [0.3, 0.7, 1.0, 0.7, 0.3];

  return (
    <div className="flex items-center gap-1 h-6">
      {heights.map((height, i) => (
        <div
          key={i}
          className="bg-blue-500 rounded-full transition-all duration-100"
          style={{
            width: '3px',
            height: `${4 + normalizedAmplitude * height * 16}px`,
          }}
        />
      ))}
    </div>
  );
}

export default VoiceConsole;