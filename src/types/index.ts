export type QuestionLevel = 'Beginner' | 'Intermediate' | 'Master';

export interface Question {
  id: string;
  text: string;
  level: QuestionLevel;
  keywords: string[];
  reason: string;
  college: string;
  subject: string;
  topic: string;
  timestamp: Date;
}

export interface Answer {
  id: string;
  questionId: string;
  explanation: string;
  accuracyScore: number;
  diagrams?: string;
  mcqs?: MCQ[];
  keyTakeaways?: string[];
  relatedTopics?: string[];
  youtubeQuery?: string;
}

export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
  explanation?: string;
}

export interface HistoryItem {
  question: Question;
  answer: Answer;
  followUpMessages?: { role: 'user' | 'assistant'; content: string }[];
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  summary: string;
  keyPoints: string[];
  topics: ExtractedTopic[];
  uploadedAt: Date;
  documentContext?: string;
}

export interface ExtractedTopic {
  id: string;
  name: string;
  description: string;
  subtopics: string[];
}

export interface DocumentQuestion {
  id: string;
  fileId: string;
  topicId: string;
  question: string;
  level: QuestionLevel;
  keywords: string[];
  reason: string;
  explanation: string;
  visualDescription: string;
  diagramUrl?: string;
  generatedImageUrl?: string;
  manimCode?: string;
  accuracyScore: number;
  videoStatus: 'idle' | 'generating' | 'ready' | 'error';
  videoUrl?: string;
  timestamp: Date;
}

export interface StudyPlan {
  id: string;
  topic: string;
  days: StudyDay[];
  createdAt: Date;
}

export interface StudyDay {
  day: number;
  date: string;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  activity: string;
  completed: boolean;
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

// New types for enhanced Study Plan
export interface WeeklyPlan {
  id: string;
  topic: string;
  currentWeek: number;
  weeks: WeekData[];
  createdAt: Date;
}

export interface WeekData {
  weekNumber: number;
  theme: string;
  topics: WeekTopic[];
  resources: WeekResource[];
  books: BookRecommendation[];
  dailyChecklist: DailyChecklist[];
  weeklyTest: WeeklyTest;
  revisionPlan: RevisionPlan;
}

export interface WeekTopic {
  name: string;
  priority: 'high' | 'medium' | 'low';
  hoursRecommended: number;
  examFrequency: 'often' | 'sometimes' | 'rarely';
  description: string;
}

export interface WeekResource {
  type: 'video' | 'article' | 'book' | 'practice';
  title: string;
  url?: string;
  description: string;
}

export interface BookRecommendation {
  title: string;
  author: string;
  chapters?: string;
}

export interface DailyChecklist {
  day: string;
  tasks: DailyTask[];
}

export interface DailyTask {
  text: string;
  completed: boolean;
}

export interface WeeklyTest {
  questions: TestQuestion[];
  completed: boolean;
  score?: number;
}

export interface TestQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
}

export interface RevisionPlan {
  topics: string[];
  keyPoints: string[];
  quickTips: string[];
}
