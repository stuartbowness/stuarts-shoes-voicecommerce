'use client';
import { useLayercodePipeline } from '@layercode/react-sdk';

export function VoiceDebug() {
  const pipeline = useLayercodePipeline({
    pipelineId: process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID!,
    authorizeSessionEndpoint: '/api/authorize',
    onDataMessage: (data) => {
      console.log('LayerCode data:', data);
    },
    onError: (error) => {
      console.error('LayerCode error:', error);
    },
    onStatusChange: (status) => {
      console.log('LayerCode status changed:', status);
    }
  });

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded text-sm font-mono z-50">
      <h3 className="font-bold mb-2">Voice Debug</h3>
      <div>Pipeline ID: {process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID}</div>
      <div>Status: {pipeline.status}</div>
      <div>Error: {pipeline.error || 'None'}</div>
      <div>Auth endpoint: /api/authorize</div>
    </div>
  );
}