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
  signs: [],
};

const IMPOSSIBLE_LEVEL: LevelData = {
  "name": "Rocco's Impossible Level",
  "platforms": [
    { "id": 0, "position": { "x": 0, "y": 3980 }, "width": 600, "height": 20 },
    { "id": 4, "position": { "x": 180, "y": 3960 }, "width": 150, "height": 20 },
    { "id": 7, "position": { "x": 500, "y": 3960 }, "width": 20, "height": 20 },
    { "id": 8, "position": { "x": 580, "y": 3880 }, "width": 20, "height": 20 },
    { "id": 12, "position": { "x": 580, "y": 3760 }, "width": 20, "height": 20 },
    { "id": 14, "position": { "x": -160, "y": 3520 }, "width": 160, "height": 20 },
    { "id": 16, "position": { "x": 380, "y": 3710 }, "width": 20, "height": 20 },
    { "id": 19, "position": { "x": 210, "y": 3680 }, "width": 20, "height": 20 },
    { "id": 20, "position": { "x": -20, "y": 3610 }, "width": 20, "height": 20 },
    { "id": 21, "position": { "x": 10, "y": 3710 }, "width": 20, "height": 20 },
    { "id": 22, "position": { "x": -20, "y": 3460 }, "width": 20, "height": 20 },
    { "id": 26, "position": { "x": 10, "y": 3460 }, "width": 20, "height": 20 },
    { "id": 27, "position": { "x": 310, "y": 3500 }, "width": 20, "height": 20 },
    { "id": 28, "position": { "x": 330, "y": 3500 }, "width": 20, "height": 20 },
    { "id": 29, "position": { "x": 350, "y": 3500 }, "width": 20, "height": 20 },
    { "id": 31, "position": { "x": 580, "y": 3400 }, "width": 20, "height": 20 },
    { "id": 32, "position": { "x": 590, "y": 3510 }, "width": 60, "height": 20 },
    { "id": 33, "position": { "x": 500, "y": 3310 }, "width": 20, "height": 20 },
    { "id": 36, "position": { "x": 560, "y": 3100 }, "width": 20, "height": 20 },
    { "id": 37, "position": { "x": 570, "y": 2980 }, "width": 20, "height": 20 },
    { "id": 40, "position": { "x": 440, "y": 3200 }, "width": 20, "height": 20 },
    { "id": 41, "position": { "x": 380, "y": 2900 }, "width": 20, "height": 20 },
    { "id": 43, "position": { "x": 190, "y": 2940 }, "width": 20, "height": 20 },
    { "id": 44, "position": { "x": -370, "y": 2880 }, "width": 440, "height": 20 },
    { "id": 45, "position": { "x": -80, "y": 2750 }, "width": 150, "height": 20 },
    { "id": 46, "position": { "x": 230, "y": 2680 }, "width": 150, "height": 20 },
    { "id": 47, "position": { "x": 480, "y": 2600 }, "width": 150, "height": 20 },
    { "id": 49, "position": { "x": 310, "y": 2550 }, "width": 20, "height": 20 },
    { "id": 50, "position": { "x": 310, "y": 2440 }, "width": 20, "height": 20 },
    { "id": 51, "position": { "x": 310, "y": 2330 }, "width": 20, "height": 20 },
    { "id": 52, "position": { "x": 310, "y": 2220 }, "width": 20, "height": 20 },
    { "id": 53, "position": { "x": 480, "y": 2180 }, "width": 150, "height": 20 },
    { "id": 55, "position": { "x": 290, "y": 2070 }, "width": 150, "height": 20 },
    { "id": 56, "position": { "x": 160, "y": 1980 }, "width": 20, "height": 20 },
    { "id": 57, "position": { "x": -30, "y": 1850 }, "width": 150, "height": 20 },
    { "id": 58, "position": { "x": 230, "y": 1780 }, "width": 20, "height": 20 },
    { "id": 59, "position": { "x": 360, "y": 1760 }, "width": 150, "height": 20 },
    { "id": 61, "position": { "x": 570, "y": 1700 }, "width": 50, "height": 20 },
    { "id": 62, "position": { "x": 350, "y": 1590 }, "width": 150, "height": 20 },
    { "id": 63, "position": { "x": 220, "y": 1550 }, "width": 20, "height": 20 },
    { "id": 64, "position": { "x": -80, "y": 1490 }, "width": 150, "height": 20 },
    { "id": 65, "position": { "x": 150, "y": 1400 }, "width": 20, "height": 20 },
    { "id": 66, "position": { "x": 280, "y": 1360 }, "width": 150, "height": 20, "movement": { "path": [{ "x": 280, "y": 1360 }, { "x": -70, "y": 1090 }], "speed": 5000 } },
    { "id": 68, "position": { "x": 170, "y": 1120 }, "width": 150, "height": 20 },
    { "id": 69, "position": { "x": 480, "y": 1070 }, "width": 100, "height": 20 },
    { "id": 70, "position": { "x": 540, "y": 980 }, "width": 50, "height": 20 },
    { "id": 71, "position": { "x": 280, "y": 930 }, "width": 150, "height": 20 },
    { "id": 73, "position": { "x": 120, "y": 920 }, "width": 20, "height": 20 },
    { "id": 74, "position": { "x": -70, "y": 850 }, "width": 150, "height": 20, "movement": { "path": [{ "x": -70, "y": 850 }, { "x": 515, "y": 420 }], "speed": 10000 } }
  ],
  "checkpoints": [
    { "id": 75, "position": { "x": 540, "y": 620 }, "width": 40, "height": 40 },
    { "id": 2, "position": { "x": 10, "y": 3930 }, "width": 40, "height": 40 }
  ],
  "traps": [
    { "id": 9, "type": "spikes", "position": { "x": 270, "y": 3940 }, "width": 10, "height": 20, "platformId": 4 },
    { "id": 10, "type": "spikes", "position": { "x": 260, "y": 3940 }, "width": 10, "height": 20, "platformId": 4 },
    { "id": 11, "type": "spikes", "position": { "x": 250, "y": 3940 }, "width": 10, "height": 20, "platformId": 4 },
    { "id": 38, "type": "spikes", "position": { "x": 60, "y": 3960 }, "width": 520, "height": 20, "platformId": 0 }
  ],
  "signs": []
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

  const handlePlayImpossible = () => {
    setSourceScreen('menu');
    setActiveLevel(IMPOSSIBLE_LEVEL);
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
        signs: [],
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
            onPlayImpossible={handlePlayImpossible}
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
          onPlayImpossible={handlePlayImpossible}
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
