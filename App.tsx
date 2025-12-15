import React, { useState } from 'react';
import { PageData, AppStep } from './types';
import PdfProcessor from './components/PdfProcessor';
import PageSelector from './components/PageSelector';
import StudySession from './components/StudySession';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [pages, setPages] = useState<PageData[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Handler when PDF is processed into images
  const handlePagesProcessed = (processedPages: PageData[]) => {
    setPages(processedPages);
    setStep(AppStep.SELECT);
  };

  // Handler for selecting/deselecting pages
  const handleTogglePage = (index: number) => {
    const newSelection = new Set(selectedIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedIndices(newSelection);
  };

  // Start the study session
  const startStudy = () => {
    if (selectedIndices.size > 0) {
      setStep(AppStep.STUDY);
    }
  };

  const reset = () => {
    setStep(AppStep.UPLOAD);
    setPages([]);
    setSelectedIndices(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {step === AppStep.UPLOAD && (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="mb-10 text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold text-primary">رفيق المذاكرة الذكي 🧠</h1>
                <p className="text-xl text-gray-500">حول محاضراتك وكتبك إلى شروحات مبسطة وملفات صوتية بضغطة زر</p>
            </div>
            <PdfProcessor onPagesProcessed={handlePagesProcessed} />
        </div>
      )}

      {step === AppStep.SELECT && (
        <PageSelector 
            pages={pages}
            selectedIndices={selectedIndices}
            onTogglePage={handleTogglePage}
            onConfirm={startStudy}
        />
      )}

      {step === AppStep.STUDY && (
        <StudySession 
            selectedPages={pages.filter(p => selectedIndices.has(p.pageIndex))}
            onBack={() => setStep(AppStep.SELECT)}
        />
      )}
    </div>
  );
};

export default App;
