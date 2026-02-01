import React, { useState } from 'react';
import { Compass, BookOpen, Clock, CheckCircle, ChevronRight, Sparkles, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface RoadmapStep {
  title: string;
  description: string;
  duration: string;
  resources: string[];
  completed: boolean;
}

interface Roadmap {
  topic: string;
  totalDuration: string;
  steps: RoadmapStep[];
}

const RoadmapPanel: React.FC = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);

  const shareToCommunity = async () => {
    if (!user) {
      toast.error('Please sign in to share');
      return;
    }
    if (!roadmap) return;

    setIsSharing(true);
    try {
      const { error } = await supabase.from('shared_roadmaps' as any).insert({
        user_id: user.id,
        title: `${roadmap.topic} Learning Path`,
        topic: roadmap.topic,
        roadmap_data: roadmap as unknown as Record<string, unknown>,
      } as any);

      if (error) throw error;
      toast.success('Roadmap shared to community!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to share');
    } finally {
      setIsSharing(false);
    }
  };

  const generateRoadmap = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-roadmap', {
        body: { topic: topic.trim() }
      });

      if (error) throw error;

      if (data?.success && data?.roadmap) {
        setRoadmap({
          topic: topic,
          totalDuration: data.roadmap.totalDuration || '8-12 weeks',
          steps: data.roadmap.steps || []
        });
        toast.success('Learning roadmap generated!');
      } else {
        throw new Error(data?.error || 'Failed to generate roadmap');
      }
    } catch (error: any) {
      console.error('Error generating roadmap:', error);
      toast.error(error.message || 'Failed to generate roadmap');
      
      // Fallback demo roadmap
      setRoadmap({
        topic,
        totalDuration: '8-12 weeks',
        steps: [
          {
            title: 'Fundamentals',
            description: `Learn the basic concepts and terminology of ${topic}`,
            duration: '2 weeks',
            resources: ['Official documentation', 'Beginner tutorials on YouTube'],
            completed: false
          },
          {
            title: 'Core Concepts',
            description: `Dive deeper into the main principles and theories`,
            duration: '2-3 weeks',
            resources: ['Online courses', 'Practice exercises'],
            completed: false
          },
          {
            title: 'Hands-on Practice',
            description: `Build projects and solve problems`,
            duration: '3-4 weeks',
            resources: ['Project-based learning', 'Coding challenges'],
            completed: false
          },
          {
            title: 'Advanced Topics',
            description: `Master complex concepts and optimization`,
            duration: '2-3 weeks',
            resources: ['Advanced tutorials', 'Research papers'],
            completed: false
          }
        ]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStepComplete = (index: number) => {
    if (!roadmap) return;
    const newSteps = [...roadmap.steps];
    newSteps[index].completed = !newSteps[index].completed;
    setRoadmap({ ...roadmap, steps: newSteps });
  };

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Compass className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">Learning Roadmap</h2>
            <p className="text-sm text-muted-foreground">Generate a complete learning path for any topic</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What do you want to master? (e.g., Machine Learning)"
            className="flex-1"
          />
          <Button onClick={generateRoadmap} disabled={isGenerating || !topic.trim()}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Roadmap Display */}
      {roadmap && (
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">
                {roadmap.topic} Learning Path
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Estimated time: {roadmap.totalDuration}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={shareToCommunity}
                disabled={isSharing}
              >
                {isSharing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
                Share
              </Button>
              <div className="text-sm text-muted-foreground">
                {roadmap.steps.filter(s => s.completed).length}/{roadmap.steps.length} completed
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {roadmap.steps.map((step, index) => (
                <div key={index} className="relative pl-12">
                  {/* Timeline dot */}
                  <button
                    onClick={() => toggleStepComplete(index)}
                    className={`absolute left-3 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      step.completed
                        ? 'bg-success border-success'
                        : 'bg-background border-primary'
                    }`}
                  >
                    {step.completed && <CheckCircle className="w-3 h-3 text-success-foreground" />}
                  </button>

                  <div className={`p-4 rounded-xl border transition-all ${
                    step.completed
                      ? 'bg-success/10 border-success/30'
                      : 'bg-muted/30 border-border hover:border-primary/50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold ${step.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            Step {index + 1}: {step.title}
                          </h4>
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {step.duration}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Resources:</p>
                          {step.resources.map((resource, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ChevronRight className="w-3 h-3" />
                              <span>{resource}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!roadmap && (
        <div className="glass-card p-12 text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Compass className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Enter a topic above to generate your learning roadmap</p>
        </div>
      )}
    </div>
  );
};

export default RoadmapPanel;
