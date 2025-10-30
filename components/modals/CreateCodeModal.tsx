import React, { useState, useEffect } from 'react';
import { Code } from '../../types.ts';
import { XIcon } from '../icons.tsx';

interface CreateCodeModalProps {
  onClose: () => void;
  onAddCode: (code: Omit<Code, 'id' | 'color'>) => void;
  onUpdateCode: (codeId: string, updates: { name: string; description: string }) => void;
  codeToEdit?: Code | null;
}

const CreateCodeModal: React.FC<CreateCodeModalProps> = ({ onClose, onAddCode, onUpdateCode, codeToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isEditing = !!codeToEdit;

  useEffect(() => {
    if (isEditing) {
      setName(codeToEdit.name);
      setDescription(codeToEdit.description);
    }
  }, [codeToEdit, isEditing]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && codeToEdit) {
      onUpdateCode(codeToEdit.id, { name, description });
    } else {
      onAddCode({ name, description });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 animate-fade-in-fast">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">{isEditing ? 'Edit Code' : 'Create New Code'}</h2>
            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                <XIcon className="h-6 w-6 text-slate-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="code-name" className="block text-sm font-medium text-slate-700 mb-1">
                Code Name
              </label>
              <input
                type="text"
                id="code-name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., User Satisfaction"
                required
              />
            </div>
             <div>
              <label htmlFor="code-desc" className="block text-sm font-medium text-slate-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                id="code-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="A brief description of the code"
              />
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
              disabled={!name.trim()}
            >
              {isEditing ? 'Save Changes' : 'Create Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCodeModal;