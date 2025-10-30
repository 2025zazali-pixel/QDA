import React, { useState, useEffect, useRef } from 'react';
import { Document, Code, AiSuggestedTheme } from '../../types.ts';
import { detectThemes } from '../../services/geminiService.ts';
import { XIcon } from '../icons.tsx';

interface ThemeDetectionModalProps {
  doc: Document;
  existingCodes: Code[];
  onClose: () => void;
  onApplyThemes: (themes: AiSuggestedTheme[]) => void;
}

// Represents the selectable state of the AI results in the UI
// Fix: Corrected the type definition to avoid creating an impossible intersection type for the 'quotes' property.
// By using Omit, we remove the original 'quotes' property from AiSuggestedTheme before adding the new one.
type SelectableTheme = Omit<AiSuggestedTheme, 'quotes'> & {
  isSelected: boolean;
  quotes: {
    text: string;
    isSelected: boolean;
  }[];
};

const ThemeDetectionModal: React.FC<ThemeDetectionModalProps> = ({ doc, existingCodes, onClose, onApplyThemes }) => {
  const [themes, setThemes] = useState<SelectableTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const results = await detectThemes(doc, existingCodes);
        setThemes(
          results.map(theme => ({
            ...theme,
            isSelected: true,
            quotes: theme.quotes.map(q => ({ text: q, isSelected: true })),
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchThemes();
  }, [doc, existingCodes]);

  const handleThemeSelectionChange = (themeIndex: number, isSelected: boolean) => {
    setThemes(prev =>
      prev.map((theme, i) =>
        i === themeIndex ? { ...theme, isSelected, quotes: theme.quotes.map(q => ({...q, isSelected})) } : theme
      )
    );
  };
  
  const handleQuoteSelectionChange = (themeIndex: number, quoteIndex: number, isSelected: boolean) => {
      setThemes(prev => {
          const newThemes = [...prev];
          const theme = newThemes[themeIndex];
          theme.quotes[quoteIndex].isSelected = isSelected;
          // If all quotes are deselected, deselect the theme. If one is selected, select the theme.
          theme.isSelected = theme.quotes.some(q => q.isSelected);
          return newThemes;
      })
  };
  
  const handleThemeDetailChange = (themeIndex: number, field: 'name' | 'description', value: string) => {
      setThemes(prev => 
        prev.map((theme, i) => {
            if (i === themeIndex) {
                return {
                    ...theme,
                    code: {
                        ...theme.code,
                        [field]: value
                    }
                }
            }
            return theme;
        })
      );
  };

  const autoResizeTextarea = (index: number) => {
      const textarea = textareaRefs.current[index];
      if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
      }
  };

  useEffect(() => {
    themes.forEach((_, index) => autoResizeTextarea(index));
  }, [themes]);

  const handleSubmit = () => {
    const selectedThemes: AiSuggestedTheme[] = themes
        .filter(t => t.isSelected)
        .map(t => ({
            code: t.code,
            quotes: t.quotes.filter(q => q.isSelected).map(q => q.text)
        }));
    
    onApplyThemes(selectedThemes);
  };
  
  const renderContent = () => {
      if (isLoading) {
          return (
            <div className="p-10 text-center">
                <p className="text-slate-600 animate-pulse">QualiSage AI is analyzing your document...</p>
            </div>
          );
      }
      if (error) {
          return (
            <div className="p-6 bg-red-50 text-red-700 rounded-md">
                <h3 className="font-semibold">Analysis Failed</h3>
                <p>{error}</p>
            </div>
          );
      }
      if (themes.length === 0) {
          return (
            <div className="p-10 text-center">
                <p className="text-slate-600">No specific themes were detected in this document.</p>
            </div>
          );
      }
      
      return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
            {themes.map((theme, themeIndex) => (
                <div key={themeIndex} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <input type="checkbox" checked={theme.isSelected} onChange={(e) => handleThemeSelectionChange(themeIndex, e.target.checked)} className="h-5 w-5 mt-1 rounded text-indigo-600 focus:ring-indigo-500 flex-shrink-0" />
                        <div className="flex-grow">
                           <input 
                                type="text"
                                value={theme.code.name}
                                onChange={(e) => handleThemeDetailChange(themeIndex, 'name', e.target.value)}
                                className="font-semibold text-slate-800 w-full p-1 -ml-1 rounded-md bg-transparent hover:bg-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-colors"
                           />
                           <textarea
                                // Fix: Ref callback functions should not return a value. Using a block body to prevent implicit return.
                                ref={el => { textareaRefs.current[themeIndex] = el; }}
                                value={theme.code.description}
                                onChange={(e) => {
                                    handleThemeDetailChange(themeIndex, 'description', e.target.value);
                                    autoResizeTextarea(themeIndex);
                                }}
                                rows={1}
                                className="text-sm text-slate-600 w-full p-1 -ml-1 rounded-md bg-transparent hover:bg-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-colors resize-none overflow-hidden"
                           />
                        </div>
                    </div>
                    <div className="pl-8 pt-3 mt-3 border-t border-slate-200 space-y-3">
                        {theme.quotes.map((quote, quoteIndex) => (
                            <div key={quoteIndex} className="flex items-start space-x-3">
                                <input type="checkbox" checked={quote.isSelected} onChange={(e) => handleQuoteSelectionChange(themeIndex, quoteIndex, e.target.checked)} className="h-5 w-5 mt-1 rounded text-indigo-600 focus:ring-indigo-500" />
                                <blockquote className="text-sm text-slate-700 border-l-2 border-slate-300 pl-3 leading-6">
                                    "{quote.text}"
                                </blockquote>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 animate-fade-in-fast flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold">AI-Detected Themes</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <XIcon className="h-6 w-6 text-slate-500" />
          </button>
        </div>
        <div className="p-6 flex-grow overflow-hidden">
            <p className="text-sm text-slate-600 mb-4">Review and edit the themes and quotes identified by the AI. Uncheck any you don't want to add to your project.</p>
            {renderContent()}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-indigo-300" disabled={isLoading || error !== null || !themes.some(t => t.isSelected)}>Apply Selected Themes</button>
        </div>
      </div>
    </div>
  );
};

export default ThemeDetectionModal;