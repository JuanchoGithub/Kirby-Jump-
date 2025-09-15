import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Player } from './Player';
import { Platform } from './Platform';
import { Checkpoint } from './Checkpoint';
import { Scenery } from './Scenery';
import { EditorToolbar } from './EditorToolbar';
import { useGameLoop } from '../hooks/useGameLoop';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { PlayerState, Vector2D, PlatformData, CheckpointData, LevelData, Theme } from '../types';
import {
  GRAVITY, JUMP_STRENGTH, PLAYER_SPEED, PLAYER_WIDTH, PLAYER_HEIGHT,
  GAME_WIDTH, GAME_HEIGHT, CAMERA_SCROLL_THRESHOLD, LEVEL_HEIGHT_MAX, GRID_SIZE
} from '../constants';
import { DAY_SCENERY, AFTERNOON_SCENERY, NIGHT_SCENERY, TWILIGHT_SCENERY } from '../game/level';
import { saveLevel as saveLevelToStorage, getLevels } from '../utils/levelStore';


const THEME_CONFIG = {
  day: { bg: 'bg-sky-400', scenery: DAY_SCENERY },
  afternoon: { bg: 'bg-orange-400', scenery: AFTERNOON_SCENERY },
  night: { bg: 'bg-gray-800', scenery: NIGHT_SCENERY },
  twilight: { bg: '', scenery: TWILIGHT_SCENERY }
};

interface GameViewProps {
  levelData: LevelData;
  initialMode: 'play' | 'edit';
  onExit: () => void;
  theme: Theme;
  onSetTheme: (theme: Theme) => void;
}

export const GameView: React.FC<GameViewProps> = ({ levelData, initialMode, onExit, theme, onSetTheme }) => {
  const getInitialPlayerState = (checkpoints: CheckpointData[]): PlayerState => {
    const sortedCheckpoints = [...checkpoints].sort((a, b) => b.position.y - a.position.y);
    const startCheckpoint = sortedCheckpoints[0];
    const startPos = startCheckpoint
      ? { x: startCheckpoint.position.x, y: startCheckpoint.position.y - PLAYER_HEIGHT }
      : { x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: LEVEL_HEIGHT_MAX - PLAYER_HEIGHT - 50 };
      
    return {
      position: startPos,
      velocity: { x: 0, y: 0 },
      isGrounded: false,
      lastCheckpoint: startPos,
      isJumping: false,
      isFalling: false
    };
  };

  const [levelName, setLevelName] = useState(levelData.name);
  const [platforms, setPlatforms] = useState<PlatformData[]>(levelData.platforms);
  const [checkpoints, setCheckpoints] = useState<CheckpointData[]>(levelData.checkpoints);

  const [playerState, setPlayerState] = useState<PlayerState>(getInitialPlayerState(checkpoints));
  const [cameraY, setCameraY] = useState(LEVEL_HEIGHT_MAX - GAME_HEIGHT);
  const [activeCheckpoints, setActiveCheckpoints] = useState<Set<number>>(new Set());
  const [isFinished, setIsFinished] = useState(false);
  const [mode, setMode] = useState<'play' | 'edit'>(initialMode);
  
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const editorAction = useRef<{
    type: 'move' | 'resize-left' | 'resize-right',
    startPos: Vector2D,
    objectId: number,
    originalObject: PlatformData | CheckpointData,
  } | null>(null);

  const nextId = useRef(Math.max(
    0,
    ...levelData.platforms.map(p => p.id),
    ...levelData.checkpoints.map(c => c.id)
  ) + 1);

  const activeKeys = useKeyboardInput();
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resetGame(false);
    setLevelName(levelData.name);
    setPlatforms(levelData.platforms);
    setCheckpoints(levelData.checkpoints);
    setCameraY(LEVEL_HEIGHT_MAX - GAME_HEIGHT);
  }, [levelData, initialMode]);


  const gameTick = useCallback(() => {
    if (isFinished) return;

    setPlayerState(prev => {
      let { position, velocity, isGrounded, lastCheckpoint } = { ...prev };
      
      const isLeft = activeKeys.has('ArrowLeft');
      const isRight = activeKeys.has('ArrowRight');
      if (isLeft && !isRight) velocity.x = -PLAYER_SPEED;
      else if (isRight && !isLeft) velocity.x = PLAYER_SPEED;
      else velocity.x = 0;

      if (activeKeys.has('ArrowUp') && isGrounded) {
        velocity.y = JUMP_STRENGTH;
        isGrounded = false;
      }
      
      velocity.y += GRAVITY;
      const nextPosition = { x: position.x + velocity.x, y: position.y + velocity.y };

      let onGround = false;
      const playerBottom = nextPosition.y + PLAYER_HEIGHT;
      for (const platform of platforms) {
        const platformTop = platform.position.y;
        const playerWasAbove = position.y + PLAYER_HEIGHT <= platformTop + 1;
        if (playerBottom >= platformTop && playerWasAbove && nextPosition.x + PLAYER_WIDTH > platform.position.x && nextPosition.x < platform.position.x + platform.width && velocity.y >= 0) {
          velocity.y = 0;
          nextPosition.y = platformTop - PLAYER_HEIGHT;
          onGround = true;
          break;
        }
      }
      isGrounded = onGround;
      position = { ...nextPosition };

      if (position.x < 0) position.x = 0;
      if (position.x > GAME_WIDTH - PLAYER_WIDTH) position.x = GAME_WIDTH - PLAYER_WIDTH;

      if (position.y > LEVEL_HEIGHT_MAX) {
        position = { ...lastCheckpoint };
        velocity = { x: 0, y: 0 };
      }
      
      const victoryCheckpoint = checkpoints.length > 0
        ? checkpoints.sort((a, b) => a.position.y - b.position.y)[0]
        : null;

      for (const checkpoint of checkpoints) {
        if (position.x < checkpoint.position.x + checkpoint.width && position.x + PLAYER_WIDTH > checkpoint.position.x && position.y < checkpoint.position.y + checkpoint.height && position.y + PLAYER_HEIGHT > checkpoint.position.y) {
          if (!activeCheckpoints.has(checkpoint.id)) {
            const newActiveCheckpoints = new Set(activeCheckpoints).add(checkpoint.id);
            setActiveCheckpoints(newActiveCheckpoints);
            lastCheckpoint = { x: checkpoint.position.x, y: checkpoint.position.y - PLAYER_HEIGHT };

            if (victoryCheckpoint && checkpoint.id === victoryCheckpoint.id) {
               setIsFinished(true);
            }
          }
        }
      }

      const playerScreenY = position.y - cameraY;
      if (playerScreenY < CAMERA_SCROLL_THRESHOLD) {
        setCameraY(y => Math.max(0, position.y - CAMERA_SCROLL_THRESHOLD));
      } else if (playerScreenY > GAME_HEIGHT - CAMERA_SCROLL_THRESHOLD/2) {
          const newCamY = Math.min(LEVEL_HEIGHT_MAX - GAME_HEIGHT, position.y - (GAME_HEIGHT - CAMERA_SCROLL_THRESHOLD/2));
          if(newCamY > cameraY) setCameraY(newCamY);
      }

      return { position, velocity, isGrounded, lastCheckpoint, isJumping: !isGrounded && velocity.y < 0, isFalling: !isGrounded && velocity.y > 0 };
    });
  }, [activeKeys, cameraY, activeCheckpoints, isFinished, platforms, checkpoints]);

  useGameLoop(gameTick, mode === 'edit' || isFinished);

  const resetGame = (fullReset: boolean) => {
    const initialCheckpoints = fullReset ? levelData.checkpoints : checkpoints;
    setPlayerState(getInitialPlayerState(initialCheckpoints));
    if(fullReset) {
      setPlatforms(levelData.platforms);
      setCheckpoints(levelData.checkpoints);
      setLevelName(levelData.name);
    }
    setCameraY(LEVEL_HEIGHT_MAX - GAME_HEIGHT);
    setActiveCheckpoints(new Set());
    setIsFinished(false);
  };

  const handleToggleMode = () => {
    if (mode === 'play') {
      setMode('edit');
    } else {
      resetGame(false);
      setMode('play');
    }
  };
  
  const getMousePos = (e: React.MouseEvent): Vector2D => {
    if (!gameAreaRef.current) return { x: 0, y: 0 };
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + cameraY;
    return { x, y };
  };
  
  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  const handleEditorMouseDown = (e: React.MouseEvent, objectId: number, type: 'platform' | 'checkpoint', handle?: 'left' | 'right') => {
    e.stopPropagation();
    setSelectedObjectId(objectId);
    const originalObject = (type === 'platform' ? platforms : checkpoints).find(o => o.id === objectId);
    if (!originalObject) return;
    
    if (handle) {
      editorAction.current = { type: handle === 'left' ? 'resize-left' : 'resize-right', objectId, startPos: getMousePos(e), originalObject };
    } else {
      editorAction.current = { type: 'move', objectId, startPos: getMousePos(e), originalObject };
    }
  };

  const handleEditorMouseMove = (e: React.MouseEvent) => {
    if (!editorAction.current) return;
    const { type, startPos, objectId, originalObject } = editorAction.current;
    const currentPos = getMousePos(e);
    const delta = { x: currentPos.x - startPos.x, y: currentPos.y - startPos.y };

    if (type === 'move') {
      const newPos = {
        x: snapToGrid(originalObject.position.x + delta.x),
        y: snapToGrid(originalObject.position.y + delta.y),
      };
      
      if (platforms.some(p => p.id === objectId)) {
        setPlatforms(prev => prev.map(p => p.id === objectId ? { ...p, position: newPos } : p));
      } else {
        setCheckpoints(prev => prev.map(c => c.id === objectId ? { ...c, position: newPos } : c));
      }
    } else {
      const platform = originalObject as PlatformData;
      let newX = platform.position.x;
      let newWidth = platform.width;
      
      if (type === 'resize-right') {
        newWidth = Math.max(GRID_SIZE * 2, snapToGrid(platform.width + delta.x));
      } else if (type === 'resize-left') {
        const snappedDeltaX = snapToGrid(delta.x);
        newX = platform.position.x + snappedDeltaX;
        newWidth = platform.width - snappedDeltaX;
      }
      
      if (newWidth >= GRID_SIZE * 2) {
        setPlatforms(prev => prev.map(p => p.id === objectId ? { ...p, position: {...p.position, x: newX }, width: newWidth } : p));
      }
    }
  };

  const handleEditorMouseUp = () => {
    editorAction.current = null;
  };
  
  const handleContainerMouseDown = (e: React.MouseEvent) => {
      if(e.target === e.currentTarget) setSelectedObjectId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (mode !== 'edit') return;
    setCameraY(y => Math.max(0, Math.min(y + e.deltaY, LEVEL_HEIGHT_MAX - GAME_HEIGHT)));
  };

  const handleAddObject = (type: 'platform' | 'checkpoint') => {
    const newId = nextId.current++;
    const position = { x: snapToGrid(GAME_WIDTH / 2 - 75), y: snapToGrid(cameraY + GAME_HEIGHT / 2) };
    if (type === 'platform') {
      const newPlatform: PlatformData = { id: newId, position, width: 150, height: 20 };
      setPlatforms(prev => [...prev, newPlatform]);
    } else {
      const newCheckpoint: CheckpointData = { id: newId, position, width: 40, height: 40 };
      setCheckpoints(prev => [...prev, newCheckpoint]);
    }
    setSelectedObjectId(newId);
  };
  
  const handleDeleteSelected = () => {
    if (selectedObjectId === null) return;
    setPlatforms(prev => prev.filter(p => p.id !== selectedObjectId));
    setCheckpoints(prev => prev.filter(c => c.id !== selectedObjectId));
    setSelectedObjectId(null);
  };
  
  const handleSave = () => {
    const trimmedName = levelName.trim();
    if (!trimmedName) {
        alert("Level name cannot be empty.");
        return;
    }

    const existingLevels = getLevels();
    const isOverwriting = existingLevels.some(l => l.name === trimmedName);
    
    if (isOverwriting) {
        if (!window.confirm(`A level named "${trimmedName}" already exists. Do you want to overwrite it?`)) {
            return;
        }
    }

    setSaveStatus('saving');
    const levelToSave: LevelData = { name: trimmedName, platforms, checkpoints };
    saveLevelToStorage(levelToSave);
    
    setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleExport = () => {
    const levelToExport: LevelData = { name: levelName, platforms, checkpoints };
    const jsonString = JSON.stringify(levelToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${levelName.replace(/ /g, '_') || 'level'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const gridPattern = useMemo(() => {
    if (mode !== 'edit') return {};
    const gridColor = theme === 'night' || theme === 'twilight' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    return {
      backgroundImage: `
        linear-gradient(to right, ${gridColor} 1px, transparent 1px),
        linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
      `,
      backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
    };
  }, [mode, theme]);

  const outerContainerClass = theme === 'twilight' ? '' : THEME_CONFIG[theme].bg;
  
  const levelContainerStyle = { 
      height: LEVEL_HEIGHT_MAX,
      transform: `translateY(${-cameraY}px)`,
      ...gridPattern
  };

  const gameViewportStyle: React.CSSProperties = {
    width: GAME_WIDTH, 
    height: GAME_HEIGHT, 
    perspective: '1000px', 
    cursor: mode === 'edit' ? 'grab' : 'auto',
    ...(theme === 'twilight' && {
        // Apply a multi-stop gradient to the viewport, sized to the full level height.
        // Animate backgroundPosition instead of applying the background to a huge scrolling div to prevent banding.
        backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e3a8a, #3c5a99, #60a5fa, #a690c8, #fb923c, #fcd34d)',
        backgroundSize: `100% ${LEVEL_HEIGHT_MAX}px`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `0px ${-cameraY}px`,
    }),
  };

  return (
    <>
      <EditorToolbar 
        mode={mode}
        theme={theme}
        onToggleMode={handleToggleMode}
        onSetTheme={onSetTheme}
        onAddPlatform={() => handleAddObject('platform')}
        onAddCheckpoint={() => handleAddObject('checkpoint')}
        onDeleteSelected={handleDeleteSelected}
        isObjectSelected={selectedObjectId !== null}
        onSave={handleSave}
        onExport={handleExport}
        onExit={onExit}
        levelName={levelName}
        onLevelNameChange={setLevelName}
        saveStatus={saveStatus}
      />
      <div 
        className={`relative rounded-2xl shadow-2xl overflow-hidden border-8 border-gray-700 ${outerContainerClass}`}
        style={gameViewportStyle}
        onWheel={handleWheel}
        onMouseMove={mode === 'edit' ? handleEditorMouseMove : undefined}
        onMouseUp={mode === 'edit' ? handleEditorMouseUp : undefined}
        onMouseDown={mode === 'edit' ? handleContainerMouseDown : undefined}
        ref={gameAreaRef}
      >
        <div 
          className="absolute top-0 left-0 w-full"
          style={levelContainerStyle}
        >
          {mode === 'edit' && (
             <>
                <div style={{position: 'absolute', top: 0, left: 0, width: '100%', borderTop: '2px dashed red'}}><span className="bg-red-500 text-white text-xs p-1">Top Boundary</span></div>
                <div style={{position: 'absolute', left: 0, top: 0, height: LEVEL_HEIGHT_MAX, borderLeft: '2px dashed red'}} />
                <div style={{position: 'absolute', right: 0, top: 0, height: LEVEL_HEIGHT_MAX, borderRight: '2px dashed red'}} />
                <div style={{position: 'absolute', top: LEVEL_HEIGHT_MAX, left: 0, width: '100%', borderTop: '2px dashed red'}}><span className="bg-red-500 text-white text-xs p-1">Bottom Boundary</span></div>
             </>
          )}

          {THEME_CONFIG[theme].scenery.map(scenery => (
            <Scenery key={scenery.id} {...scenery} cameraY={cameraY} />
          ))}
          {platforms.map(platform => (
            <Platform 
              key={platform.id} 
              {...platform}
              isSelected={mode === 'edit' && selectedObjectId === platform.id}
              isEditable={mode === 'edit'}
              onMouseDown={(e) => handleEditorMouseDown(e, platform.id, 'platform')}
              onResizeHandleMouseDown={(e, dir) => handleEditorMouseDown(e, platform.id, 'platform', dir)}
            />
          ))}
          {checkpoints.map(checkpoint => (
            <Checkpoint 
              key={checkpoint.id}
              {...checkpoint} 
              isActive={activeCheckpoints.has(checkpoint.id)} 
              isSelected={mode === 'edit' && selectedObjectId === checkpoint.id}
              isEditable={mode === 'edit'}
              onMouseDown={(e) => handleEditorMouseDown(e, checkpoint.id, 'checkpoint')}
            />
          ))}
          {mode === 'play' && <Player playerState={playerState} />}
        </div>
        {isFinished && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center z-50">
            <h1 className="text-6xl font-bold text-white mb-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>You Win!</h1>
            <p className="text-2xl text-white mb-8">Congratulations!</p>
            <button
              onClick={() => resetGame(initialMode === 'play')}
              className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-lg shadow-lg hover:bg-yellow-500 transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </>
  );
};