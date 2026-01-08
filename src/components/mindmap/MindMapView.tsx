import React, { useState } from 'react';
import { Map, Sparkles, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MindMapNode } from '@/types';

const MindMapView: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [mindMap, setMindMap] = useState<MindMapNode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  const generateMindMap = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const generatedMap: MindMapNode = {
      id: '1',
      label: topic,
      children: [
        {
          id: '2',
          label: 'Fundamentals',
          children: [
            { id: '2-1', label: 'Basic Concepts' },
            { id: '2-2', label: 'Key Definitions' },
            { id: '2-3', label: 'Core Principles' },
          ],
        },
        {
          id: '3',
          label: 'Applications',
          children: [
            { id: '3-1', label: 'Real-world Uses' },
            { id: '3-2', label: 'Industry Examples' },
            { id: '3-3', label: 'Case Studies' },
          ],
        },
        {
          id: '4',
          label: 'Advanced Topics',
          children: [
            { id: '4-1', label: 'Optimization' },
            { id: '4-2', label: 'Best Practices' },
            { id: '4-3', label: 'Edge Cases' },
          ],
        },
        {
          id: '5',
          label: 'Related Concepts',
          children: [
            { id: '5-1', label: 'Prerequisites' },
            { id: '5-2', label: 'Next Steps' },
          ],
        },
      ],
    };

    setMindMap(generatedMap);
    setIsGenerating(false);
  };

  const renderNode = (node: MindMapNode, level: number = 0, index: number = 0) => {
    const colors = [
      'bg-primary text-primary-foreground',
      'bg-accent text-accent-foreground',
      'bg-success text-success-foreground',
      'bg-warning text-warning-foreground',
      'bg-secondary text-secondary-foreground',
    ];

    const nodeColor = level === 0 ? colors[0] : colors[(index % 4) + 1];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="flex flex-col items-center">
        <div
          className={`px-4 py-2 rounded-xl font-medium text-sm shadow-md ${nodeColor} 
            ${level === 0 ? 'text-base font-bold' : ''}`}
          style={{ transform: `scale(${level === 0 ? 1.2 : 1})` }}
        >
          {node.label}
        </div>
        
        {hasChildren && (
          <>
            <div className="w-0.5 h-6 bg-border" />
            <div className="flex items-start gap-4">
              {node.children!.map((child, i) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-border" />
                  <div className="flex flex-col items-center">
                    {renderNode(child, level + 1, i)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
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
            placeholder="Enter a topic (e.g., Data Structures, Machine Learning)"
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg text-foreground">
              {mindMap.label} - Concept Map
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Map Container */}
          <div className="overflow-auto bg-muted/30 rounded-xl p-8 min-h-[400px]">
            <div
              className="flex justify-center"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              {renderNode(mindMap)}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" /> Main Topic
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-accent" /> Category
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-success" /> Sub-concept
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
            Enter a topic above to generate a visual concept map that helps you understand and memorize key concepts
          </p>
        </div>
      )}
    </div>
  );
};

export default MindMapView;
