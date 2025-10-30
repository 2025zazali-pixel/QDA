import React, { useState, useCallback } from 'react';
import { Document } from '../../types.ts';
import { XIcon, UploadCloudIcon, FileTextIcon } from '../icons.tsx';

interface AddDocumentModalProps {
  onClose: () => void;
  onAddDocument: (document: Omit<Document, 'id'>) => void;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ onClose, onAddDocument }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const resetState = () => {
    setTitle('');
    setContent('');
    setFile(null);
  };
  
  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setTitle(selectedFile.name.split('.').slice(0, -1).join('.')); // Set title from filename
    
    const reader = new FileReader();
    const fileType = selectedFile.type;
    
    if (fileType.startsWith('text/')) {
        reader.onload = (e) => setContent(e.target?.result as string);
        reader.readAsText(selectedFile);
    } else if (fileType.startsWith('image/') || fileType.startsWith('audio/') || fileType.startsWith('video/')) {
        reader.onload = (e) => setContent(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
    } else {
        alert("Unsupported file type.");
        resetState();
    }
  }, []);
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    let docType: Document['type'] = 'text';
    let metadata: Document['metadata'] = {};

    if (file) {
        if (file.type.startsWith('image/')) {
            docType = 'image';
        } else if (file.type.startsWith('audio/')) {
            docType = 'audio';
            const audio = new Audio(content);
            audio.onloadedmetadata = () => {
                 onAddDocument({ type: docType, title, content, metadata: { duration: audio.duration } });
                 onClose();
            };
            // Return early as the callback will handle submission
            return;
        } else if (file.type.startsWith('video/')) {
            docType = 'video';
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
                 onAddDocument({ type: docType, title, content, metadata: { duration: video.duration } });
                 onClose();
            };
            video.src = content;
            return;
        }
    }
    
    onAddDocument({ type: docType, title, content, metadata });
    onClose();
  };

  const canSubmit = title.trim() && content.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 animate-fade-in-fast">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Add New Document</h2>
            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                <XIcon className="h-6 w-6 text-slate-500" />
            </button>
          </div>
          <div className="p-6">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button type="button" onClick={() => { setActiveTab('upload'); resetState(); }} className={`${activeTab === 'upload' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Upload File</button>
                    <button type="button" onClick={() => { setActiveTab('paste'); resetState(); }} className={`${activeTab === 'paste' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Paste Text</button>
                </nav>
            </div>
            
            <div className="pt-6 space-y-4">
               {activeTab === 'upload' ? (
                <>
                    <div 
                        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-indigo-500' : 'border-slate-300'} border-dashed rounded-md`}>
                        <div className="space-y-1 text-center">
                            <UploadCloudIcon className="mx-auto h-12 w-12 text-slate-400" />
                            <div className="flex text-sm text-slate-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept=".txt,.md,.csv,.png,.jpg,.jpeg,.mp3,.wav,.m4a,.mp4,.webm,.mov" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-slate-500">TXT, MD, CSV, PNG, JPG, MP3, WAV, MP4, WEBM</p>
                        </div>
                    </div>
                     {file && (
                        <div className="text-sm p-2 bg-slate-100 rounded-md flex items-center justify-between">
                            <div className="flex items-center space-x-2 truncate">
                                <FileTextIcon className="h-5 w-5 text-slate-500 flex-shrink-0" />
                                <span className="text-slate-700 font-medium truncate">{file.name}</span>
                            </div>
                            <button type="button" onClick={resetState} className="p-1 rounded-full hover:bg-slate-200">
                                <XIcon className="h-4 w-4 text-slate-500"/>
                            </button>
                        </div>
                    )}
                </>
               ) : (
                <textarea id="doc-content" value={content} onChange={e => setContent(e.target.value)}
                    className="w-full h-40 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    placeholder="Paste your document content here..." required />
               )}
                <div>
                  <label htmlFor="doc-title" className="block text-sm font-medium text-slate-700 mb-1">
                    Title
                  </label>
                  <input type="text" id="doc-title" value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={activeTab === 'upload' ? "Filename will be used as title" : "e.g., Interview Transcript #1"} required />
                </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-indigo-300" disabled={!canSubmit}>Add Document</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDocumentModal;