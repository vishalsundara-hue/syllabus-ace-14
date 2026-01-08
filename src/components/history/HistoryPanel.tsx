import React, { useState } from 'react';
import { History, Search, Clock, ChevronRight, Brain, Play, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStudy } from '@/contexts/StudyContext';
import { HistoryItem } from '@/types';

const HistoryPanel: React.FC = () => {
  const { history } = useStudy();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  const filteredHistory = history.filter(item =>
    item.question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.question.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const levelColors = {
    Beginner: 'bg-level-beginner',
    Intermediate: 'bg-level-intermediate',
    Master: 'bg-level-master',
  };

  const handleGenerateVideo = async (item: HistoryItem) => {
    setIsGeneratingVideo(true);
    // Simulate video generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsGeneratingVideo(false);
    // In a real implementation, this would connect to Manim API
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">Search History</h2>
            <p className="text-sm text-muted-foreground">Review your past questions and answers</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by question or topic..."
            className="pl-10"
          />
        </div>
      </div>

      {/* History List */}
      <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">No history yet</p>
            <p className="text-sm text-muted-foreground">
              Your search history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <button
                key={item.question.id}
                onClick={() => setSelectedItem(selectedItem?.question.id === item.question.id ? null : item)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedItem?.question.id === item.question.id
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-muted/30 border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${levelColors[item.question.level]}`} />
                      <span className="text-xs font-medium text-muted-foreground">{item.question.topic}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{item.question.level}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {item.question.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(item.question.timestamp).toLocaleDateString()} • Score: {item.answer.accuracyScore}%
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${
                    selectedItem?.question.id === item.question.id ? 'rotate-90' : ''
                  }`} />
                </div>

                {/* Expanded Content */}
                {selectedItem?.question.id === item.question.id && (
                  <div className="mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Brain className="w-3 h-3" /> AI Explanation
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {item.answer.explanation.substring(0, 300)}...
                        </p>
                      </div>

                      {/* Video Generation Button */}
                      <Button
                        onClick={() => handleGenerateVideo(item)}
                        disabled={isGeneratingVideo}
                        variant="outline"
                        className="w-full"
                      >
                        {isGeneratingVideo ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Generating Video...
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            Generate Video Summary (Manim)
                          </>
                        )}
                      </Button>

                      {/* Placeholder for video */}
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <Play className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Video generation with Manim requires backend integration
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
