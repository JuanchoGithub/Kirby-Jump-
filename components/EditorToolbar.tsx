import React from 'react';
import { Theme } from '../types';

interface EditorToolbarProps {
  mode: 'play' | 'edit';
  theme: Theme;
  onToggleMode: () => void;
  onSetTheme: (theme: Theme) => void;
  onAddPlatform: () => void;
  onAddCheckpoint: () => void;
  onAddTrap: () => void;
  onDeleteSelected: () => void;
  isObjectSelected: boolean;
  onSave: () => void;
  onExport: () => void;
  onExit: () => void;
  levelName: string;
  onLevelNameChange: (newName: string) => void;
  saveStatus: 'idle' | 'saving' | 'saved';
}

const IconButton: React.FC<{ onClick?: () => void, disabled?: boolean, children: React.ReactNode, active?: boolean, title: string }> = ({ onClick, disabled, children, active, title }) => (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-lg transition-colors text-white text-sm
        ${active ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {children}
    </button>
);

const getSaveButtonText = (status: 'idle' | 'saving' | 'saved') => {
    switch (status) {
        case 'saving': return 'Saving...';
        case 'saved': return 'Saved!';
        default: return 'Save';
    }
};


export const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  mode, theme, onToggleMode, onSetTheme, onAddPlatform, onAddCheckpoint, onAddTrap,
  onDeleteSelected, isObjectSelected, onSave, onExport, onExit, levelName, onLevelNameChange, saveStatus
}) => {
  const isEditing = mode === 'edit';

  return (
    <div className="w-full max-w-4xl p-2 mb-2 bg-gray-800 rounded-lg shadow-lg flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <IconButton onClick={onExit} title="Back to Menu">{'< Back'}</IconButton>
        {isEditing ? (
            <input 
                type="text"
                value={levelName}
                onChange={(e) => onLevelNameChange(e.target.value)}
                className="bg-gray-700 text-white text-lg font-bold rounded-md px-2 py-1 w-32 sm:w-48 transition-colors focus:bg-gray-600 focus:outline-none"
                placeholder="Level Name"
            />
        ) : (
            <h1 className="text-lg font-bold text-white hidden sm:block">{levelName}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <IconButton onClick={onToggleMode} title={isEditing ? "Test Level" : "Back to Editor"}>
          {isEditing ? 'Play' : 'Edit'}
        </IconButton>
        {isEditing && (
          <>
            <IconButton onClick={onAddPlatform} title="Add Platform">+</IconButton>
            <IconButton onClick={onAddCheckpoint} title="Add Checkpoint">*</IconButton>
            <IconButton onClick={onAddTrap} title="Add Trap">Trap</IconButton>
            <IconButton onClick={onDeleteSelected} disabled={!isObjectSelected} title="Delete Selected">DEL</IconButton>
            <IconButton onClick={onSave} disabled={saveStatus !== 'idle'} title="Save Level">{getSaveButtonText(saveStatus)}</IconButton>
            <IconButton onClick={onExport} title="Export Level to File">Export</IconButton>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300 mr-2 hidden md:inline">Theme:</span>
        <IconButton onClick={() => onSetTheme('day')} active={theme === 'day'} title="Day Theme">Day</IconButton>
        <IconButton onClick={() => onSetTheme('afternoon')} active={theme === 'afternoon'} title="Afternoon Theme">Aft</IconButton>
        <IconButton onClick={() => onSetTheme('night')} active={theme === 'night'} title="Night Theme">Night</IconButton>
        <IconButton onClick={() => onSetTheme('twilight')} active={theme === 'twilight'} title="Twilight Theme">Twi</IconButton>
      </div>
    </div>
  );
};