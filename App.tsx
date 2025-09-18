import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { LevelSelect } from './components/LevelSelect';
import { GameView } from './components/GameView';
import { LevelData, Theme } from './types';
import { LEVEL_PLATFORMS as INITIAL_PLATFORMS, LEVEL_CHECKPOINTS as INITIAL_CHECKPOINTS, LEVEL_TRAPS as INITIAL_TRAPS, DAY_SCENERY, AFTERNOON_SCENERY, NIGHT_SCENERY, TWILIGHT_SCENERY } from './game/level';
import { GAME_WIDTH } from './constants';

const THEME_CONFIG = {
  day: { bg: 'bg-sky-400', scenery: DAY_SCENERY },
  afternoon: { bg: 'bg-orange-400', scenery: AFTERNOON_SCENERY },
  night: { bg: 'bg-gray-800', scenery: NIGHT_SCENERY },
  twilight: { bg: 'bg-indigo-800', scenery: TWILIGHT_SCENERY }
};

const ORIGINAL_LEVEL: LevelData = {
  name: "Kirby's Ascent",
  platforms: INITIAL_PLATFORMS,
  checkpoints: INITIAL_CHECKPOINTS,
  traps: INITIAL_TRAPS,
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<'menu' | 'select' | 'game'>('menu');
  const [activeLevel, setActiveLevel] = useState<LevelData | null>(null);
  const [initialMode, setInitialMode] = useState<'play' | 'edit'>('play');
  const [theme, setTheme] = useState<Theme>('day');
  const [sourceScreen, setSourceScreen] = useState<'menu' | 'select'>('menu');

  const handlePlayOriginal = () => {
    setSourceScreen('menu');
    setActiveLevel(ORIGINAL_LEVEL);
    setInitialMode('play');
    setAppState('game');
  };

  const handleGoToSelect = () => {
    setAppState('select');
  };

  const handleGoToEditor = (level: LevelData | null) => {
    if (level) {
      setSourceScreen('select'); // Came from level select
      setActiveLevel(level);
    } else {
      setSourceScreen('menu'); // Came from main menu (new level)
      // Create a new blank level with just the floor
      const newId = Date.now();
      setActiveLevel({
        name: `New Level ${newId}`,
        platforms: [{ id: 0, position: { x: 300 - GAME_WIDTH / 2, y: 3980 }, width: GAME_WIDTH, height: 20 }],
        checkpoints: [],
        traps: [],
      });
    }
    setInitialMode('edit');
    setAppState('game');
  };
  
  const handlePlayLevel = (level: LevelData) => {
    setSourceScreen('select');
    setActiveLevel(level);
    setInitialMode('play');
    setAppState('game');
  };

  const handleExitGame = () => {
    setActiveLevel(null);
    setAppState(sourceScreen);
  };

  const renderContent = () => {
    switch (appState) {
      case 'menu':
        return (
          <MainMenu
            onPlayOriginal={handlePlayOriginal}
            onGoToSelect={handleGoToSelect}
            onGoToEditor={() => handleGoToEditor(null)}
          />
        );
      case 'select':
        return (
          <LevelSelect 
            onPlayLevel={handlePlayLevel}
            onEditLevel={(level) => handleGoToEditor(level)}
            onBack={() => setAppState('menu')}
          />
        );
      case 'game':
        if (!activeLevel) return null; // Should not happen
        return (
          <GameView 
            key={`${activeLevel.name}-${initialMode}`}
            levelData={activeLevel}
            initialMode={initialMode}
            onExit={handleExitGame}
            theme={theme}
            onSetTheme={setTheme}
          />
        );
      default:
        return <MainMenu 
          onPlayOriginal={handlePlayOriginal}
          onGoToSelect={handleGoToSelect}
          onGoToEditor={() => handleGoToEditor(null)}
        />;
    }
  };

  return (
    <div className={`flex flex-col justify-center items-center w-screen min-h-screen font-sans transition-colors duration-500 ${THEME_CONFIG[theme].bg} ${appState === 'game' ? 'h-screen overflow-hidden' : ''}`}>
      {renderContent()}
    </div>
  );
};

export default App;