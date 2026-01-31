import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import TopicSelector from '@/components/learn/TopicSelector';
import QuestionInput from '@/components/learn/QuestionInput';
import AnswerDisplay from '@/components/learn/AnswerDisplay';
import FileUpload from '@/components/upload/FileUpload';
import HistoryPanel from '@/components/history/HistoryPanel';
import MindMapView from '@/components/mindmap/MindMapView';
import StudyPlanner from '@/components/planner/StudyPlanner';
import CommunityPanel from '@/components/community/CommunityPanel';
import RoadmapPanel from '@/components/roadmap/RoadmapPanel';
import ProgressPanel from '@/components/progress/ProgressPanel';
import { Question, Answer } from '@/types';
import { Sparkles, BookOpen, Brain, Zap } from 'lucide-react';

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState('learn');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null);

  const handleAnalysis = (question: Question, answer: Answer) => {
    setCurrentQuestion(question);
    setCurrentAnswer(answer);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'learn':
        return (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 md:p-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-success/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium text-primary-foreground/80">AI-Powered Learning</span>
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  Learn Smarter, Not Harder
                </h1>
                <p className="text-primary-foreground/80 max-w-xl mb-6">
                  Get personalized explanations tailored to your understanding level. 
                  Upload your syllabus, ask questions, and master any topic with AI assistance.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-xl backdrop-blur-sm">
                    <BookOpen className="w-4 h-4 text-primary-foreground" />
                    <span className="text-sm text-primary-foreground">Syllabus-Aligned</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-xl backdrop-blur-sm">
                    <Brain className="w-4 h-4 text-primary-foreground" />
                    <span className="text-sm text-primary-foreground">Adaptive Learning</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-xl backdrop-blur-sm">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                    <span className="text-sm text-primary-foreground">Instant Answers</span>
                  </div>
                </div>
              </div>
            </div>

            <TopicSelector />
            <QuestionInput onAnalysis={handleAnalysis} />
            
            {currentQuestion && currentAnswer && (
              <AnswerDisplay question={currentQuestion} answer={currentAnswer} />
            )}
          </div>
        );
      case 'upload':
        return <FileUpload />;
      case 'history':
        return <HistoryPanel />;
      case 'mindmap':
        return <MindMapView />;
      case 'planner':
        return <StudyPlanner />;
      case 'community':
        return <CommunityPanel />;
      case 'roadmap':
        return <RoadmapPanel />;
      case 'progress':
        return <ProgressPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">StudyBuddy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your AI-powered academic learning companion
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
