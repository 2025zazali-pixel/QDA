import React, { useState } from 'react';
import { Quote, Code } from '../../types.ts';
import { XIcon } from '../icons.tsx';

interface ReassignQuotesModalProps {
  sourceCode: Code;
  allCodes: Code[];
  allQuotes: Quote[];
  onClose: () => void;
  onReassign: (quoteIds: string[], newCodeId: string) => void;
}

const ReassignQuotesModal: React.FC<ReassignQuotesModalProps> = ({ sourceCode, allCodes, allQuotes, onClose, onReassign }) => {
  const quotesForThisCode = allQuotes.filter(q => q.codeId === sourceCode.id);
  const destinationCodes = allCodes.filter(c => c.id !== sourceCode.id);

  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [destinationCodeId, setDestinationCodeId] = useState<string>(destinationCodes[0]?.id || '');

  const handleQuoteSelection = (quoteId: string) => {
    setSelectedQuoteIds(prev =>
      prev.includes(quoteId) ? prev.filter(id => id !== quoteId) : [...prev, quoteId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedQuoteIds(quotesForThisCode.map(q => q.id));
      } else {
          setSelectedQuoteIds([]);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuoteIds.length > 0 && destinationCodeId) {
      onReassign(selectedQuoteIds, destinationCodeId);
      onClose();
    }
  };
  
  const canSubmit = selectedQuoteIds.length > 0 && destinationCodeId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 animate-fade-in-fast flex flex-col">
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Reassign Quotes from "{sourceCode.name}"</h2>
                <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                    <XIcon className="h-6 w-6 text-slate-500" />
                </button>
            </div>
            <div className="p-6 space-y-4">
                {quotesForThisCode.length === 0 ? (
                    <p className="text-slate-600 text-center py-8">This code has no quotes to reassign.</p>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                1. Select quotes to move
                            </label>
                            <div className="border border-slate-200 rounded-md max-h-60 overflow-y-auto">
                                <div className="p-2 border-b border-slate-200 bg-slate-50">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 mr-3"
                                        checked={selectedQuoteIds.length > 0 && selectedQuoteIds.length === quotesForThisCode.length}
                                        onChange={handleSelectAll}
                                    />
                                    <label className="text-sm font-medium text-slate-700">Select All</label>
                                </div>
                                <ul className="divide-y divide-slate-200">
                                    {quotesForThisCode.map(quote => (
                                        <li key={quote.id} className="p-3 flex items-start">
                                            <input
                                                type="checkbox"
                                                id={`quote-${quote.id}`}
                                                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5 mr-3 flex-shrink-0"
                                                checked={selectedQuoteIds.includes(quote.id)}
                                                onChange={() => handleQuoteSelection(quote.id)}
                                            />
                                            <label htmlFor={`quote-${quote.id}`} className="text-sm text-slate-600">"{quote.text}"</label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="destination-code" className="block text-sm font-medium text-slate-700 mb-2">
                                2. Choose destination code
                            </label>
                            <select
                                id="destination-code"
                                value={destinationCodeId}
                                onChange={(e) => setDestinationCodeId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={destinationCodes.length === 0}
                            >
                                {destinationCodes.length > 0 ? (
                                    destinationCodes.map(code => (
                                        <option key={code.id} value={code.id}>{code.name}</option>
                                    ))
                                ) : (
                                    <option>No other codes available</option>
                                )}
                            </select>
                        </div>
                    </>
                )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-indigo-300" disabled={!canSubmit}>
                    Reassign {selectedQuoteIds.length > 0 ? selectedQuoteIds.length : ''} Quote{selectedQuoteIds.length !== 1 && 's'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ReassignQuotesModal;