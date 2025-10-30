
import React, { useState, useEffect } from 'react';
import { Document, Code, Quote, Segment, Comment, ChatMessage, AiSuggestedTheme } from './types';
import { PREDEFINED_COLORS } from './constants';
import { getChatbotResponse, transcribeMedia } from './services/geminiService';
import Header from './components/Header';
import DocumentList from './components/DocumentList';
import DocumentViewer from './components/DocumentViewer';
import CodingPanel from './components/CodingPanel';
import AddDocumentModal from './components/modals/AddDocumentModal';
import ThemeDetectionModal from './components/modals/ThemeDetectionModal';
import Chatbot from './components/Chatbot';
import { ChatAltIcon } from './components/icons';

// --- Sample Data ---
const initialDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'Interview with User A',
    type: 'text',
    content: `Interviewer: Thanks for joining today. Can you tell me about your experience using our new feature?\nUser A: It's been mostly positive. I really like the streamlined design, it feels much more modern. However, I found the new export function a bit confusing at first. I wasn't sure what the difference between a "Quick Export" and a "Full Export" was. Maybe a tooltip could help?\nInterviewer: That's great feedback. What did you like most about the design?\nUser A: The color scheme is great, and the layout is much more intuitive. I can find things much quicker than before. The performance also seems to be a lot snappier.`,
    metadata: {},
  },
];

const App: React.FC = () => {
  // Main data state
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [codes, setCodes] = useState<Code[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  // UI State
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(initialDocuments[0]?.id || null);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  
  // Modal State
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  
  // Popover State
  const [activeCommentPopover, setActiveCommentPopover] = useState<{ quote: Quote; code: Code; position: { top: number, left: number } } | null>(null);

  // Chatbot State
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId) || null;

  useEffect(() => {
    // Reset selection when document changes
    setSelectedSegment(null);
    setActiveCommentPopover(null);
  }, [selectedDocumentId]);

  // --- Handlers ---
  const handleAddDocument = async (doc: Omit<Document, 'id'>) => {
    const newDocId = `doc-${Date.now()}`;
    const newDocument: Document = { ...doc, id: newDocId };

    if ((newDocument.type === 'audio' || newDocument.type === 'video') && newDocument.content) {
        // Add doc immediately with transcribing state
        const docWithTranscriptionFlag = { ...newDocument, isTranscribing: true };
        setDocuments(prev => [...prev, docWithTranscriptionFlag]);
        setSelectedDocumentId(newDocId);
        
        try {
            const transcript = await transcribeMedia(newDocument.content);
            setDocuments(prev => prev.map(d => 
                d.id === newDocId ? { ...d, transcript, isTranscribing: false } : d
            ));
        } catch (error) {
            console.error("Transcription failed:", error);
            alert(`Transcription failed for ${newDocument.title}. Please check the console for details.`);
            // Update doc to remove transcribing state
            setDocuments(prev => prev.map(d => 
                d.id === newDocId ? { ...d, isTranscribing: false } : d
            ));
        }
    } else {
        setDocuments(prev => [...prev, newDocument]);
        setSelectedDocumentId(newDocument.id); // Select the new document
    }
  };

  const handleDeleteDocument = (id: string) => {
    // Also delete associated quotes and comments
    setDocuments(prev => prev.filter(d => d.id !== id));
    setQuotes(prev => prev.filter(q => q.documentId !== id));
    if (selectedDocumentId === id) {
        setSelectedDocumentId(documents[0]?.id || null);
    }
  };

  const handleAddCode = (newCode: Omit<Code, 'id' | 'color'>) => {
    const nextColor = PREDEFINED_COLORS[codes.length % PREDEFINED_COLORS.length];
    const codeToAdd: Code = { ...newCode, id: `code-${Date.now()}`, color: nextColor };
    setCodes(prev => [...prev, codeToAdd]);
  };
  
  const handleUpdateCode = (codeId: string, updates: { name: string; description: string }) => {
    setCodes(prev => prev.map(c => c.id === codeId ? {...c, ...updates} : c));
  };

  const handleDeleteCode = (codeId: string) => {
    // Note: This leaves orphaned quotes. A real app might prompt the user to reassign them.
    setCodes(prev => prev.filter(c => c.id !== codeId));
    setQuotes(prev => prev.filter(q => q.codeId !== codeId));
  };
  
  const handleApplyCode = (codeId: string) => {
    if (!selectedSegment || !selectedDocument) return;

    const newQuote: Quote = {
        id: `quote-${Date.now()}`,
        documentId: selectedDocument.id,
        codeId,
        text: selectedSegment.text,
        start: selectedSegment.start,
        end: selectedSegment.end,
    };
    setQuotes(prev => [...prev, newQuote]);
    setSelectedSegment(null); // Clear selection after applying
  };
  
  const handleQuoteClick = (quote: Quote, code: Code, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setActiveCommentPopover({
      quote,
      code,
      position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX }
    });
  };

  const handleAddComment = (quoteId: string, text: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      quoteId,
      text,
      createdAt: new Date().toISOString()
    };
    setComments(prev => [...prev, newComment]);
  };

  const handleReassignQuotes = (quoteIds: string[], newCodeId: string) => {
      setQuotes(prev => prev.map(q => quoteIds.includes(q.id) ? {...q, codeId: newCodeId} : q));
  };

  const handleApplyThemes = (themes: AiSuggestedTheme[]) => {
    const newCodes: Code[] = [];
    const newQuotes: Quote[] = [];

    themes.forEach((theme, index) => {
        const nextColor = PREDEFINED_COLORS[(codes.length + index) % PREDEFINED_COLORS.length];
        const newCode: Code = {
            id: `code-theme-${Date.now()}-${index}`,
            name: theme.code.name,
            description: theme.code.description,
            color: nextColor
        };
        newCodes.push(newCode);

        theme.quotes.forEach((quoteText, qIndex) => {
            const docContent = (selectedDocument?.type === 'text' ? selectedDocument.content : selectedDocument?.transcript) || '';
            if (selectedDocument && docContent) {
                const start = docContent.indexOf(quoteText);
                if (start !== -1) {
                    const end = start + quoteText.length;
                    newQuotes.push({
                        id: `quote-theme-${Date.now()}-${index}-${qIndex}`,
                        documentId: selectedDocument.id,
                        codeId: newCode.id,
                        text: quoteText,
                        start,
                        end
                    });
                }
            }
        });
    });

    setCodes(prev => [...prev, ...newCodes]);
    setQuotes(prev => [...prev, ...newQuotes]);
    setIsThemeModalOpen(false);
  };
  
  const handleSendMessage = async (message: string) => {
      const newUserMessage: ChatMessage = { sender: 'user', text: message };
      const newHistory = [...chatMessages, newUserMessage];
      setChatMessages(newHistory);
      setIsChatLoading(true);
      try {
          const responseText = await getChatbotResponse(message, newHistory, documents, codes, quotes);
          setChatMessages(prev => [...prev, { sender: 'ai', text: responseText }]);
      } catch (error) {
          const text = error instanceof Error ? error.message : "An unknown error occurred.";
          setChatMessages(prev => [...prev, { sender: 'ai', text: `Error: ${text}` }]);
      } finally {
          setIsChatLoading(false);
      }
  };


  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-slate-100">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <DocumentList
          documents={documents}
          selectedDocumentId={selectedDocumentId}
          onSelectDocument={setSelectedDocumentId}
          onAddDocumentClick={() => setIsAddDocModalOpen(true)}
          onDeleteDocument={handleDeleteDocument}
        />
        <DocumentViewer
          selectedDocument={selectedDocument}
          quotes={quotes}
          codes={codes}
          comments={comments}
          onSelectSegment={setSelectedSegment}
          onQuoteClick={handleQuoteClick}
          activeCommentPopover={activeCommentPopover}
          onCloseCommentPopover={() => setActiveCommentPopover(null)}
          onAddComment={handleAddComment}
        />
        <CodingPanel
          codes={codes}
          quotes={quotes}
          selectedSegment={selectedSegment}
          selectedDocument={selectedDocument}
          onAddCode={handleAddCode}
          onDeleteCode={handleDeleteCode}
          onApplyCode={handleApplyCode}
          onUpdateCode={handleUpdateCode}
          onReassignQuotes={handleReassignQuotes}
        />
      </div>
      
      {/* Modals */}
      {isAddDocModalOpen && (
        <AddDocumentModal
          onClose={() => setIsAddDocModalOpen(false)}
          onAddDocument={handleAddDocument}
        />
      )}
      {isThemeModalOpen && selectedDocument && (
        <ThemeDetectionModal 
            doc={selectedDocument}
            existingCodes={codes}
            onClose={() => setIsThemeModalOpen(false)}
            onApplyThemes={handleApplyThemes}
        />
      )}

      {/* Chatbot */}
      <button 
        onClick={() => setIsChatbotOpen(prev => !prev)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110"
        title="Open AI Assistant"
      >
        <ChatAltIcon className="h-6 w-6"/>
      </button>

      <Chatbot 
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isLoading={isChatLoading}
      />
    </div>
  );
};

export default App;
