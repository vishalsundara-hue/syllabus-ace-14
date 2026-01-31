import React, { createContext, useContext, useState, useEffect } from 'react';
import { HistoryItem, UploadedFile, StudyPlan, WeeklyPlan } from '@/types';

interface WeeklyTestScore {
  week: string;
  score: number;
}

interface WeeklyCompletion {
  week: string;
  completion: number;
}

interface StudyContextType {
  college: string;
  setCollege: (college: string) => void;
  subject: string;
  setSubject: (subject: string) => void;
  topic: string;
  setTopic: (topic: string) => void;
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  uploadedFiles: UploadedFile[];
  addUploadedFile: (file: UploadedFile) => void;
  studyPlans: StudyPlan[];
  addStudyPlan: (plan: StudyPlan) => void;
  weeklyPlans: WeeklyPlan[];
  addWeeklyPlan: (plan: WeeklyPlan) => void;
  updateWeeklyPlan: (plan: WeeklyPlan) => void;
  weeklyTestScores: WeeklyTestScore[];
  addTestScore: (score: WeeklyTestScore) => void;
  weeklyCompletionData: WeeklyCompletion[];
  updateCompletionData: (data: WeeklyCompletion) => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [college, setCollege] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const stored = localStorage.getItem('studybuddy-history');
    return stored ? JSON.parse(stored) : [];
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
    const stored = localStorage.getItem('studybuddy-files');
    return stored ? JSON.parse(stored) : [];
  });
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>(() => {
    const stored = localStorage.getItem('studybuddy-plans');
    return stored ? JSON.parse(stored) : [];
  });
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>(() => {
    const stored = localStorage.getItem('studybuddy-weekly-plans');
    return stored ? JSON.parse(stored) : [];
  });
  const [weeklyTestScores, setWeeklyTestScores] = useState<WeeklyTestScore[]>(() => {
    const stored = localStorage.getItem('studybuddy-test-scores');
    return stored ? JSON.parse(stored) : [];
  });
  const [weeklyCompletionData, setWeeklyCompletionData] = useState<WeeklyCompletion[]>(() => {
    const stored = localStorage.getItem('studybuddy-completion');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('studybuddy-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('studybuddy-files', JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  useEffect(() => {
    localStorage.setItem('studybuddy-plans', JSON.stringify(studyPlans));
  }, [studyPlans]);

  useEffect(() => {
    localStorage.setItem('studybuddy-weekly-plans', JSON.stringify(weeklyPlans));
  }, [weeklyPlans]);

  useEffect(() => {
    localStorage.setItem('studybuddy-test-scores', JSON.stringify(weeklyTestScores));
  }, [weeklyTestScores]);

  useEffect(() => {
    localStorage.setItem('studybuddy-completion', JSON.stringify(weeklyCompletionData));
  }, [weeklyCompletionData]);

  const addToHistory = (item: HistoryItem) => {
    setHistory(prev => [item, ...prev].slice(0, 50));
  };

  const addUploadedFile = (file: UploadedFile) => {
    setUploadedFiles(prev => [file, ...prev]);
  };

  const addStudyPlan = (plan: StudyPlan) => {
    setStudyPlans(prev => [plan, ...prev]);
  };

  const addWeeklyPlan = (plan: WeeklyPlan) => {
    setWeeklyPlans(prev => [plan, ...prev]);
  };

  const updateWeeklyPlan = (plan: WeeklyPlan) => {
    setWeeklyPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
  };

  const addTestScore = (score: WeeklyTestScore) => {
    setWeeklyTestScores(prev => [...prev, score].slice(-12));
  };

  const updateCompletionData = (data: WeeklyCompletion) => {
    setWeeklyCompletionData(prev => {
      const existing = prev.findIndex(d => d.week === data.week);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = data;
        return updated;
      }
      return [...prev, data].slice(-12);
    });
  };

  return (
    <StudyContext.Provider value={{
      college, setCollege,
      subject, setSubject,
      topic, setTopic,
      history, addToHistory,
      uploadedFiles, addUploadedFile,
      studyPlans, addStudyPlan,
      weeklyPlans, addWeeklyPlan, updateWeeklyPlan,
      weeklyTestScores, addTestScore,
      weeklyCompletionData, updateCompletionData,
    }}>
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
