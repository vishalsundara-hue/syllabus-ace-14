import React, { useState, useCallback } from 'react';
import { Upload, FileText, Image, X, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudy } from '@/contexts/StudyContext';
import { UploadedFile } from '@/types';

const FileUpload: React.FC = () => {
  const { uploadedFiles, addUploadedFile } = useStudy();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingFile(file.name);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const isPdf = file.type === 'application/pdf';
    
    const uploadedFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      type: isPdf ? 'pdf' : 'image',
      summary: `This ${isPdf ? 'document' : 'image'} contains important study material about the uploaded subject. The content covers fundamental concepts and practical applications that are essential for understanding the topic thoroughly.`,
      keyPoints: [
        'Introduction to core concepts and terminology',
        'Step-by-step explanation of key processes',
        'Real-world applications and examples',
        'Important formulas and definitions',
        'Practice problems and solutions',
      ],
      uploadedAt: new Date(),
    };

    addUploadedFile(uploadedFile);
    setIsProcessing(false);
    setProcessingFile(null);
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
            <p className="text-sm text-muted-foreground">Upload PDF or images of your syllabus for AI summarization</p>
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
                <p className="text-sm text-muted-foreground mt-1">AI is analyzing your document</p>
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

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Processed Documents
          </h3>
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex items-start justify-between mb-3">
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
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                    <p className="text-sm text-foreground">{file.summary}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Key Points</p>
                    <ul className="space-y-1">
                      {file.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
