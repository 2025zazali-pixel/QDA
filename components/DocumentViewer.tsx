
import React from 'react';
import { Document, Quote, Code, Segment, Comment } from '../types';
import TextHighlightViewer from './TextHighlightViewer';
import CommentPopover from './CommentPopover';
import { LoaderIcon } from './icons';

interface DocumentViewerProps {
  selectedDocument: Document | null;
  quotes: Quote[];
  codes: Code[];
  comments: Comment[];
  onSelectSegment: (segment: Segment | null) => void;
  onQuoteClick: (quote: Quote, code: Code, element: HTMLElement) => void;
  onAddComment: (quoteId: string, text: string) => void;
  activeCommentPopover: { quote: Quote; code: Code; position: { top: number, left: number } } | null;
  onCloseCommentPopover: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
    selectedDocument, 
    quotes, 
    codes,
    comments,
    onSelectSegment,
    onQuoteClick,
    onAddComment,
    activeCommentPopover,
    onCloseCommentPopover
 }) => {
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== '' && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = selection.toString();
      
      const container = range.startContainer.parentElement?.closest('.document-content-area');
      if (container && container.textContent) {
          const fullText = container.textContent;
          // Find the start index relative to the container's full text content.
          // This is a simplified approach; a more robust solution might use character offsets within the DOM.
          let start = (range.startContainer.parentElement === container) 
            ? range.startOffset 
            : fullText.indexOf(text);
          
          if (start !== -1) {
            const end = start + text.length;
            onSelectSegment({ text, start, end });
          } else {
             // Fallback for more complex DOM structures within the content area
            const roughStart = fullText.indexOf(text);
            if (roughStart !== -1) {
              onSelectSegment({ text, start: roughStart, end: roughStart + text.length });
            }
          }
      }

    } else {
      onSelectSegment(null);
    }
  };

  const handleQuoteClick = (quoteId: string, codeId: string, element: HTMLElement) => {
    const quote = quotes.find(q => q.id === quoteId);
    const code = codes.find(c => c.id === codeId);
    if(quote && code) {
        onQuoteClick(quote, code, element);
    }
  }

  const renderDocumentContent = () => {
    if (!selectedDocument) return null;

    const docQuotes = quotes.filter(q => q.documentId === selectedDocument.id);

    if ((selectedDocument.type === 'audio' || selectedDocument.type === 'video') && selectedDocument.isTranscribing) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <LoaderIcon className="h-10 w-10 animate-spin mb-4" />
                <p className="font-semibold text-lg">Transcription in progress...</p>
                <p className="text-sm">This may take a few moments. You can continue working on other documents.</p>
            </div>
        );
    }

    switch (selectedDocument.type) {
      case 'text':
        return (
          <div className="document-content-area" onMouseUp={handleMouseUp}>
            <TextHighlightViewer 
                text={selectedDocument.content} 
                quotes={docQuotes} 
                codes={codes}
                onQuoteClick={handleQuoteClick}
            />
          </div>
        );
      case 'image':
        return <img src={selectedDocument.content} alt={selectedDocument.title} className="max-w-full rounded-lg" />;
      case 'audio':
      case 'video':
        const MediaComponent = selectedDocument.type === 'audio' ? 'audio' : 'video';
        const mediaClassName = selectedDocument.type === 'audio' ? 'w-full' : 'max-w-full rounded-lg';
        return (
            <div>
                <MediaComponent controls src={selectedDocument.content} className={mediaClassName} />
                {selectedDocument.transcript && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <h3 className="text-lg font-semibold mb-2 text-slate-700">Transcript</h3>
                        <div className="document-content-area" onMouseUp={handleMouseUp}>
                            <TextHighlightViewer
                                text={selectedDocument.transcript}
                                quotes={docQuotes.filter(q => q.start !== undefined)} // Only text-based quotes for transcript
                                codes={codes}
                                onQuoteClick={handleQuoteClick}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
      default:
        return <p>Unsupported document type.</p>;
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex-shrink-0">
          <h1 className="text-xl font-bold text-slate-800">
            {selectedDocument ? selectedDocument.title : 'No Document Selected'}
          </h1>
        </div>
      <div className="flex-1 overflow-y-auto p-8">
        {selectedDocument ? (
          renderDocumentContent()
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">Select a document from the left panel to view it.</p>
          </div>
        )}
      </div>
      {activeCommentPopover && (
        <CommentPopover 
            quote={activeCommentPopover.quote}
            code={activeCommentPopover.code}
            comments={comments.filter(c => c.quoteId === activeCommentPopover.quote.id)}
            position={activeCommentPopover.position}
            onClose={onCloseCommentPopover}
            onAddComment={onAddComment}
        />
      )}
    </main>
  );
};

export default DocumentViewer;
