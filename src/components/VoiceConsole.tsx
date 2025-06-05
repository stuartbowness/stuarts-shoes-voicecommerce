'use client';
import { useLayercodePipeline } from '@layercode/react-sdk';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface VoiceConsoleProps {
  onCommand: (text: string) => void;
  onSendMessageReady?: (sendMessage: (message: string) => void) => void;
}

export function VoiceConsole({ onCommand, onSendMessageReady }: VoiceConsoleProps) {
  const [transcript, setTranscript] = useState('');
  const [audioDebug, setAudioDebug] = useState('');
  const [connectionDebug, setConnectionDebug] = useState('');
  const [lastWebhookCheck, setLastWebhookCheck] = useState('');
  const lastProcessedTime = useRef(0);
  const lastProcessedTranscript = useRef<string>('');

  // Check browser audio support
  useEffect(() => {
    const checkAudioSupport = () => {
      const info = [];
      
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        info.push('❌ No Web Audio API');
      } else {
        info.push('✅ Web Audio API');
      }
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        info.push('❌ No MediaDevices API');
      } else {
        info.push('✅ MediaDevices API');
      }
      
      // Check if we're in a secure context (required for audio)
      if (!window.isSecureContext) {
        info.push('❌ Not secure context (HTTPS required)');
      } else {
        info.push('✅ Secure context');
      }
      
      setAudioDebug(info.join(' | '));
    };
    
    checkAudioSupport();
  }, []);
  
  
  // Poll for LayerCode webhook transcripts with enhanced debugging
  useEffect(() => {
    const pollForTranscript = async () => {
      try {
        const response = await fetch('/api/latest-transcript');
        const data = await response.json();
        
        setLastWebhookCheck(new Date().toLocaleTimeString());
        
        if (data.transcript && data.transcript !== lastProcessedTranscript.current) {
          console.log('🎯 Got LayerCode webhook transcript:', data.transcript);
          lastProcessedTranscript.current = data.transcript;
          setTranscript(data.transcript);
          onCommand(data.transcript);
        } else if (data.transcript) {
          console.log('⏭️ Skipping duplicate transcript:', data.transcript);
        } else {
          console.log('📭 No new transcript available');
        }
      } catch (error) {
        console.error('❌ Error polling for transcript:', error);
        setLastWebhookCheck(`Error: ${error.message}`);
      }
    };
    
    // Poll every 500ms when LayerCode is connected
    const interval = setInterval(pollForTranscript, 500);
    
    return () => clearInterval(interval);
  }, [onCommand]);
  
  const { agentAudioAmplitude, status, sendMessage, speakerVolume, setSpeakerVolume } = useLayercodePipeline({
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
      setConnectionDebug(`Status: ${newStatus} at ${new Date().toLocaleTimeString()}`);
    },
    onAudioStart: () => {
      console.log('🔊 Audio output started');
    },
    onAudioEnd: () => {
      console.log('🔊 Audio output ended');
    },
    enableMicrophone: true,
    enableSpeaker: true,
    webhookUrl: '/api/layercode-webhook',
    speakerVolume: 1.0,
  });

  // Pass sendMessage function to parent when it's ready
  useEffect(() => {
    if (sendMessage && onSendMessageReady) {
      onSendMessageReady(sendMessage);
    }
  }, [sendMessage, onSendMessageReady]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return { icon: Mic, text: 'LayerCode Ready', color: 'text-blue-500' };
      case 'connecting':
        return { icon: Loader2, text: 'Connecting LayerCode...', color: 'text-yellow-500' };
      case 'disconnected':
        return { icon: MicOff, text: 'LayerCode Disconnected', color: 'text-red-500' };
      case 'error':
        return { icon: MicOff, text: 'LayerCode Error', color: 'text-red-600' };
      default:
        return { icon: MicOff, text: `Status: ${status}`, color: 'text-gray-400' };
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
        <div className="flex gap-1 mt-2 flex-wrap items-center">
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
              if (sendMessage) {
                console.log('🧪 Testing LayerCode TTS with volume:', speakerVolume);
                console.log('🔊 Speaker enabled, volume max');
                sendMessage("Hello! I can hear you and I'm responding with audio. This is a test of the LayerCode text to speech system.");
              } else {
                console.log('❌ sendMessage not available');
              }
            }}
            className="bg-indigo-500 text-white px-2 py-1 rounded text-xs"
          >
            Test TTS
          </button>
          <button 
            onClick={() => {
              // Test browser audio with a simple beep
              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                
                console.log('🔊 Browser audio test: beep played');
              } catch (error) {
                console.error('❌ Browser audio test failed:', error);
              }
            }}
            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
          >
            Browser Beep
          </button>
          <button 
            onClick={async () => {
              try {
                console.log('🧪 Testing Claude API...');
                const response = await fetch('/api/voice-process', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query: 'hello' })
                });
                const result = await response.json();
                console.log('✅ Claude API test result:', result);
              } catch (error) {
                console.error('❌ Claude API test failed:', error);
              }
            }}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Test Claude
          </button>
          <div className="flex items-center gap-1 text-xs">
            <span>Vol:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={speakerVolume || 1}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                console.log('🔊 Setting volume to:', vol);
                if (setSpeakerVolume) {
                  setSpeakerVolume(vol);
                }
              }}
              className="w-16"
            />
            <span className="w-8 text-right">{Math.round((speakerVolume || 1) * 100)}%</span>
          </div>
        </div>
        <div className="text-xs text-gray-600 mt-1 space-y-1">
          {audioDebug && (
            <div className="bg-blue-50 p-1 rounded">
              Audio: {audioDebug}
            </div>
          )}
          {connectionDebug && (
            <div className="bg-yellow-50 p-1 rounded">
              {connectionDebug}
            </div>
          )}
          {lastWebhookCheck && (
            <div className="bg-purple-50 p-1 rounded">
              Webhook: {lastWebhookCheck}
            </div>
          )}
          <div className="bg-green-50 p-1 rounded">
            Pipeline: {process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID || 'NOT SET'}
          </div>
          {transcript && (
            <div className="bg-gray-100 p-1 rounded">
              Last: {transcript}
            </div>
          )}
        </div>
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