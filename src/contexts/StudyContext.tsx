import React, { createContext, useContext, useState, useEffect } from 'react';
import { HistoryItem, UploadedFile, StudyPlan } from '@/types';

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

  useEffect(() => {
    localStorage.setItem('studybuddy-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('studybuddy-files', JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  useEffect(() => {
    localStorage.setItem('studybuddy-plans', JSON.stringify(studyPlans));
  }, [studyPlans]);

  const addToHistory = (item: HistoryItem) => {
    setHistory(prev => [item, ...prev].slice(0, 50));
  };

  const addUploadedFile = (file: UploadedFile) => {
    setUploadedFiles(prev => [file, ...prev]);
  };

  const addStudyPlan = (plan: StudyPlan) => {
    setStudyPlans(prev => [plan, ...prev]);
  };

  return (
    <StudyContext.Provider value={{
      college, setCollege,
      subject, setSubject,
      topic, setTopic,
      history, addToHistory,
      uploadedFiles, addUploadedFile,
      studyPlans, addStudyPlan,
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
