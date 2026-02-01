import React, { useState } from 'react';
import { Map, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MindMapNode } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MindMap2D from './MindMap2D';

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
        toast.success('Mind map generated successfully!');
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
            <Map className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">Mind Map Generator</h2>
            <p className="text-sm text-muted-foreground">Create visual concept maps for any topic</p>
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
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mind Map Display */}
      {mindMap && (
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              {mindMap.label}
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

          {/* 2D Canvas */}
          <MindMap2D mindMap={mindMap} />

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" /> Main Topic
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(186 94% 42%)' }} /> Category
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(142 71% 45%)' }} /> Sub-concept
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(38 92% 50%)' }} /> Detail
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!mindMap && !isGenerating && (
        <div className="glass-card p-12 text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <Map className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground mb-2">No mind map yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Enter a topic above to generate a visual concept map
          </p>
        </div>
      )}
    </div>
  );
};

export default MindMapView;
