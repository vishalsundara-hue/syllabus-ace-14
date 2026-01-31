import React, { useState } from 'react';
import { Calendar, Clock, Plus, Check, Sparkles, ChevronLeft, ChevronRight, Share2, BookOpen, Youtube, Target, Award, Loader2, FileText, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStudy } from '@/contexts/StudyContext';
import { WeeklyPlan, WeekData, DailyTask } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

const StudyPlanner: React.FC = () => {
  const { weeklyPlans, addWeeklyPlan, updateWeeklyPlan, addTestScore, updateCompletionData } = useStudy();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [weeks, setWeeks] = useState('4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const [showTest, setShowTest] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);

  const currentPlan = weeklyPlans[0];
  const currentWeekData = currentPlan?.weeks?.[activeWeek];

  const generateWeeklyPlan = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        body: { topic: topic.trim(), weeks: parseInt(weeks) }
      });

      if (error) throw error;

      if (data?.success && data?.plan) {
        const plan: WeeklyPlan = {
          id: Date.now().toString(),
          topic: topic,
          currentWeek: 0,
          weeks: data.plan.weeks.map((w: any, i: number) => ({
            weekNumber: i + 1,
            theme: w.theme || `Week ${i + 1}`,
            topics: w.topics || [],
            resources: w.resources || [],
            books: w.books || [],
            dailyChecklist: (w.dailyChecklist || []).map((d: any) => ({
              day: d.day,
              tasks: (d.tasks || []).map((t: string) => ({ text: t, completed: false }))
            })),
            weeklyTest: {
              questions: w.weeklyTest?.questions || [],
              completed: false
            },
            revisionPlan: w.revisionPlan || { topics: [], keyPoints: [], quickTips: [] }
          })),
          createdAt: new Date()
        };

        addWeeklyPlan(plan);
        setTopic('');
        toast.success('Weekly study plan generated!');
      } else {
        throw new Error(data?.error || 'Failed to generate plan');
      }
    } catch (error: any) {
      console.error('Error generating plan:', error);
      toast.error(error.message || 'Failed to generate study plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskComplete = (dayIndex: number, taskIndex: number) => {
    if (!currentPlan || !currentWeekData) return;

    const updatedPlan = { ...currentPlan };
    const task = updatedPlan.weeks[activeWeek].dailyChecklist[dayIndex].tasks[taskIndex];
    task.completed = !task.completed;
    updateWeeklyPlan(updatedPlan);

    // Calculate completion percentage
    const allTasks = updatedPlan.weeks[activeWeek].dailyChecklist.flatMap(d => d.tasks);
    const completedTasks = allTasks.filter(t => t.completed).length;
    const completion = Math.round((completedTasks / allTasks.length) * 100);
    
    updateCompletionData({ week: `Week ${activeWeek + 1}`, completion });
  };

  const handleTestAnswer = (questionIndex: number, answerIndex: number) => {
    if (!testSubmitted) {
      setTestAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
    }
  };

  const submitTest = () => {
    if (!currentWeekData) return;

    const questions = currentWeekData.weeklyTest.questions;
    let correct = 0;
    questions.forEach((q, i) => {
      if (testAnswers[i] === q.correctAnswer) correct++;
    });

    const score = Math.round((correct / questions.length) * 100);
    addTestScore({ week: `Week ${activeWeek + 1}`, score });

    const updatedPlan = { ...currentPlan! };
    updatedPlan.weeks[activeWeek].weeklyTest.completed = true;
    updatedPlan.weeks[activeWeek].weeklyTest.score = score;
    updateWeeklyPlan(updatedPlan);

    setTestSubmitted(true);
    toast.success(`Test completed! Score: ${score}%`);
  };

  const getYoutubeLink = (topic: string) => {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'medium': return 'bg-warning/10 text-warning border-warning/30';
      case 'low': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">Weekly Study Plan Generator</h2>
            <p className="text-sm text-muted-foreground">AI-powered personalized study schedule with tests & revision</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to study? (e.g., Data Structures)"
            />
          </div>
          <select
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
            className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm"
          >
            <option value="2">2 weeks</option>
            <option value="4">4 weeks</option>
            <option value="6">6 weeks</option>
            <option value="8">8 weeks</option>
          </select>
          <Button onClick={generateWeeklyPlan} disabled={isGenerating || !topic.trim()}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="ml-2">Generate</span>
          </Button>
        </div>
      </div>

      {/* Weekly Plan Display */}
      {currentPlan && currentWeekData && (
        <>
          {/* Week Selector */}
          <div className="glass-card p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground">{currentPlan.topic}</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveWeek(w => Math.max(0, w - 1))}
                  disabled={activeWeek === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">Week {activeWeek + 1} of {currentPlan.weeks.length}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveWeek(w => Math.min(currentPlan.weeks.length - 1, w + 1))}
                  disabled={activeWeek === currentPlan.weeks.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{currentWeekData.theme}</p>
          </div>

          <Tabs defaultValue="topics" className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="topics">Topics</TabsTrigger>
              <TabsTrigger value="daily">Daily Tasks</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="test">Weekly Test</TabsTrigger>
              <TabsTrigger value="revision">Revision</TabsTrigger>
            </TabsList>

            {/* Topics Tab */}
            <TabsContent value="topics" className="glass-card p-6 mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Topics to Study This Week</h3>
              </div>
              <div className="space-y-3">
                {currentWeekData.topics.map((topic, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{topic.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(topic.priority)}`}>
                            {topic.priority} priority
                          </span>
                          {topic.examFrequency === 'often' && (
                            <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                              Exam frequent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{topic.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{topic.hoursRecommended}h</p>
                        <a
                          href={getYoutubeLink(topic.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-destructive hover:underline mt-1"
                        >
                          <Youtube className="w-3 h-3" />
                          Watch
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Daily Tasks Tab */}
            <TabsContent value="daily" className="glass-card p-6 mt-4">
              <div className="flex items-center gap-3 mb-4">
                <CheckSquare className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Daily Checklist</h3>
              </div>
              <div className="space-y-4">
                {currentWeekData.dailyChecklist.map((day, dayIndex) => (
                  <div key={dayIndex} className="p-4 rounded-xl border border-border bg-muted/30">
                    <h4 className="font-medium text-foreground mb-3">{day.day}</h4>
                    <div className="space-y-2">
                      {day.tasks.map((task, taskIndex) => (
                        <button
                          key={taskIndex}
                          onClick={() => toggleTaskComplete(dayIndex, taskIndex)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                            task.completed
                              ? 'bg-success/10 border border-success/30'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            task.completed
                              ? 'bg-success border-success'
                              : 'border-muted-foreground'
                          }`}>
                            {task.completed && <Check className="w-3 h-3 text-success-foreground" />}
                          </div>
                          <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="glass-card p-6 mt-4">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Learning Resources & Books</h3>
              </div>
              
              <div className="space-y-6">
                {/* Resources */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Recommended Resources</h4>
                  <div className="space-y-2">
                    {currentWeekData.resources.map((resource, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        {resource.type === 'video' && <Youtube className="w-4 h-4 text-destructive" />}
                        {resource.type === 'article' && <FileText className="w-4 h-4 text-primary" />}
                        {resource.type === 'book' && <BookOpen className="w-4 h-4 text-accent" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{resource.title}</p>
                          <p className="text-xs text-muted-foreground">{resource.description}</p>
                        </div>
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Open
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Books */}
                {currentWeekData.books.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Book Recommendations</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {currentWeekData.books.map((book, i) => (
                        <div key={i} className="p-4 rounded-xl border border-border bg-muted/30">
                          <p className="font-medium text-foreground">{book.title}</p>
                          <p className="text-sm text-muted-foreground">by {book.author}</p>
                          {book.chapters && (
                            <p className="text-xs text-primary mt-1">Chapters: {book.chapters}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Weekly Test Tab */}
            <TabsContent value="test" className="glass-card p-6 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Weekly Assessment</h3>
                </div>
                {currentWeekData.weeklyTest.completed && (
                  <span className="text-sm font-medium text-success">
                    Score: {currentWeekData.weeklyTest.score}%
                  </span>
                )}
              </div>

              {currentWeekData.weeklyTest.questions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No test questions available for this week
                </p>
              ) : (
                <div className="space-y-6">
                  {currentWeekData.weeklyTest.questions.slice(0, 10).map((q, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-muted/30">
                      <p className="font-medium text-foreground mb-3">{i + 1}. {q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((option, optIndex) => {
                          const isSelected = testAnswers[i] === optIndex;
                          const isCorrect = q.correctAnswer === optIndex;
                          const showResult = testSubmitted;

                          return (
                            <button
                              key={optIndex}
                              onClick={() => handleTestAnswer(i, optIndex)}
                              disabled={testSubmitted}
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
                              <span className="text-sm">{option}</span>
                            </button>
                          );
                        })}
                      </div>
                      {testSubmitted && q.explanation && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          <span className="font-medium">Explanation:</span> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}

                  {!testSubmitted && currentWeekData.weeklyTest.questions.length > 0 && (
                    <Button onClick={submitTest} className="w-full">
                      Submit Test
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Revision Tab */}
            <TabsContent value="revision" className="glass-card p-6 mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">One-Day Quick Revision</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Topics to Revise</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentWeekData.revisionPlan.topics.map((topic, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Key Points</h4>
                  <ul className="space-y-2">
                    {currentWeekData.revisionPlan.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-primary">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Quick Tips</h4>
                  <div className="space-y-2">
                    {currentWeekData.revisionPlan.quickTips.map((tip, i) => (
                      <div key={i} className="p-3 bg-accent/10 rounded-lg text-sm text-foreground">
                        💡 {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!currentPlan && (
        <div className="glass-card p-12 text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Generate a study plan to get started</p>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
