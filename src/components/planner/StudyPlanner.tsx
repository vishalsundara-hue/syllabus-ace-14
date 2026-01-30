import React, { useState } from 'react';
import { Calendar, Clock, Plus, Check, Sparkles, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStudy } from '@/contexts/StudyContext';
import { StudyPlan, StudyDay, TimeSlot } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const StudyPlanner: React.FC = () => {
  const { studyPlans, addStudyPlan } = useStudy();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [duration, setDuration] = useState('7');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const generateStudyPlan = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const days: StudyDay[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + currentWeekOffset * 7);

    const activities = [
      { time: '09:00', duration: 2, activity: 'Core Concept Study' },
      { time: '11:00', duration: 1, activity: 'Practice Problems' },
      { time: '14:00', duration: 1.5, activity: 'Video Tutorials' },
      { time: '16:00', duration: 1, activity: 'Review & Notes' },
      { time: '19:00', duration: 1, activity: 'Quick Revision' },
    ];

    for (let i = 0; i < parseInt(duration); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const timeSlots: TimeSlot[] = activities.slice(0, 3 + (i % 3)).map(act => ({
        startTime: act.time,
        endTime: `${parseInt(act.time.split(':')[0]) + Math.floor(act.duration)}:${act.duration % 1 ? '30' : '00'}`,
        activity: `${topic} - ${act.activity}`,
        completed: false,
      }));

      days.push({
        day: i + 1,
        date: date.toISOString().split('T')[0],
        timeSlots,
      });
    }

    const plan: StudyPlan = {
      id: Date.now().toString(),
      topic,
      days,
      createdAt: new Date(),
    };

    addStudyPlan(plan);
    setIsGenerating(false);
    setTopic('');
    toast.success('Study plan generated!');
  };

  const shareToCommmunity = async (plan: StudyPlan) => {
    if (!user) {
      toast.error('Please sign in to share your plan');
      navigate('/auth');
      return;
    }

    setIsSharing(true);
    try {
      const { error } = await supabase.from('shared_study_plans').insert([{
        user_id: user.id,
        title: `${plan.topic} Study Plan`,
        topic: plan.topic,
        days: plan.days as unknown as import('@/integrations/supabase/types').Json,
        description: `A ${plan.days.length}-day study plan for ${plan.topic}`,
      }]);

      if (error) throw error;
      toast.success('Plan shared to community!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to share plan');
    } finally {
      setIsSharing(false);
    }
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + currentWeekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentPlan = studyPlans[0];

  const getTasksForDate = (date: Date) => {
    if (!currentPlan) return [];
    const dateStr = date.toISOString().split('T')[0];
    const day = currentPlan.days.find(d => d.date === dateStr);
    return day?.timeSlots || [];
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
            <h2 className="font-display font-semibold text-lg text-foreground">Study Plan Generator</h2>
            <p className="text-sm text-muted-foreground">Create a personalized study schedule</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to study? (e.g., Data Structures)"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="flex-1 h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm"
            >
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
            <Button onClick={generateStudyPlan} disabled={isGenerating || !topic.trim()}>
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentWeekOffset(o => o - 1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-display font-semibold text-lg text-foreground">
            {weekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentWeekOffset(o => o + 1)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {dayNames.map((day, i) => (
            <div key={day} className="text-center p-2">
              <p className="text-xs font-medium text-muted-foreground">{day}</p>
              <p className={`text-lg font-semibold ${
                weekDays[i].toDateString() === new Date().toDateString()
                  ? 'text-primary'
                  : 'text-foreground'
              }`}>
                {weekDays[i].getDate()}
              </p>
            </div>
          ))}

          {/* Day Cells */}
          {weekDays.map((date, i) => {
            const tasks = getTasksForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={i}
                className={`min-h-[120px] p-2 rounded-xl border transition-colors ${
                  isToday
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-muted/30 border-border hover:border-primary/50'
                }`}
              >
                {tasks.length > 0 ? (
                  <div className="space-y-1">
                    {tasks.slice(0, 3).map((task, j) => (
                      <div
                        key={j}
                        className={`p-1.5 rounded text-xs ${
                          task.completed
                            ? 'bg-success/20 text-success line-through'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        <p className="font-medium truncate">{task.activity.split(' - ')[1]}</p>
                        <p className="text-[10px] opacity-70">{task.startTime}</p>
                      </div>
                    ))}
                    {tasks.length > 3 && (
                      <p className="text-[10px] text-muted-foreground text-center">
                        +{tasks.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">No tasks</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Tasks */}
      {currentPlan && (
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-foreground">Today's Schedule</h3>
                <p className="text-sm text-muted-foreground">{currentPlan.topic}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareToCommmunity(currentPlan)}
              disabled={isSharing}
              className="gap-2"
            >
              {isSharing ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              Share to Community
            </Button>
          </div>

          <div className="space-y-3">
            {getTasksForDate(new Date()).map((task, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-xl border ${
                  task.completed
                    ? 'bg-success/10 border-success/30'
                    : 'bg-muted/30 border-border'
                }`}
              >
                <button
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'bg-success border-success'
                      : 'border-muted-foreground hover:border-primary'
                  }`}
                >
                  {task.completed && <Check className="w-4 h-4 text-success-foreground" />}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.activity}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {task.startTime} - {task.endTime}
                  </p>
                </div>
              </div>
            ))}

            {getTasksForDate(new Date()).length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tasks scheduled for today</p>
                <p className="text-sm text-muted-foreground mt-1">Generate a study plan to get started</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
