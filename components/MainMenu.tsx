import React from 'react';

interface MainMenuProps {
    onPlayOriginal: () => void;
    onGoToSelect: () => void;
    onGoToEditor: () => void;
}

const MenuButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="w-64 px-6 py-4 bg-yellow-400 text-black font-bold text-xl rounded-lg shadow-lg hover:bg-yellow-500 transition-all transform hover:scale-105"
    >
        {children}
    </button>
);

export const MainMenu: React.FC<MainMenuProps> = ({ onPlayOriginal, onGoToSelect, onGoToEditor }) => {
    return (
        <div className="flex flex-col justify-center items-center bg-gray-800 bg-opacity-50 p-12 rounded-2xl shadow-2xl">
            <h1 className="text-6xl font-bold text-white mb-4" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.7)' }}>
                Kirby's Ascent
            </h1>
            <p className="text-2xl text-white mb-12">Create and Play</p>
            <div className="flex flex-col gap-6">
                <MenuButton onClick={onPlayOriginal}>Play Original Level</MenuButton>
                <MenuButton onClick={onGoToSelect}>My Levels</MenuButton>
                <MenuButton onClick={onGoToEditor}>Level Editor</MenuButton>
            </div>
        </div>
    );
};
