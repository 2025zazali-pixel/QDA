
import React from 'react';
// Fix: Corrected import path for icons
import { FeatherIcon, SparklesIcon } from './icons.tsx';

const Header: React.FC = () => {
  return (
    <header className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <FeatherIcon className="h-7 w-7 text-indigo-600" />
            <span className="ml-3 text-2xl font-bold text-slate-800">QualiSage AI</span>
          </div>
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-5 w-5 text-indigo-500"/>
            <span className="text-sm font-medium text-slate-600">Powered by Gemini</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;