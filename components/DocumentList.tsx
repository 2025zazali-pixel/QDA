
import React from 'react';
import { Document } from '../types';
import { PlusIcon, DocumentTextIcon, PhotographIcon, VolumeUpIcon, VideoCameraIcon, LoaderIcon } from './icons';

interface DocumentListProps {
  documents: Document[];
  selectedDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onAddDocumentClick: () => void;
  onDeleteDocument: (id: string) => void;
}

const getIconForType = (type: Document['type']) => {
    switch(type) {
        case 'text': return <DocumentTextIcon className="h-5 w-5 text-slate-500" />;
        case 'image': return <PhotographIcon className="h-5 w-5 text-slate-500" />;
        case 'audio': return <VolumeUpIcon className="h-5 w-5 text-slate-500" />;
        case 'video': return <VideoCameraIcon className="h-5 w-5 text-slate-500" />;
    }
}


const DocumentList: React.FC<DocumentListProps> = ({ documents, selectedDocumentId, onSelectDocument, onAddDocumentClick, onDeleteDocument }) => {
  return (
    <aside className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">Documents</h2>
        <button 
            onClick={onAddDocumentClick}
            className="p-2 rounded-md hover:bg-slate-200 text-slate-600 hover:text-indigo-600 transition-colors"
            title="Add new document"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-2">
        {documents.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8 px-4">
              <p>No documents yet.</p>
              <p>Click the '+' button to add your first document.</p>
            </div>
        ) : (
            <ul>
            {documents.map(doc => (
                <li key={doc.id}>
                <button
                    onClick={() => onSelectDocument(doc.id)}
                    className={`w-full text-left p-3 rounded-md flex items-center space-x-3 ${selectedDocumentId === doc.id ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'hover:bg-slate-200'}`}
                >
                    {getIconForType(doc.type)}
                    <span className="truncate flex-1">{doc.title}</span>
                    {doc.isTranscribing && <LoaderIcon className="h-4 w-4 text-indigo-500 animate-spin" />}
                </button>
                </li>
            ))}
            </ul>
        )}
      </div>
    </aside>
  );
};

export default DocumentList;
