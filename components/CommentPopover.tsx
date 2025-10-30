import React, { useState } from 'react';
import { Quote, Code, Comment } from '../types.ts';
import { XIcon, SendIcon } from './icons.tsx';

interface CommentPopoverProps {
  quote: Quote;
  code: Code;
  comments: Comment[];
  position: { top: number; left: number };
  onClose: () => void;
  onAddComment: (quoteId: string, text: string) => void;
}

const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
}


const CommentPopover: React.FC<CommentPopoverProps> = ({ quote, code, comments, position, onClose, onAddComment }) => {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(quote.id, newComment.trim());
            setNewComment('');
        }
    };
  
    return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
        <div
            className="absolute bg-white rounded-lg shadow-2xl w-80 flex flex-col max-h-[400px] animate-fade-in-fast border border-slate-200"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="p-3 border-b border-slate-200 flex-shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-2">
                           <span className="w-3 h-3 rounded-full" style={{ backgroundColor: code.color }}></span>
                           <span className="text-sm font-semibold text-slate-800">{code.name}</span>
                        </div>
                         <blockquote className="mt-1 text-xs text-slate-500 border-l-2 border-slate-300 pl-2">
                            "{quote.text}"
                        </blockquote>
                    </div>
                     <button onClick={onClose} className="p-1 -mr-1 -mt-1 rounded-full hover:bg-slate-100">
                        <XIcon className="h-5 w-5 text-slate-400" />
                    </button>
                </div>
            </div>
            
            {/* Comments List */}
            <div className="flex-grow p-3 overflow-y-auto space-y-3">
                {comments.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No comments yet.</p>
                ) : (
                    comments
                        .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map(comment => (
                        <div key={comment.id} className="text-sm">
                            <p className="text-slate-700 bg-slate-100 rounded-lg px-3 py-2">{comment.text}</p>
                            <span className="text-xs text-slate-400 mt-1 px-3">{timeAgo(comment.createdAt)}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-slate-200 flex-shrink-0">
                 <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                    <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300" disabled={!newComment.trim()}>
                       <SendIcon className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default CommentPopover;