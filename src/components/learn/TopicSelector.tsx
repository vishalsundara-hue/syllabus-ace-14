import React from 'react';
import { GraduationCap, BookText, Target, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudy } from '@/contexts/StudyContext';

const colleges = [
  'MIT - Massachusetts Institute of Technology',
  'Stanford University',
  'Harvard University',
  'IIT Delhi',
  'IIT Bombay',
  'Cambridge University',
  'Oxford University',
  'Other',
];

const subjects: Record<string, string[]> = {
  'Computer Science': ['Data Structures', 'Algorithms', 'Database Management', 'Operating Systems', 'Computer Networks', 'Machine Learning'],
  'Mathematics': ['Calculus', 'Linear Algebra', 'Discrete Mathematics', 'Probability & Statistics', 'Differential Equations'],
  'Physics': ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Quantum Physics', 'Optics'],
  'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry'],
  'Electronics': ['Digital Electronics', 'Analog Circuits', 'VLSI Design', 'Signal Processing'],
};

const TopicSelector: React.FC = () => {
  const { college, setCollege, subject, setSubject, topic, setTopic } = useStudy();
  const [selectedSubjectCategory, setSelectedSubjectCategory] = React.useState('');

  const handleSubjectCategoryChange = (category: string) => {
    setSelectedSubjectCategory(category);
    setSubject('');
    setTopic('');
  };

  const availableTopics = selectedSubjectCategory ? subjects[selectedSubjectCategory] || [] : [];

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg text-foreground">Select Your Topic</h2>
          <p className="text-sm text-muted-foreground">Choose your college, subject, and topic to get started</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* College Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <GraduationCap className="w-4 h-4 text-primary" />
            College
          </label>
          <Select value={college} onValueChange={setCollege}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Select your college" />
            </SelectTrigger>
            <SelectContent>
              {colleges.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <BookText className="w-4 h-4 text-primary" />
            Subject
          </label>
          <Select value={selectedSubjectCategory} onValueChange={handleSubjectCategoryChange}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(subjects).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Topic Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Target className="w-4 h-4 text-primary" />
            Topic
          </label>
          <Select value={topic} onValueChange={setTopic} disabled={!selectedSubjectCategory}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              {availableTopics.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selection Summary */}
      {college && topic && (
        <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <span className="font-medium">{college}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{selectedSubjectCategory}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-primary">{topic}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicSelector;
