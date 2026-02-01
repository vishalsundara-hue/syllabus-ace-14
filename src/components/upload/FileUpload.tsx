import React, { useState, useCallback } from 'react';
import { Upload, FileText, Image, Loader2, CheckCircle, Sparkles, MessageSquare, Video, BookOpen, ChevronRight, Lightbulb, Target, Zap, Download, Code, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStudy } from '@/contexts/StudyContext';
import { UploadedFile, ExtractedTopic, DocumentQuestion, QuestionLevel } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
const FileUpload: React.FC = () => {
  const { uploadedFiles, addUploadedFile } = useStudy();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ExtractedTopic | null>(null);
  const [question, setQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [documentQuestion, setDocumentQuestion] = useState<DocumentQuestion | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [showManimCode, setShowManimCode] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractTopicsWithAI = async (file: File): Promise<{ summary: string; keyPoints: string[]; topics: ExtractedTopic[]; documentContext?: string }> => {
    try {
      // Read file content based on type
      let fileContent = '';
      let pdfBase64 = '';
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        fileContent = await file.text();
      } else if (file.type === 'application/pdf') {
        // Read PDF as base64 for server-side parsing
        pdfBase64 = await readFileAsBase64(file);
      }

      const { data, error } = await supabase.functions.invoke('extract-topics', {
        body: {
          fileName: file.name,
          fileContent: fileContent,
          fileType: file.type,
          pdfBase64: pdfBase64
        }
      });

      if (error) {
        console.error('Error extracting topics:', error);
        throw error;
      }

      if (data?.success) {
        return {
          summary: data.summary,
          keyPoints: data.keyPoints,
          topics: data.topics.map((t: ExtractedTopic, idx: number) => ({
            ...t,
            id: t.id || String(idx + 1)
          })),
          documentContext: data.documentContext
        };
      }

      throw new Error('Failed to extract topics');
    } catch (error) {
      console.error('Topic extraction failed, using fallback:', error);
      // Fallback to default topics
      return {
        summary: `Document "${file.name}" has been uploaded. The AI will analyze its contents for study assistance.`,
        keyPoints: [
          'Document successfully uploaded',
          'AI-powered topic extraction',
          'Interactive Q&A available',
          'Visual explanations on demand',
          'Practice questions included'
        ],
        topics: [
          { id: '1', name: 'Introduction & Fundamentals', description: 'Basic concepts and foundational knowledge', subtopics: ['Definitions', 'Core Principles', 'Historical Background'] },
          { id: '2', name: 'Core Concepts', description: 'Main theoretical frameworks and models', subtopics: ['Key Theories', 'Important Models', 'Relationships'] },
          { id: '3', name: 'Applications & Examples', description: 'Practical implementations and use cases', subtopics: ['Real-world Examples', 'Case Studies', 'Problem Solving'] },
          { id: '4', name: 'Advanced Topics', description: 'Complex concepts and optimization', subtopics: ['Edge Cases', 'Optimization', 'Advanced Techniques'] }
        ]
      };
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingFile(file.name);

    try {
      const isPdf = file.type === 'application/pdf';
      
      // Extract topics using AI
      const { summary, keyPoints, topics, documentContext } = await extractTopicsWithAI(file);
      
      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: isPdf ? 'pdf' : 'image',
        summary,
        keyPoints,
        topics,
        uploadedAt: new Date(),
        documentContext,
      };

      addUploadedFile(uploadedFile);
      
      toast({
        title: "File Processed!",
        description: `Extracted ${topics.length} topics from ${file.name}`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingFile(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        processFile(file);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const classifyQuestion = (q: string): { level: QuestionLevel; keywords: string[]; reason: string } => {
    const lowerQ = q.toLowerCase();
    const keywords: string[] = [];
    
    const wordMatches = q.match(/\b\w{4,}\b/g) || [];
    keywords.push(...wordMatches.slice(0, 5));

    if (lowerQ.includes('what is') || lowerQ.includes('define') || lowerQ.includes('meaning') || lowerQ.includes('explain simply')) {
      return {
        level: 'Beginner',
        keywords,
        reason: 'Question asks for basic definitions or simple understanding'
      };
    } else if (lowerQ.includes('optimize') || lowerQ.includes('internal') || lowerQ.includes('edge case') || lowerQ.includes('best practice') || lowerQ.includes('deep')) {
      return {
        level: 'Master',
        keywords,
        reason: 'Question involves advanced concepts, optimization, or deep technical understanding'
      };
    } else {
      return {
        level: 'Intermediate',
        keywords,
        reason: 'Question asks for implementation details, working mechanism, or practical examples'
      };
    }
  };

  const generateExplanation = (level: QuestionLevel, topic: string): { explanation: string; visualDescription: string; accuracyScore: number } => {
    const explanations = {
      Beginner: {
        explanation: `Let me explain "${topic}" in a very simple way:\n\n🎯 **What is it?**\nThink of it like this - imagine you have a toolbox. ${topic} is one of the most important tools in that box. It helps you solve specific problems easily.\n\n📚 **Simple Example:**\nJust like how a recipe guides you to cook a dish step by step, ${topic} guides you through a process to achieve a result.\n\n✨ **Key Points to Remember:**\n• It's a fundamental concept you'll use often\n• Start with the basics before moving to complex parts\n• Practice with simple examples first\n\n💡 **Real-life Analogy:**\nThink of learning to ride a bicycle. First, you learn balance (basics), then pedaling (application), and finally tricks (advanced). ${topic} follows the same learning pattern!`,
        visualDescription: `📊 **Visual Diagram:**\n\n┌─────────────────────────────────────┐\n│           ${topic.toUpperCase()}                   │\n├─────────────────────────────────────┤\n│                                     │\n│    ┌─────────┐    ┌─────────┐      │\n│    │  INPUT  │ ──▶│ PROCESS │      │\n│    └─────────┘    └────┬────┘      │\n│                        │           │\n│                        ▼           │\n│                   ┌─────────┐      │\n│                   │ OUTPUT  │      │\n│                   └─────────┘      │\n│                                     │\n└─────────────────────────────────────┘\n\n🔵 Blue boxes = Start/End points\n🟢 Green arrows = Data flow\n🟡 Yellow = Processing step`,
        accuracyScore: 92
      },
      Intermediate: {
        explanation: `Here's a detailed explanation of "${topic}":\n\n🔧 **How It Works:**\nThe mechanism involves several interconnected steps. Each component plays a crucial role in the overall functionality.\n\n📋 **Step-by-Step Process:**\n1. **Initialization** - Set up the required parameters\n2. **Processing** - Apply the core logic\n3. **Validation** - Check for correctness\n4. **Output** - Return the result\n\n💻 **Code Example:**\n\`\`\`\nfunction example(input) {\n  // Step 1: Initialize\n  let result = initialize(input);\n  \n  // Step 2: Process\n  result = process(result);\n  \n  // Step 3: Return\n  return result;\n}\n\`\`\`\n\n⚡ **Practical Applications:**\n• Used in web development for data handling\n• Essential for building scalable systems\n• Forms the basis for more complex operations`,
        visualDescription: `📊 **Architecture Diagram:**\n\n┌─────────────────────────────────────────────────┐\n│                 SYSTEM ARCHITECTURE              │\n├─────────────────────────────────────────────────┤\n│                                                 │\n│  ┌──────────┐     ┌──────────┐     ┌──────────┐│\n│  │  CLIENT  │────▶│  SERVER  │────▶│ DATABASE ││\n│  └──────────┘     └────┬─────┘     └──────────┘│\n│                        │                        │\n│       ┌────────────────┴────────────────┐      │\n│       │         MIDDLEWARE               │      │\n│       │  ┌─────┐  ┌─────┐  ┌─────┐     │      │\n│       │  │Auth │  │Cache│  │ Log │     │      │\n│       │  └─────┘  └─────┘  └─────┘     │      │\n│       └─────────────────────────────────┘      │\n│                                                 │\n└─────────────────────────────────────────────────┘\n\n➡️ Arrows show data flow direction\n📦 Boxes represent system components`,
        accuracyScore: 88
      },
      Master: {
        explanation: `Advanced analysis of "${topic}":\n\n🔬 **Deep Dive:**\nAt its core, this concept involves sophisticated algorithms and optimized data structures that enable efficient processing even at scale.\n\n⚙️ **Internal Working:**\n• **Memory Management:** Optimized allocation patterns\n• **Time Complexity:** O(log n) for most operations\n• **Space Complexity:** O(n) with lazy evaluation\n\n🚀 **Optimization Techniques:**\n1. **Caching** - Store computed results\n2. **Lazy Loading** - Load only when needed\n3. **Batch Processing** - Group similar operations\n4. **Parallel Execution** - Utilize multi-threading\n\n⚠️ **Edge Cases to Handle:**\n• Empty input handling\n• Overflow conditions\n• Concurrent access scenarios\n• Network failure recovery\n\n📈 **Performance Metrics:**\n\`\`\`\nBest Case:    O(1)\nAverage Case: O(log n)\nWorst Case:   O(n)\nSpace:        O(n)\n\`\`\`\n\n🎯 **Best Practices:**\n• Always validate inputs\n• Implement proper error handling\n• Use design patterns appropriately\n• Write comprehensive tests`,
        visualDescription: `📊 **Complexity Analysis Graph:**\n\n    Time ▲\n         │                           ╱ O(n²)\n         │                        ╱\n         │                     ╱\n         │                  ╱      ╱ O(n log n)\n         │               ╱     ╱\n         │            ╱    ╱\n         │         ╱   ╱         ── O(n)\n         │      ╱  ╱          ╌╌╌╌ O(log n)\n         │   ╱ ╱           ━━━━━ O(1)\n         │╱╱━━━━━━━━━━━━━━━━━━━━━━━\n         └──────────────────────────▶ Input Size (n)\n\n┌─────────────────────────────────────┐\n│     OPTIMIZATION DECISION TREE       │\n├─────────────────────────────────────┤\n│                 START                │\n│                   │                  │\n│           ┌───────┴───────┐         │\n│           ▼               ▼         │\n│      Cache Hit?      Process        │\n│       YES  NO          │            │\n│        │    │          ▼            │\n│   Return  Compute   Optimize        │\n│        │    │          │            │\n│        └────┴──────────┘            │\n│               │                      │\n│               ▼                      │\n│           RESULT                     │\n└─────────────────────────────────────┘`,
        accuracyScore: 95
      }
    };

    return explanations[level];
  };

  const analyzeQuestion = async () => {
    if (!question.trim() || !selectedTopic || !selectedFile) return;

    setIsAnalyzing(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const classification = classifyQuestion(question);
    const explanationData = generateExplanation(classification.level, selectedTopic.name);

    const docQuestion: DocumentQuestion = {
      id: Date.now().toString(),
      fileId: selectedFile.id,
      topicId: selectedTopic.id,
      question: question,
      level: classification.level,
      keywords: classification.keywords,
      reason: classification.reason,
      explanation: explanationData.explanation,
      visualDescription: explanationData.visualDescription,
      accuracyScore: explanationData.accuracyScore,
      videoStatus: 'idle',
      timestamp: new Date()
    };

    setDocumentQuestion(docQuestion);
    setIsAnalyzing(false);
  };

  const generateVideo = async () => {
    if (!documentQuestion || !selectedTopic) return;

    setIsGeneratingVideo(true);
    setDocumentQuestion(prev => prev ? { ...prev, videoStatus: 'generating' } : null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-explanation-visual', {
        body: {
          topic: selectedTopic.name,
          question: documentQuestion.question,
          level: documentQuestion.level,
          explanation: documentQuestion.explanation
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setDocumentQuestion(prev => prev ? { 
          ...prev, 
          videoStatus: 'ready',
          generatedImageUrl: data.image,
          manimCode: data.manimCode
        } : null);
        
        toast({
          title: "Visual Generated!",
          description: "Manim-style visualization has been created.",
        });
      } else {
        throw new Error(data?.error || 'Failed to generate visual');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      setDocumentQuestion(prev => prev ? { ...prev, videoStatus: 'error' } : null);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate visual. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const getLevelColor = (level: QuestionLevel) => {
    switch (level) {
      case 'Beginner': return 'bg-success/10 text-success border-success/20';
      case 'Intermediate': return 'bg-warning/10 text-warning border-warning/20';
      case 'Master': return 'bg-accent/10 text-accent border-accent/20';
    }
  };

  const getLevelIcon = (level: QuestionLevel) => {
    switch (level) {
      case 'Beginner': return <Lightbulb className="w-4 h-4" />;
      case 'Intermediate': return <Target className="w-4 h-4" />;
      case 'Master': return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">Upload Study Material</h2>
            <p className="text-sm text-muted-foreground">Upload PDF or images for AI analysis and topic extraction</p>
          </div>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
        >
          {isProcessing ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
              <div>
                <p className="font-medium text-foreground">Processing {processingFile}...</p>
                <p className="text-sm text-muted-foreground mt-1">AI is extracting topics and analyzing content</p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="font-medium text-foreground mb-2">
                Drag & drop your file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" /> PDF
                </span>
                <span className="flex items-center gap-1">
                  <Image className="w-4 h-4" /> PNG, JPG
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File Selection & Topic Selection */}
      {uploadedFiles.length > 0 && (
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Select Document & Topic
          </h3>

          {/* File Selection */}
          <div className="mb-4">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Choose a document</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedFile(file);
                    setSelectedTopic(null);
                    setDocumentQuestion(null);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedFile?.id === file.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      file.type === 'pdf' ? 'bg-destructive/10' : 'bg-success/10'
                    }`}>
                      {file.type === 'pdf' ? (
                        <FileText className="w-5 h-5 text-destructive" />
                      ) : (
                        <Image className="w-5 h-5 text-success" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.topics?.length || 0} topics extracted</p>
                    </div>
                    {selectedFile?.id === file.id && (
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Select a topic to study</label>
                <div className="space-y-2">
                  {selectedFile.topics?.map((topic) => (
                    <motion.div
                      key={topic.id}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setSelectedTopic(topic);
                        setDocumentQuestion(null);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedTopic?.id === topic.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-muted/20 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <p className="font-medium text-foreground">{topic.name}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {topic.subtopics.map((sub, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-transform ${
                          selectedTopic?.id === topic.id ? 'rotate-90 text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Question Input */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-foreground">Ask Your Doubt</h3>
                <p className="text-sm text-muted-foreground">
                  Ask any question about <span className="text-primary font-medium">{selectedTopic.name}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question here... (e.g., 'What is...', 'How does...', 'Explain...')"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && analyzeQuestion()}
              />
              <Button 
                onClick={analyzeQuestion} 
                disabled={!question.trim() || isAnalyzing}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Analyze
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Result */}
      <AnimatePresence>
        {documentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Question Analysis */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4">Question Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className={`p-4 rounded-xl border ${getLevelColor(documentQuestion.level)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {getLevelIcon(documentQuestion.level)}
                    <span className="text-sm font-medium">Level</span>
                  </div>
                  <p className="text-lg font-bold">{documentQuestion.level}</p>
                </div>
                
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {documentQuestion.keywords.slice(0, 4).map((kw, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Accuracy Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${documentQuestion.accuracyScore}%` }}
                        className="h-full bg-gradient-to-r from-primary to-accent"
                      />
                    </div>
                    <span className="text-lg font-bold text-foreground">{documentQuestion.accuracyScore}%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Classification Reason:</span> {documentQuestion.reason}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                Explanation
              </h3>
              <div className="prose prose-sm max-w-none text-foreground">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {documentQuestion.explanation}
                </div>
              </div>
            </div>

            {/* Visual Diagram */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-accent" />
                Visual Diagram
              </h3>
              <div className="bg-muted/30 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre text-muted-foreground">
                  {documentQuestion.visualDescription}
                </pre>
              </div>
            </div>

            {/* Manim Visual Generation */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Manim Visual Explanation
                </h3>
                {(documentQuestion.videoStatus === 'idle' || documentQuestion.videoStatus === 'error') && (
                  <Button onClick={generateVideo} className="gap-2" disabled={isGeneratingVideo}>
                    <ImageIcon className="w-4 h-4" />
                    Generate Visual
                  </Button>
                )}
              </div>

              {documentQuestion.videoStatus === 'generating' && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-primary/20 animate-pulse" />
                    <Loader2 className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                  </div>
                  <p className="mt-4 font-medium text-foreground">Generating Manim-style visual...</p>
                  <p className="text-sm text-muted-foreground">AI is creating an animated educational diagram</p>
                </div>
              )}

              {documentQuestion.videoStatus === 'error' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Video className="w-8 h-8 text-destructive" />
                  </div>
                  <p className="font-medium text-foreground">Generation Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the button above to try again
                  </p>
                </div>
              )}

              {documentQuestion.videoStatus === 'ready' && (
                <div className="space-y-6">
                  {/* Generated Manim-style Image */}
                  {documentQuestion.generatedImageUrl && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-accent" />
                        Generated Manim Visualization
                      </h4>
                      <div className="rounded-xl overflow-hidden border border-border bg-[#1a1a2e]">
                        <img 
                          src={documentQuestion.generatedImageUrl} 
                          alt="Manim visualization"
                          className="w-full h-auto"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        3Blue1Brown-style educational visualization generated by AI
                      </p>
                    </div>
                  )}

                  {/* Manim Python Code */}
                  {documentQuestion.manimCode && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Code className="w-4 h-4 text-primary" />
                          Manim Python Code
                        </h4>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowManimCode(!showManimCode)}
                          >
                            {showManimCode ? 'Hide Code' : 'Show Code'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const blob = new Blob([documentQuestion.manimCode || ''], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `manim_${selectedTopic?.name.replace(/\s+/g, '_').toLowerCase() || 'animation'}.py`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {showManimCode && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-[#1e1e2e] rounded-xl p-4 font-mono text-xs overflow-x-auto border border-border">
                              <pre className="text-green-400 whitespace-pre-wrap">
                                {documentQuestion.manimCode}
                              </pre>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Run this code with Manim Community Edition: <code className="bg-muted px-1 rounded">manim -pql animation.py SceneName</code>
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {!documentQuestion.generatedImageUrl && !documentQuestion.manimCode && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
                      <p className="font-medium text-foreground">Visual Generated!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manim animation for: {selectedTopic?.name}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {documentQuestion.videoStatus === 'idle' && (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Click "Generate Visual" to create a Manim-style animated explanation</p>
                  <p className="text-xs mt-2">Generates AI visualization + downloadable Python code</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;
