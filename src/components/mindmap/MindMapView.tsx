import React, { useState, Suspense } from 'react';
import { Map, Sparkles, RotateCcw, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MindMapNode } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Lazy load 3D component
const MindMap3D = React.lazy(() => import('./MindMap3D'));

const MindMapView: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [mindMap, setMindMap] = useState<MindMapNode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMindMap = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-mindmap', {
        body: { topic: topic.trim() }
      });

      if (error) {
        throw error;
      }

      if (data?.mindMap) {
        setMindMap(data.mindMap);
        toast.success('3D Mind map generated successfully!');
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast.error('Failed to generate mind map. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Box className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">3D Mind Map Generator</h2>
            <p className="text-sm text-muted-foreground">Create interactive 3D concept maps for any topic</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic (e.g., Machine Learning, Photosynthesis, World War II)"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && generateMindMap()}
          />
          <Button onClick={generateMindMap} disabled={isGenerating || !topic.trim()}>
            {isGenerating ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate 3D
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 3D Mind Map Display */}
      {mindMap && (
        <div className="glass-card p-6 animate-slide-up relative" style={{ animationDelay: '0.1s' }}>
          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              {mindMap.label} - 3D Concept Map
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMindMap(null)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* 3D Canvas */}
          <Suspense fallback={
            <div className="w-full h-[500px] rounded-xl bg-muted flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading 3D visualization...</p>
              </div>
            </div>
          }>
            <MindMap3D mindMap={mindMap} />
          </Suspense>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" /> Main Topic
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#06b6d4]" /> Category
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]" /> Sub-concept
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" /> Detail
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!mindMap && !isGenerating && (
        <div className="glass-card p-12 text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <Box className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground mb-2">No 3D mind map yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Enter a topic above to generate an interactive 3D visual concept map that you can rotate, zoom, and explore
          </p>
        </div>
      )}
    </div>
  );
};

export default MindMapView;
