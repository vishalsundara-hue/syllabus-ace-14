import React, { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useStudy } from '@/contexts/StudyContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QuestionLevel, Question, Answer, HistoryItem } from '@/types';

interface QuestionInputProps {
  onAnalysis: (question: Question, answer: Answer) => void;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ onAnalysis }) => {
  const { college, topic, addToHistory } = useStudy();
  const { toast } = useToast();
  const [questionText, setQuestionText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const analyzeQuestion = (text: string): { level: QuestionLevel; keywords: string[]; reason: string } => {
    const lowerText = text.toLowerCase();
    
    // Keyword detection
    const allKeywords = text.match(/\b[A-Za-z]{4,}\b/g) || [];
    const keywords = [...new Set(allKeywords)].slice(0, 5);

    // Level classification
    const beginnerPatterns = ['what is', 'define', 'explain', 'meaning', 'basics', 'introduction'];
    const intermediatePatterns = ['how does', 'implement', 'example', 'work', 'code', 'process', 'steps'];
    const masterPatterns = ['optimize', 'edge case', 'internal', 'advanced', 'compare', 'difference', 'best practice', 'complexity'];

    if (masterPatterns.some(p => lowerText.includes(p))) {
      return { level: 'Master', keywords, reason: 'Your question involves advanced concepts, optimization, or deep understanding.' };
    }
    if (intermediatePatterns.some(p => lowerText.includes(p))) {
      return { level: 'Intermediate', keywords, reason: 'Your question focuses on implementation and working mechanisms.' };
    }
    return { level: 'Beginner', keywords, reason: 'Your question is about basic definitions and understanding.' };
  };

  const handleSubmit = async () => {
    if (!questionText.trim() || !topic) return;
    
    setIsLoading(true);
    
    try {
      const analysis = analyzeQuestion(questionText);
      
      // Call OpenAI-powered edge function for explanation
      const { data, error } = await supabase.functions.invoke('generate-explanation', {
        body: {
          topic,
          question: questionText,
          level: analysis.level,
          keywords: analysis.keywords,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate explanation');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate explanation');
      }

      const question: Question = {
        id: Date.now().toString(),
        text: questionText,
        level: analysis.level,
        keywords: analysis.keywords,
        reason: analysis.reason,
        college,
        subject: '',
        topic,
        timestamp: new Date(),
      };

      const answer: Answer = {
        id: Date.now().toString(),
        questionId: question.id,
        explanation: data.explanation,
        accuracyScore: data.accuracyScore || 85,
        keyTakeaways: data.keyTakeaways,
        relatedTopics: data.relatedTopics,
      };

      const historyItem: HistoryItem = { question, answer };
      addToHistory(historyItem);
      onAnalysis(question, answer);
      setQuestionText('');
    } catch (error: any) {
      console.error('Error generating explanation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate explanation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg text-foreground">Ask Your Doubt</h2>
          <p className="text-sm text-muted-foreground">
            {topic ? `Ask anything about ${topic}` : 'Select a topic first to ask questions'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder={topic ? `What would you like to know about ${topic}?` : 'Please select a topic first...'}
          disabled={!topic}
          className="min-h-[120px] bg-background border-border resize-none"
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {questionText.length}/500 characters
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!questionText.trim() || !topic || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Get Answer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionInput;
