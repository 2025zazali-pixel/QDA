import React, { useState, useEffect, useRef } from 'react';
import { Code, Segment, Document, Quote } from '../types.ts';
import { suggestCodes } from '../services/geminiService.ts';
import { PlusIcon, SparklesIcon, MoreVerticalIcon } from './icons.tsx';
import CreateCodeModal from './modals/CreateCodeModal';
import ReassignQuotesModal from './modals/ReassignQuotesModal';

interface CodingPanelProps {
  codes: Code[];
  quotes: Quote[];
  selectedSegment: Segment | null;
  selectedDocument: Document | null;
  onAddCode: (code: Omit<Code, 'id' | 'color'>) => void;
  onDeleteCode: (codeId: string) => void;
  onApplyCode: (codeId: string) => void;
  onUpdateCode: (codeId: string, updates: { name: string; description: string }) => void;
  onReassignQuotes: (quoteIds: string[], newCodeId: string) => void;
}

const CodingPanel: React.FC<CodingPanelProps> = ({
  codes,
  quotes,
  selectedSegment,
  selectedDocument,
  onAddCode,
  onDeleteCode,
  onApplyCode,
  onUpdateCode,
  onReassignQuotes,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<Code | null>(null);
  const [reassigningCode, setReassigningCode] = useState<Code | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<Code[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAiSupported = selectedDocument?.type === 'text';

  useEffect(() => {
    if (selectedSegment && selectedDocument && isAiSupported) { 
      const fetchSuggestions = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions([]);
        try {
          const result = await suggestCodes(selectedSegment, selectedDocument, codes);
          setSuggestions(result);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred.");
            }
        } finally {
          setIsLoading(false);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
      setError(null);
    }
  }, [selectedSegment, selectedDocument, codes, isAiSupported]);
  
  // Close the options menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setOpenMenuId(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddCodeSubmit = (code: Omit<Code, 'id'|'color'>) => {
    onAddCode(code);
    setIsCreateModalOpen(false);
  };

  const handleUpdateCodeSubmit = (codeId: string, updates: { name: string; description: string }) => {
    onUpdateCode(codeId, updates);
    setEditingCode(null);
  };
  
  const handleApplySuggestion = (suggestion: Code) => {
    // Find if a code with the same name already exists
    const existingCode = codes.find(c => c.name.toLowerCase() === suggestion.name.toLowerCase());
  
    if (suggestion.id.startsWith('new-') && !existingCode) {
        onAddCode({ name: suggestion.name, description: suggestion.description });
    } else {
        const codeToApply = existingCode || codes.find(c => c.id === suggestion.id);
        if (codeToApply) {
          onApplyCode(codeToApply.id);
        }
    }
  }

  const handleMenuClick = (e: React.MouseEvent, codeId: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === codeId ? null : codeId);
  };

  return (
    <>
      <div className="bg-slate-50 border-l border-slate-200 flex flex-col w-96 h-full">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">Codes</h2>
          <button
            onClick={() => { setEditingCode(null); setIsCreateModalOpen(true); }}
            className="p-2 rounded-md hover:bg-slate-200 text-slate-600 hover:text-indigo-600 transition-colors"
            title="Create new code"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        {/* AI Suggestions */}
        {selectedSegment && (
          <div className="p-4 border-b border-slate-200 flex-shrink-0">
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
              <SparklesIcon className="h-4 w-4 mr-2 text-indigo-500" />
              AI Suggestions for Selection
            </h3>
            {!isAiSupported ? <p className="text-sm text-slate-500">AI analysis is not available for this document type.</p> :
            isLoading ? <p className="text-sm text-slate-500">Loading suggestions...</p> :
            error ? <p className="text-sm text-red-500">{error}</p> :
            suggestions.length === 0 ? <p className="text-sm text-slate-500">No suggestions found.</p> :
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleApplySuggestion(s)}
                  className="px-2 py-1 text-xs font-medium rounded-full transition-colors"
                  style={{ 
                    backgroundColor: s.id.startsWith('new-') ? '#E2E8F0' : s.color,
                    color: s.id.startsWith('new-') ? '#475569' : 'white',
                   }}
                >
                  {s.name} {s.id.startsWith('new-') ? '(New)' : ''}
                </button>
              ))}
            </div>
            }
          </div>
        )}
        
        {/* Code List */}
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {codes.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">
              <p>No codes created yet.</p>
              <p>Click the '+' button to create one.</p>
            </div>
          ) : (
            codes.map(code => (
              <div key={code.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-slate-100">
                  <div className="flex items-center space-x-3 flex-grow truncate">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: code.color }}></span>
                    <span className="text-sm font-medium text-slate-700 truncate">{code.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                    <button 
                        onClick={() => onApplyCode(code.id)}
                        disabled={!selectedSegment}
                        className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                        Apply
                    </button>
                    <div className="relative" ref={openMenuId === code.id ? menuRef : null}>
                        <button 
                            onClick={(e) => handleMenuClick(e, code.id)}
                            className="p-1 text-slate-400 rounded-md hover:bg-slate-200 hover:text-slate-600"
                        >
                            <MoreVerticalIcon className="h-4 w-4" />
                        </button>
                        {openMenuId === code.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-20 animate-fade-in-fast">
                                <ul className="py-1 text-sm text-slate-700">
                                    <li><button onClick={() => { setEditingCode(code); setIsCreateModalOpen(true); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-100">Edit Code</button></li>
                                    <li><button onClick={() => { setReassigningCode(code); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-100">Reassign Quotes</button></li>
                                    <li><button onClick={() => { onDeleteCode(code.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">Delete Code</button></li>
                                </ul>
                            </div>
                        )}
                    </div>
                  </div>
              </div>
            ))
          )}
        </div>
      </div>
      {(isCreateModalOpen || editingCode) && (
        <CreateCodeModal
          codeToEdit={editingCode}
          onClose={() => { setIsCreateModalOpen(false); setEditingCode(null); }}
          onAddCode={handleAddCodeSubmit}
          onUpdateCode={handleUpdateCodeSubmit}
        />
      )}
      {reassigningCode && (
        <ReassignQuotesModal
          sourceCode={reassigningCode}
          allCodes={codes}
          allQuotes={quotes}
          onClose={() => setReassigningCode(null)}
          onReassign={(quoteIds, newCodeId) => {
            onReassignQuotes(quoteIds, newCodeId);
            setReassigningCode(null);
          }}
        />
      )}
    </>
  );
};

export default CodingPanel;