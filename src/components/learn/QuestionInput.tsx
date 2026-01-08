import React, { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useStudy } from '@/contexts/StudyContext';
import { QuestionLevel, Question, Answer, HistoryItem } from '@/types';

interface QuestionInputProps {
  onAnalysis: (question: Question, answer: Answer) => void;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ onAnalysis }) => {
  const { college, topic, addToHistory } = useStudy();
  const [questionText, setQuestionText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const analyzeQuestion = (text: string): { level: QuestionLevel; keywords: string[]; reason: string } => {
    const lowerText = text.toLowerCase();
    
    // Keyword detection
    const allKeywords = text.match(/\b[A-Za-z]{4,}\b/g) || [];
    const keywords = [...new Set(allKeywords)].slice(0, 5);

    // Level classification
    const beginnerPatterns = ['what is', 'define', 'explain', 'meaning', 'basics', 'introduction'];
    const intermediatePatterns = ['how does', 'implement', 'example', 'work', 'code', 'process', 'steps'];
    const masterPatterns = ['optimize', 'edge case', 'internal', 'advanced', 'compare', 'difference', 'best practice', 'complexity'];

    if (masterPatterns.some(p => lowerText.includes(p))) {
      return { level: 'Master', keywords, reason: 'Your question involves advanced concepts, optimization, or deep understanding.' };
    }
    if (intermediatePatterns.some(p => lowerText.includes(p))) {
      return { level: 'Intermediate', keywords, reason: 'Your question focuses on implementation and working mechanisms.' };
    }
    return { level: 'Beginner', keywords, reason: 'Your question is about basic definitions and understanding.' };
  };

  const generateExplanation = (level: QuestionLevel, questionText: string): string => {
    const explanations: Record<QuestionLevel, string> = {
      Beginner: `Let me explain this in a simple way! 📚

Think of it like this: When you're learning something new, it's like building with blocks. Each concept is a building block that helps you understand bigger ideas.

**Simple Explanation:**
${topic} is a fundamental concept that forms the basis of many advanced topics. Here's what you need to know:

1. **Basic Definition**: This is the core idea that everything else builds upon.
2. **Why It Matters**: Understanding this helps you grasp more complex topics later.
3. **Real-Life Example**: Imagine you're organizing your bookshelf...

**Key Takeaway**: Focus on understanding the 'why' before the 'how'. Once you get the basic idea, everything else becomes easier! 💡`,

      Intermediate: `Great question! Let's dive into how this works. 🔧

**Technical Overview:**
${topic} involves several important mechanisms working together. Here's a step-by-step breakdown:

1. **Core Process**:
   - First, the system initializes the necessary components
   - Then, data flows through the processing pipeline
   - Finally, results are generated and returned

2. **Implementation Example**:
\`\`\`
// Example pseudocode
function process(input) {
  validate(input);
  transform(input);
  return result;
}
\`\`\`

3. **Common Use Cases**:
   - Scenario A: When you need to...
   - Scenario B: When handling...

**Pro Tip**: Always consider the input-output relationship when implementing! 🎯`,

      Master: `Excellent advanced question! Let's explore the deeper mechanics. 🧠

**Deep Dive Analysis:**

**1. Internal Architecture:**
The underlying structure of ${topic} involves sophisticated patterns:
- Memory management considerations
- Time complexity: O(n log n) in average case
- Space complexity trade-offs

**2. Optimization Strategies:**
\`\`\`
// Optimized approach
function optimizedProcess(input) {
  // Use memoization for repeated calculations
  const cache = new Map();
  // Implement early termination
  if (meetsCriteria(input)) return cached;
  // Apply divide-and-conquer
  return merge(process(left), process(right));
}
\`\`\`

**3. Edge Cases to Consider:**
- Empty input handling
- Maximum size boundaries
- Concurrent access scenarios

**4. Best Practices:**
- Always validate before processing
- Implement proper error boundaries
- Consider scalability from day one

**Expert Insight**: The key to mastery is understanding not just 'how' but 'why' each design decision was made. 🏆`,
    };

    return explanations[level];
  };

  const handleSubmit = async () => {
    if (!questionText.trim() || !topic) return;
    
    setIsLoading(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const analysis = analyzeQuestion(questionText);
    
    const question: Question = {
      id: Date.now().toString(),
      text: questionText,
      level: analysis.level,
      keywords: analysis.keywords,
      reason: analysis.reason,
      college,
      subject: '',
      topic,
      timestamp: new Date(),
    };

    const answer: Answer = {
      id: Date.now().toString(),
      questionId: question.id,
      explanation: generateExplanation(analysis.level, questionText),
      accuracyScore: Math.floor(Math.random() * 15) + 85, // 85-100%
    };

    const historyItem: HistoryItem = { question, answer };
    addToHistory(historyItem);
    onAnalysis(question, answer);
    setQuestionText('');
    setIsLoading(false);
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg text-foreground">Ask Your Doubt</h2>
          <p className="text-sm text-muted-foreground">
            {topic ? `Ask anything about ${topic}` : 'Select a topic first to ask questions'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder={topic ? `What would you like to know about ${topic}?` : 'Please select a topic first...'}
          disabled={!topic}
          className="min-h-[120px] bg-background border-border resize-none"
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {questionText.length}/500 characters
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!questionText.trim() || !topic || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Get Answer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionInput;
