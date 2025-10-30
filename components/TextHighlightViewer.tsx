
import React from 'react';
import { Quote, Code } from '../types';

interface TextHighlightViewerProps {
  text: string;
  quotes: Quote[];
  codes: Code[];
  onQuoteClick: (quoteId: string, codeId: string, element: HTMLElement) => void;
}

const getTextColorForBg = (hexcolor: string) => {
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
};


const TextHighlightViewer: React.FC<TextHighlightViewerProps> = ({ text, quotes, codes, onQuoteClick }) => {
  if (quotes.length === 0) {
    return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
  }

  const sortedQuotes = [...quotes].filter(q => q.start !== undefined && q.end !== undefined).sort((a, b) => (a.start!) - (b.start!));

  const chunks: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedQuotes.forEach(quote => {
    if (quote.start! > lastIndex) {
      chunks.push(text.substring(lastIndex, quote.start!));
    }
    
    const code = codes.find(c => c.id === quote.codeId);
    if (code) {
        chunks.push(
            <mark
                key={quote.id}
                onClick={(e) => onQuoteClick(quote.id, code.id, e.currentTarget)}
                style={{ backgroundColor: code.color, color: getTextColorForBg(code.color) }}
                className="px-1 py-0.5 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
            >
            {text.substring(quote.start!, quote.end!)}
            </mark>
        );
    }
    
    lastIndex = Math.max(lastIndex, quote.end!);
  });

  if (lastIndex < text.length) {
    chunks.push(text.substring(lastIndex));
  }

  return (
      <p className="whitespace-pre-wrap leading-relaxed">
          {chunks.map((chunk, index) => (
              <React.Fragment key={index}>{chunk}</React.Fragment>
          ))}
      </p>
  );
};

export default TextHighlightViewer;
