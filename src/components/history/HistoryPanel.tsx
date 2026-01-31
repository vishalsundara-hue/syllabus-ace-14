import React, { useState } from 'react';
import { History, Search, Clock, ChevronRight, Brain, MessageSquare, Send, Loader2, Youtube } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStudy } from '@/contexts/StudyContext';
import { HistoryItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const HistoryPanel: React.FC = () => {
  const { history } = useStudy();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [followUpMessages, setFollowUpMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const filteredHistory = history.filter(item =>
    item.question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.question.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const levelColors = {
    Beginner: 'bg-level-beginner',
    Intermediate: 'bg-level-intermediate',
    Master: 'bg-level-master',
  };

  const handleSelectItem = (item: HistoryItem) => {
    if (selectedItem?.question.id === item.question.id) {
      setSelectedItem(null);
      setFollowUpMessages([]);
    } else {
      setSelectedItem(item);
      setFollowUpMessages(item.followUpMessages || []);
    }
  };

  const askFollowUp = async () => {
    if (!newQuestion.trim() || !selectedItem) return;

    setIsAsking(true);
    const userMessage = { role: 'user' as const, content: newQuestion };
    setFollowUpMessages(prev => [...prev, userMessage]);
    setNewQuestion('');

    try {
      const { data, error } = await supabase.functions.invoke('continue-conversation', {
        body: {
          originalQuestion: selectedItem.question.text,
          originalAnswer: selectedItem.answer.explanation,
          newQuestion: newQuestion,
          topic: selectedItem.question.topic,
          level: selectedItem.question.level
        }
      });

      if (error) throw error;

      if (data?.success && data?.answer) {
        const assistantMessage = { role: 'assistant' as const, content: data.answer };
        setFollowUpMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data?.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Error asking follow-up:', error);
      toast.error(error.message || 'Failed to ask follow-up question');
      setFollowUpMessages(prev => prev.slice(0, -1));
    } finally {
      setIsAsking(false);
    }
  };

  const getYoutubeLink = (topic: string) => {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial explanation')}`;
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
            <p className="text-sm text-muted-foreground">Review past questions and continue conversations</p>
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
              <div
                key={item.question.id}
                className={`rounded-xl border transition-all ${
                  selectedItem?.question.id === item.question.id
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-muted/30 border-border hover:border-primary/50'
                }`}
              >
                <button
                  onClick={() => handleSelectItem(item)}
                  className="w-full text-left p-4"
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
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.question.timestamp).toLocaleDateString()} • Score: {item.answer.accuracyScore}%
                        </p>
                        <a
                          href={getYoutubeLink(item.question.topic)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-destructive hover:underline"
                        >
                          <Youtube className="w-3 h-3" />
                          Watch tutorial
                        </a>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${
                      selectedItem?.question.id === item.question.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                </button>

                {/* Expanded Content */}
                {selectedItem?.question.id === item.question.id && (
                  <div className="px-4 pb-4 border-t border-border mt-2 pt-4">
                    <div className="space-y-4">
                      {/* Original Answer */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Brain className="w-3 h-3" /> Original Explanation
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-6">
                          {item.answer.explanation}
                        </p>
                      </div>

                      {/* Follow-up Messages */}
                      {followUpMessages.length > 0 && (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {followUpMessages.map((msg, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-lg ${
                                msg.role === 'user'
                                  ? 'bg-primary/10 ml-8'
                                  : 'bg-muted mr-8'
                              }`}
                            >
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {msg.role === 'user' ? 'You' : 'StudyBuddy'}
                              </p>
                              <p className="text-sm text-foreground">{msg.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ask Follow-up */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="Ask a follow-up question..."
                            className="pl-10"
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && askFollowUp()}
                          />
                        </div>
                        <Button
                          onClick={askFollowUp}
                          disabled={isAsking || !newQuestion.trim()}
                          size="icon"
                        >
                          {isAsking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
