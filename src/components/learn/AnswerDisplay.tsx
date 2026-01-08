import React, { useState } from 'react';
import { Brain, Tag, TrendingUp, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Question, Answer, MCQ } from '@/types';
import { Progress } from '@/components/ui/progress';

interface AnswerDisplayProps {
  question: Question;
  answer: Answer;
}

const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ question, answer }) => {
  const [showMCQs, setShowMCQs] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

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
