import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PageData, StudyItem, ProcessStatus } from '../types';
import { explainPageImage, generatePageAudio } from '../services/geminiService';

interface StudySessionProps {
  selectedPages: PageData[];
  onBack: () => void;
}

const StudySession: React.FC<StudySessionProps> = ({ selectedPages, onBack }) => {
  // Local state to track progress of each item
  const [items, setItems] = useState<StudyItem[]>(() => 
    selectedPages.map(p => ({
      pageIndex: p.pageIndex,
      explanation: null,
      audioUrl: null,
      status: ProcessStatus.IDLE
    }))
  );

  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [processingText, setProcessingText] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);

  // --- Worker 1: Text Generation ---
  // Picks up IDLE items and converts them to TEXT_COMPLETE
  useEffect(() => {
    if (processingText) return;

    const nextIdx = items.findIndex(i => i.status === ProcessStatus.IDLE);
    if (nextIdx === -1) return;

    const targetPage = selectedPages.find(p => p.pageIndex === items[nextIdx].pageIndex);
    if (!targetPage) return;

    const processText = async () => {
      setProcessingText(true);
      
      // Update status to GENERATING_TEXT
      setItems(prev => {
        const copy = [...prev];
        copy[nextIdx] = { ...copy[nextIdx], status: ProcessStatus.GENERATING_TEXT };
        return copy;
      });

      try {
        const text = await explainPageImage(targetPage.imageBase64);
        setItems(prev => {
          const copy = [...prev];
          copy[nextIdx] = { 
            ...copy[nextIdx], 
            explanation: text, 
            status: ProcessStatus.TEXT_COMPLETE 
          };
          return copy;
        });
      } catch (err) {
        setItems(prev => {
          const copy = [...prev];
          copy[nextIdx] = { ...copy[nextIdx], status: ProcessStatus.ERROR, error: "فشل في شرح الصفحة" };
          return copy;
        });
      } finally {
        setProcessingText(false);
      }
    };

    processText();
  }, [items, processingText, selectedPages]);

  // --- Worker 2: Audio Generation ---
  // Picks up TEXT_COMPLETE items and converts them to COMPLETED (generating audio in parallel with text worker)
  useEffect(() => {
    if (processingAudio) return;

    const nextIdx = items.findIndex(i => i.status === ProcessStatus.TEXT_COMPLETE);
    if (nextIdx === -1) return;

    const itemToProcess = items[nextIdx];
    if (!itemToProcess.explanation) return;

    const processAudio = async () => {
      setProcessingAudio(true);

      // Update status to GENERATING_AUDIO
      setItems(prev => {
        const copy = [...prev];
        copy[nextIdx] = { ...copy[nextIdx], status: ProcessStatus.GENERATING_AUDIO };
        return copy;
      });

      try {
        const audioUrl = await generatePageAudio(itemToProcess.explanation!);
        setItems(prev => {
          const copy = [...prev];
          copy[nextIdx] = { 
            ...copy[nextIdx], 
            audioUrl: audioUrl, 
            status: ProcessStatus.COMPLETED 
          };
          return copy;
        });
      } catch (err) {
        setItems(prev => {
          const copy = [...prev];
          copy[nextIdx] = { ...copy[nextIdx], status: ProcessStatus.ERROR, error: "فشل في توليد الصوت" };
          return copy;
        });
      } finally {
        setProcessingAudio(false);
      }
    };

    processAudio();
  }, [items, processingAudio]);

  const currentItem = items[activeItemIndex];
  const currentPageData = selectedPages.find(p => p.pageIndex === currentItem.pageIndex);

  // Calculate overall progress
  const totalSteps = items.length * 2;
  const currentProgress = items.reduce((acc, item) => {
    switch (item.status) {
        case ProcessStatus.COMPLETED:
        case ProcessStatus.ERROR:
            return acc + 2;
        case ProcessStatus.GENERATING_AUDIO:
            return acc + 1.5;
        case ProcessStatus.TEXT_COMPLETE:
            return acc + 1;
        case ProcessStatus.GENERATING_TEXT:
            return acc + 0.5;
        default:
            return acc;
    }
  }, 0);
  
  const progressPercentage = Math.min(100, Math.round((currentProgress / totalSteps) * 100));

  // Helper to determine if we can show text content
  const hasText = currentItem.status === ProcessStatus.TEXT_COMPLETE || 
                  currentItem.status === ProcessStatus.GENERATING_AUDIO || 
                  currentItem.status === ProcessStatus.COMPLETED;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Bar Container */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-20 flex flex-col">
        <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-gray-800">جلسة المذاكرة</h1>
                    <span className="text-xs text-gray-500">
                        {progressPercentage === 100 ? 'اكتملت المعالجة' : `جاري المعالجة: ${progressPercentage}%`}
                    </span>
                </div>
            </div>
            <div className="flex gap-2">
                {items.map((item, idx) => (
                    <div 
                        key={item.pageIndex}
                        onClick={() => setActiveItemIndex(idx)}
                        title={`Page ${idx + 1}: ${item.status}`}
                        className={`h-2 w-8 rounded-full transition-all cursor-pointer ${
                            idx === activeItemIndex ? 'bg-primary scale-125 ring-2 ring-primary/30' :
                            item.status === ProcessStatus.COMPLETED ? 'bg-primary' :
                            item.status === ProcessStatus.ERROR ? 'bg-red-400' :
                            (item.status === ProcessStatus.TEXT_COMPLETE || item.status === ProcessStatus.GENERATING_AUDIO) ? 'bg-blue-400' :
                            (item.status === ProcessStatus.GENERATING_TEXT) ? 'bg-yellow-400' :
                            'bg-gray-200'
                        }`}
                    />
                ))}
            </div>
        </div>
        {/* Progress Bar Line */}
        <div className="w-full h-1 bg-gray-100">
            <div 
                className="h-full bg-primary transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(5,150,105,0.5)]" 
                style={{ width: `${progressPercentage}%` }}
            />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Original Page (Reference) */}
        <div className="w-1/2 bg-gray-100 p-6 flex items-center justify-center border-l border-gray-200 overflow-hidden relative">
            {currentPageData ? (
                 <div className="h-full w-full flex items-center justify-center">
                    <img 
                        src={currentPageData.imageBase64} 
                        className="max-h-full max-w-full object-contain shadow-2xl rounded-lg border border-gray-300"
                        alt="Original Document"
                    />
                 </div>
            ) : (
                <p>Loading...</p>
            )}
            <div className="absolute top-4 left-4 bg-black/60 text-white px-4 py-1 rounded-full text-sm backdrop-blur-sm">
                المصدر الأصلي - صفحة {currentPageData?.pageNumber}
            </div>
        </div>

        {/* Right: Explanation & Audio */}
        <div className="w-1/2 p-8 overflow-y-auto bg-white relative">
            <div className="max-w-2xl mx-auto">
                {/* 1. IDLE State */}
                {currentItem.status === ProcessStatus.IDLE && (
                   <div className="text-center py-20">
                       <p className="text-gray-400">في انتظار الدور للمعالجة...</p>
                   </div>
                )}

                {/* 2. Generating Text State (Big Spinner) */}
                {currentItem.status === ProcessStatus.GENERATING_TEXT && (
                     <div className="flex flex-col items-center justify-center py-20 space-y-6">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-2xl">📝</div>
                        </div>
                        <p className="text-lg text-gray-600 animate-pulse">
                            جاري قراءة الصفحة وتحليلها...
                        </p>
                     </div>
                )}

                {/* 3. Error State */}
                {currentItem.status === ProcessStatus.ERROR && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center">
                        {currentItem.error || "فشل في المعالجة"}
                    </div>
                )}

                {/* 4. Content (Text Ready or Audio Generating or Completed) */}
                {(hasText || currentItem.explanation) && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        
                        {/* Audio Section */}
                        <div className="sticky top-0 z-10">
                            {currentItem.status === ProcessStatus.COMPLETED && currentItem.audioUrl ? (
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4 backdrop-blur-md">
                                    <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-sm mb-1">الشرح الصوتي جاهز</h3>
                                        <audio controls src={currentItem.audioUrl} className="w-full h-8" />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-center gap-3 animate-pulse">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-blue-700 font-medium text-sm">جاري تحويل الشرح إلى ملف صوتي...</span>
                                </div>
                            )}
                        </div>

                        {/* Text Content */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2 inline-block">الشرح المبسط</h2>
                            {/* ReactMarkdown with Tailwind Typography classes */}
                            <div className="prose prose-lg prose-emerald max-w-none text-gray-700 leading-loose dir-rtl">
                                <ReactMarkdown>
                                    {currentItem.explanation || ''}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudySession;