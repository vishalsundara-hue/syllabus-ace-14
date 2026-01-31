import React from 'react';
import { TrendingUp, Calendar, Target, Award, CheckCircle, XCircle } from 'lucide-react';
import { useStudy } from '@/contexts/StudyContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ProgressPanel: React.FC = () => {
  const { studyPlans, weeklyTestScores, weeklyCompletionData } = useStudy();

  // Default demo data if no real data
  const testScoresData = weeklyTestScores.length > 0 ? weeklyTestScores : [
    { week: 'Week 1', score: 0 },
    { week: 'Week 2', score: 0 },
    { week: 'Week 3', score: 0 },
    { week: 'Week 4', score: 0 },
  ];

  const completionData = weeklyCompletionData.length > 0 ? weeklyCompletionData : [
    { week: 'Week 1', completion: 0 },
    { week: 'Week 2', completion: 0 },
    { week: 'Week 3', completion: 0 },
    { week: 'Week 4', completion: 0 },
  ];

  const averageScore = testScoresData.reduce((acc, curr) => acc + curr.score, 0) / testScoresData.length || 0;
  const averageCompletion = completionData.reduce((acc, curr) => acc + curr.completion, 0) / completionData.length || 0;
  const totalPlans = studyPlans.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">Your Progress</h2>
            <p className="text-sm text-muted-foreground">Track your learning journey and performance</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-primary/10 rounded-xl">
            <Target className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalPlans}</p>
            <p className="text-xs text-muted-foreground">Study Plans</p>
          </div>
          <div className="p-4 bg-success/10 rounded-xl">
            <Award className="w-5 h-5 text-success mb-2" />
            <p className="text-2xl font-bold text-foreground">{averageScore.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Avg Test Score</p>
          </div>
          <div className="p-4 bg-accent/10 rounded-xl">
            <CheckCircle className="w-5 h-5 text-accent mb-2" />
            <p className="text-2xl font-bold text-foreground">{averageCompletion.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Avg Completion</p>
          </div>
          <div className="p-4 bg-warning/10 rounded-xl">
            <Calendar className="w-5 h-5 text-warning mb-2" />
            <p className="text-2xl font-bold text-foreground">{testScoresData.filter(d => d.score > 0).length}</p>
            <p className="text-xs text-muted-foreground">Tests Taken</p>
          </div>
        </div>
      </div>

      {/* Test Performance Graph */}
      <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">Weekly Test Performance</h3>
            <p className="text-sm text-muted-foreground">Your scores on weekly assessments</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={testScoresData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value}%`, 'Score']}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {testScoresData.every(d => d.score === 0) && (
          <p className="text-center text-muted-foreground mt-4 text-sm">
            Complete weekly tests to see your performance here
          </p>
        )}
      </div>

      {/* Consistency Graph */}
      <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">Weekly Plan Completion</h3>
            <p className="text-sm text-muted-foreground">Your consistency in following study plans</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value}%`, 'Completion']}
              />
              <Line 
                type="monotone" 
                dataKey="completion" 
                stroke="hsl(var(--accent))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {completionData.every(d => d.completion === 0) && (
          <p className="text-center text-muted-foreground mt-4 text-sm">
            Complete daily tasks to track your consistency
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgressPanel;
