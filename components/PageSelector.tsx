import React from 'react';
import { PageData } from '../types';

interface PageSelectorProps {
  pages: PageData[];
  selectedIndices: Set<number>;
  onTogglePage: (index: number) => void;
  onConfirm: () => void;
}

const PageSelector: React.FC<PageSelectorProps> = ({ 
  pages, 
  selectedIndices, 
  onTogglePage, 
  onConfirm 
}) => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md shadow-sm p-4 flex justify-between items-center border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">اختر الصفحات للمذاكرة</h2>
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                تم اختيار {selectedIndices.size} صفحات
            </span>
            <button
                onClick={onConfirm}
                disabled={selectedIndices.size === 0}
                className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg transform active:scale-95 ${
                    selectedIndices.size > 0 
                    ? 'bg-primary hover:bg-emerald-700 shadow-emerald-200' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
            >
                بدء الشرح والتلخيص ✨
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {pages.map((page) => {
                const isSelected = selectedIndices.has(page.pageIndex);
                return (
                    <div 
                        key={page.pageIndex}
                        onClick={() => onTogglePage(page.pageIndex)}
                        className={`group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                            isSelected 
                            ? 'border-primary ring-4 ring-primary/20 shadow-xl scale-[1.02]' 
                            : 'border-transparent hover:border-gray-300 shadow-md bg-white hover:shadow-lg'
                        }`}
                    >
                        <div className="aspect-[1/1.4] relative">
                            <img 
                                src={page.imageBase64} 
                                alt={`Page ${page.pageNumber}`} 
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay */}
                            <div className={`absolute inset-0 transition-opacity duration-200 flex items-center justify-center ${
                                isSelected ? 'bg-primary/20 opacity-100' : 'bg-black/0 group-hover:bg-black/10'
                            }`}>
                                {isSelected && (
                                    <div className="bg-primary text-white rounded-full p-2 shadow-lg transform scale-100 animate-in fade-in zoom-in duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={`absolute bottom-0 inset-x-0 p-2 text-center text-sm font-bold ${
                            isSelected ? 'bg-primary text-white' : 'bg-gray-800/80 text-white'
                        }`}>
                            صفحة {page.pageNumber}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default PageSelector;
