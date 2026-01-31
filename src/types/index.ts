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
}

export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
}

export interface HistoryItem {
  question: Question;
  answer: Answer;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  summary: string;
  keyPoints: string[];
  topics: ExtractedTopic[];
  uploadedAt: Date;
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
