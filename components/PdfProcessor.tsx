import React, { useCallback, useState } from 'react';
import { PageData } from '../types';

interface PdfProcessorProps {
  onPagesProcessed: (pages: PageData[]) => void;
}

const PdfProcessor: React.FC<PdfProcessorProps> = ({ onPagesProcessed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('الرجاء اختيار ملف PDF صحيح');
      return;
    }

    setIsProcessing(true);
    setProgress('جاري قراءة الملف...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF using the global library
      const loadingTask = window.pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      
      const processedPages: PageData[] = [];
      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        setProgress(`جاري معالجة الصفحة ${i} من ${totalPages}...`);
        
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // 1.5 scale for good readability/AI vision
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          processedPages.push({
            pageIndex: i - 1,
            pageNumber: i,
            imageBase64: canvas.toDataURL('image/png'),
            width: viewport.width,
            height: viewport.height
          });
        }
      }

      onPagesProcessed(processedPages);

    } catch (error) {
      console.error("Error parsing PDF:", error);
      alert("حدث خطأ أثناء معالجة الملف. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300 hover:border-primary transition-colors cursor-pointer relative">
        <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
        />
        
        {isProcessing ? (
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-gray-600 font-medium">{progress}</p>
            </div>
        ) : (
            <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">ارفع ملف الكتاب أو المحاضرة</h3>
                    <p className="text-gray-500 mt-2">اضغط هنا للاختيار أو اسحب الملف (PDF)</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default PdfProcessor;
