'use client';
import { useLayercodePipeline } from '@layercode/react-sdk';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface VoiceConsoleProps {
  onCommand: (text: string) => void;
}

export function VoiceConsole({ onCommand }: VoiceConsoleProps) {
  const hasInitialized = useRef(false);
  
  const { agentAudioAmplitude, status, sendMessage } = useLayercodePipeline({
    pipelineId: process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID!,
    authorizeSessionEndpoint: '/api/authorize',
    onDataMessage: (data) => {
      console.log('🔊 LayerCode data received:', data);
      console.log('🔊 Data type:', typeof data, 'Keys:', Object.keys(data));
      
      // Try different possible transcript fields
      const transcript = data.transcript || data.text || data.message || data.content;
      
      if (transcript) {
        console.log('✅ Found transcript:', transcript);
        console.log('📞 Calling onCommand with:', transcript);
        try {
          onCommand(transcript);
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
    enableSpeaker: false, // Disable speaker to prevent feedback
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
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => {
              console.log('🧪 Manual voice test triggered');
              onCommand('show me running shoes');
            }}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Test Voice
          </button>
          {sendMessage && (
            <button 
              onClick={() => {
                console.log('🔄 Attempting to send test message to LayerCode');
                try {
                  sendMessage({ type: 'test', message: 'hello' });
                } catch (error) {
                  console.error('Error sending message:', error);
                }
              }}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
            >
              Test LC
            </button>
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