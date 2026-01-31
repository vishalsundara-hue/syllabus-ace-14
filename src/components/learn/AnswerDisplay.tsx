import React, { useState } from 'react';
import { Brain, Tag, TrendingUp, CheckCircle, XCircle, ChevronDown, ChevronUp, Sparkles, Image, Code, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Question, Answer, MCQ } from '@/types';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AnswerDisplayProps {
  question: Question;
  answer: Answer;
}

const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ question, answer }) => {
  const { user } = useAuth();
  const [showMCQs, setShowMCQs] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  
  // Visual explanation state
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [visualImage, setVisualImage] = useState<string | null>(null);
  const [manimCode, setManimCode] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  const levelColors = {
    Beginner: 'level-badge-beginner',
    Intermediate: 'level-badge-intermediate',
    Master: 'level-badge-master',
  };

  const levelBgColors = {
    Beginner: 'bg-level-beginner/10 border-level-beginner/30',
    Intermediate: 'bg-level-intermediate/10 border-level-intermediate/30',
    Master: 'bg-level-master/10 border-level-master/30',
  };

  // Generate sample MCQs
  const sampleMCQs: MCQ[] = [
    {
      id: '1',
      question: `What is the primary purpose of ${question.topic}?`,
      options: ['To store data', 'To process information', 'To optimize performance', 'All of the above'],
      correctAnswer: 3,
    },
    {
      id: '2',
      question: `Which of the following is NOT related to ${question.topic}?`,
      options: ['Data structures', 'Algorithms', 'Weather forecasting', 'Computation'],
      correctAnswer: 2,
    },
    {
      id: '3',
      question: `In what scenario would ${question.topic} be most useful?`,
      options: ['When handling large datasets', 'When simplicity is key', 'When memory is limited', 'All scenarios'],
      correctAnswer: 0,
    },
    {
      id: '4',
      question: `What is a key characteristic of ${question.topic}?`,
      options: ['Efficiency', 'Complexity', 'Simplicity', 'Randomness'],
      correctAnswer: 0,
    },
    {
      id: '5',
      question: `How does ${question.topic} relate to problem-solving?`,
      options: ['It provides structure', 'It adds confusion', 'It is irrelevant', 'It slows down solutions'],
      correctAnswer: 0,
    },
  ];

  const handleMCQAnswer = (mcqId: string, answerIndex: number) => {
    if (!submitted) {
      setMcqAnswers(prev => ({ ...prev, [mcqId]: answerIndex }));
    }
  };

  const handleSubmitMCQs = () => {
    setSubmitted(true);
  };

  const getScore = () => {
    let correct = 0;
    sampleMCQs.forEach(mcq => {
      if (mcqAnswers[mcq.id] === mcq.correctAnswer) correct++;
    });
    return correct;
  };

  const generateVisualExplanation = async () => {
    if (!user) {
      toast.error('Please sign in to generate visual explanations');
      return;
    }

    setIsGeneratingVisual(true);
    setVisualImage(null);
    setManimCode(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('generate-explanation-visual', {
        body: {
          topic: question.topic,
          question: question.text,
          level: question.level,
          explanation: answer.explanation.substring(0, 2000),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate visual');
      }

      const data = response.data;
      
      if (data.success) {
        setVisualImage(data.image || null);
        setManimCode(data.manimCode || null);
        toast.success('Visual explanation generated!');
      } else {
        throw new Error(data.error || 'Failed to generate visual');
      }
    } catch (error: any) {
      console.error('Error generating visual:', error);
      toast.error(error.message || 'Failed to generate visual explanation');
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  const downloadManimCode = () => {
    if (!manimCode) return;
    
    const blob = new Blob([manimCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${question.topic.replace(/\s+/g, '_')}_animation.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Manim code downloaded!');
  };

  return (
    <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      {/* Analysis Card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">Question Analysis</h2>
            <p className="text-sm text-muted-foreground">AI-powered understanding of your query</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Level Badge */}
          <div className={`p-4 rounded-xl border ${levelBgColors[question.level]}`}>
            <p className="text-xs font-medium text-muted-foreground mb-2">Understanding Level</p>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${levelColors[question.level]}`}>
              {question.level}
            </span>
          </div>

          {/* Keywords */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Keywords Detected
            </p>
            <div className="flex flex-wrap gap-1">
              {question.keywords.map((keyword, i) => (
                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Accuracy Score */}
          <div className="p-4 rounded-xl bg-success/10 border border-success/30">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Explanation Accuracy
            </p>
            <div className="flex items-center gap-2">
              <Progress value={answer.accuracyScore} className="h-2 flex-1" />
              <span className="text-sm font-bold text-success">{answer.accuracyScore}%</span>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Why this level: </span>
            {question.reason}
          </p>
        </div>
      </div>

      {/* Explanation Card */}
      <div className="glass-card p-6">
        <h3 className="font-display font-semibold text-lg text-foreground mb-4">📖 Explanation</h3>
        <div className="prose prose-sm max-w-none text-foreground">
          {answer.explanation.split('\n').map((line, i) => {
            if (line.startsWith('```')) {
              return null;
            }
            if (line.startsWith('**') && line.endsWith('**')) {
              return <h4 key={i} className="font-semibold text-foreground mt-4 mb-2">{line.replace(/\*\*/g, '')}</h4>;
            }
            if (line.startsWith('- ')) {
              return <li key={i} className="text-muted-foreground ml-4">{line.substring(2)}</li>;
            }
            if (line.trim() === '') {
              return <br key={i} />;
            }
            return <p key={i} className="text-muted-foreground mb-2">{line}</p>;
          })}
        </div>
      </div>

      {/* Visual Explanation Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">Visual Explanation</h3>
              <p className="text-sm text-muted-foreground">AI-generated diagram in 3Blue1Brown style</p>
            </div>
          </div>
          {!visualImage && (
            <Button 
              onClick={generateVisualExplanation} 
              disabled={isGeneratingVisual || !user}
              className="gap-2"
            >
              {isGeneratingVisual ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4" />
                  Generate Visual
                </>
              )}
            </Button>
          )}
        </div>

        {!user && (
          <div className="p-4 bg-muted/30 rounded-xl text-center">
            <p className="text-muted-foreground">Sign in to generate visual explanations</p>
          </div>
        )}

        {isGeneratingVisual && (
          <div className="p-8 bg-muted/30 rounded-xl flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <p className="text-muted-foreground">Generating visual explanation...</p>
            <p className="text-xs text-muted-foreground">This may take 15-30 seconds</p>
          </div>
        )}

        {visualImage && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-border">
              <img 
                src={visualImage} 
                alt="Visual explanation diagram" 
                className="w-full h-auto"
              />
            </div>

            {manimCode && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Code className="w-4 h-4" />
                  {showCode ? 'Hide' : 'View'} Manim Animation Code
                </button>

                {showCode && (
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded-xl overflow-x-auto text-xs text-foreground max-h-64">
                      <code>{manimCode}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadManimCode}
                      className="absolute top-2 right-2 gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={generateVisualExplanation}
              disabled={isGeneratingVisual}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Regenerate Visual
            </Button>
          </div>
        )}
      </div>

      {/* MCQ Section */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowMCQs(!showMCQs)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-display font-semibold text-lg text-foreground">📝 Practice MCQs</h3>
          {showMCQs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showMCQs && (
          <div className="mt-6 space-y-6">
            {sampleMCQs.map((mcq, index) => (
              <div key={mcq.id} className="p-4 bg-muted/30 rounded-xl">
                <p className="font-medium text-foreground mb-3">
                  {index + 1}. {mcq.question}
                </p>
                <div className="space-y-2">
                  {mcq.options.map((option, optIndex) => {
                    const isSelected = mcqAnswers[mcq.id] === optIndex;
                    const isCorrect = mcq.correctAnswer === optIndex;
                    const showResult = submitted;

                    return (
                      <button
                        key={optIndex}
                        onClick={() => handleMCQAnswer(mcq.id, optIndex)}
                        disabled={submitted}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          showResult
                            ? isCorrect
                              ? 'bg-success/20 border-success'
                              : isSelected
                              ? 'bg-destructive/20 border-destructive'
                              : 'bg-background border-border'
                            : isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'bg-background border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {showResult && isCorrect && <CheckCircle className="w-4 h-4 text-success" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-destructive" />}
                          <span className="text-sm">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!submitted ? (
              <Button onClick={handleSubmitMCQs} className="w-full">
                Submit Answers
              </Button>
            ) : (
              <div className="p-4 bg-primary/10 rounded-xl text-center">
                <p className="font-display font-bold text-2xl text-primary">
                  {getScore()}/5 Correct
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getScore() >= 4 ? '🎉 Excellent work!' : getScore() >= 2 ? '👍 Good effort!' : '📚 Keep practicing!'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnswerDisplay;
