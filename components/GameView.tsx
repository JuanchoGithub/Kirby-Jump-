import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Player } from './Player';
import { Platform } from './Platform';
import { Checkpoint } from './Checkpoint';
import { Trap } from './Trap';
import { Scenery } from './Scenery';
import { EditorToolbar } from './EditorToolbar';
import { EditorPropertiesPanel } from './EditorPropertiesPanel';
import { useGameLoop } from '../hooks/useGameLoop';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { PlayerState, Vector2D, PlatformData, CheckpointData, LevelData, Theme, TrapData } from '../types';
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

const getInitialPlatformState = (initialPlatforms: PlatformData[]): { platforms: PlatformData[], movingState: Map<number, { progress: number; direction: 1 | -1; }> } => {
    const newMap = new Map<number, { progress: number; direction: 1 | -1 }>();
    const updatedPlatforms = initialPlatforms.map(p => {
        if (p.movement) {
            newMap.set(p.id, { progress: 0, direction: 1 });
            return { ...p, position: p.movement.path[0] };
        }
        return p;
    });
    return { platforms: updatedPlatforms, movingState: newMap };
};


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
  
  const { platforms: initialPlatforms, movingState: initialMovingState } = getInitialPlatformState(levelData.platforms);

  const [levelName, setLevelName] = useState(levelData.name);
  const [platforms, setPlatforms] = useState<PlatformData[]>(initialPlatforms);
  const [checkpoints, setCheckpoints] = useState<CheckpointData[]>(levelData.checkpoints);
  const [traps, setTraps] = useState<TrapData[]>(levelData.traps || []);
  const [movingPlatformState, setMovingPlatformState] = useState(initialMovingState);
  const [playerState, setPlayerState] = useState<PlayerState>(() => getInitialPlayerState(levelData.checkpoints));

  const [cameraY, setCameraY] = useState(LEVEL_HEIGHT_MAX - GAME_HEIGHT);
  const [activeCheckpoints, setActiveCheckpoints] = useState<Set<number>>(new Set());
  const [isFinished, setIsFinished] = useState(false);
  const [mode, setMode] = useState<'play' | 'edit'>(initialMode);
  
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const editorAction = useRef<{
    type: 'move' | 'resize-left' | 'resize-right' | 'move-path-end',
    startPos: Vector2D,
    objectId: number,
    originalObject: PlatformData | CheckpointData | TrapData,
    attachedTraps?: { trapId: number, offset: Vector2D }[]
  } | null>(null);

  const nextId = useRef(Math.max(
    0,
    ...levelData.platforms.map(p => p.id),
    ...levelData.checkpoints.map(c => c.id),
    ...(levelData.traps || []).map(t => t.id)
  ) + 1);

  const activeKeys = useKeyboardInput();
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const resetGame = useCallback((fullReset: boolean) => {
    const sourcePlatforms = fullReset ? levelData.platforms : platforms;
    const { platforms: resetPlatforms, movingState: resetMovingState } = getInitialPlatformState(sourcePlatforms);

    setPlatforms(resetPlatforms);
    setMovingPlatformState(resetMovingState);

    if (fullReset) {
      setLevelName(levelData.name);
      setCheckpoints(levelData.checkpoints);
      setTraps(levelData.traps || []);
      setPlayerState(getInitialPlayerState(levelData.checkpoints));
    } else {
      setPlayerState(getInitialPlayerState(checkpoints));
    }

    setCameraY(LEVEL_HEIGHT_MAX - GAME_HEIGHT);
    setActiveCheckpoints(new Set());
    setIsFinished(false);
  }, [levelData, platforms, checkpoints]);

  const gameTick = useCallback((deltaTime: number) => {
    if (isFinished || mode === 'edit') return;

    // --- Update Moving Platforms ---
    const platformDeltas = new Map<number, Vector2D>();
    const updatedPlatforms = platforms.map(p => {
        if (!p.movement) return p;

        const state = movingPlatformState.get(p.id);
        if (!state) return p;

        const { path, speed } = p.movement;
        const pathVector = { x: path[1].x - path[0].x, y: path[1].y - path[0].y };
        const pathLength = Math.sqrt(pathVector.x ** 2 + pathVector.y ** 2);
        if (pathLength === 0) return p;

        const distanceToMove = (speed * (deltaTime / 1000)) * state.direction;
        let newProgress = state.progress + distanceToMove / pathLength;
        
        let newDirection = state.direction;
        if (newProgress >= 1) {
            newProgress = 1;
            newDirection = -1;
        } else if (newProgress <= 0) {
            newProgress = 0;
            newDirection = 1;
        }
        
        movingPlatformState.set(p.id, { progress: newProgress, direction: newDirection });

        const newPosition = {
            x: path[0].x + pathVector.x * newProgress,
            y: path[0].y + pathVector.y * newProgress,
        };

        platformDeltas.set(p.id, {
            x: newPosition.x - p.position.x,
            y: newPosition.y - p.position.y
        });

        return { ...p, position: newPosition };
    });
    
    // --- Update Traps on Moving Platforms ---
    const updatedTraps = traps.map(trap => {
        if (trap.platformId && platformDeltas.has(trap.platformId)) {
            const delta = platformDeltas.get(trap.platformId)!;
            return {
                ...trap,
                position: {
                    x: trap.position.x + delta.x,
                    y: trap.position.y + delta.y,
                }
            };
        }
        return trap;
    });

    setPlatforms(updatedPlatforms);
    setTraps(updatedTraps);


    // --- Update Player ---
    setPlayerState(prev => {
      let { position, velocity, isGrounded, lastCheckpoint } = { ...prev };
      
      const isLeft = activeKeys.has('ArrowLeft');
      const isRight = activeKeys.has('ArrowRight');
      if (isLeft && !isRight) velocity.x = -PLAYER_SPEED;
      else if (isRight && !isLeft) velocity.x = PLAYER_SPEED;
      else velocity.x = 0;

      if (activeKeys.has('ArrowUp') && isGrounded) {
        velocity.y = JUMP_STRENGTH;
      }
      
      velocity.y += GRAVITY;
      const nextPosition = { x: position.x + velocity.x, y: position.y + velocity.y };

      let onGround = false;
      let groundedPlatformId: number | null = null;
      const playerBottom = nextPosition.y + PLAYER_HEIGHT;

      for (const platform of updatedPlatforms) {
        const platformTop = platform.position.y;
        const playerWasAbove = position.y + PLAYER_HEIGHT <= platformTop + 1;
        if (playerBottom >= platformTop && playerWasAbove && nextPosition.x + PLAYER_WIDTH > platform.position.x && nextPosition.x < platform.position.x + platform.width && velocity.y >= 0) {
          velocity.y = 0;
          nextPosition.y = platformTop - PLAYER_HEIGHT;
          onGround = true;
          groundedPlatformId = platform.id;
          break;
        }
      }
      isGrounded = onGround;
      position = { ...nextPosition };
      
      if (isGrounded && groundedPlatformId !== null) {
          const delta = platformDeltas.get(groundedPlatformId);
          if (delta) {
              position.x += delta.x;
              position.y += delta.y;
          }
      }

      if (position.x < 0) position.x = 0;
      if (position.x > GAME_WIDTH - PLAYER_WIDTH) position.x = GAME_WIDTH - PLAYER_WIDTH;

      for (const trap of updatedTraps) {
          if (position.x < trap.position.x + trap.width &&
              position.x + PLAYER_WIDTH > trap.position.x &&
              position.y < trap.position.y + trap.height &&
              position.y + PLAYER_HEIGHT > trap.position.y)
          {
              position = { ...lastCheckpoint };
              velocity = { x: 0, y: 0 };
              break;
          }
      }

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
  }, [cameraY, activeCheckpoints, isFinished, platforms, checkpoints, traps, mode, movingPlatformState]);

  useGameLoop(gameTick, mode === 'edit' || isFinished);

  const handleToggleMode = () => {
    if (mode === 'play') {
      const { platforms: resetPlatforms, movingState: resetMovingState } = getInitialPlatformState(platforms);
      setPlatforms(resetPlatforms);
      setMovingPlatformState(resetMovingState);
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

  const handleEditorMouseDown = (e: React.MouseEvent, objectId: number, type: 'platform' | 'checkpoint' | 'trap', handle?: 'left' | 'right' | 'move-path-end') => {
    e.stopPropagation();
    setSelectedObjectId(objectId);
    
    let objectList;
    if (type === 'platform') objectList = platforms;
    else if (type === 'checkpoint') objectList = checkpoints;
    else objectList = traps;

    const originalObject = objectList.find(o => o.id === objectId);
    if (!originalObject) return;

    let attachedTrapsInfo: { trapId: number, offset: Vector2D }[] | undefined = undefined;
    if (type === 'platform' && !handle) {
        const platform = originalObject as PlatformData;
        attachedTrapsInfo = traps.filter(t => t.platformId === platform.id)
            .map(t => ({
                trapId: t.id,
                offset: { x: t.position.x - platform.position.x, y: t.position.y - platform.position.y }
            }));
    }
    
    // FIX: Map 'left'/'right' to 'resize-left'/'resize-right' for the editor action type.
    if (handle) {
      let actionType: 'resize-left' | 'resize-right' | 'move-path-end';
      if (handle === 'left') {
        actionType = 'resize-left';
      } else if (handle === 'right') {
        actionType = 'resize-right';
      } else {
        actionType = handle; // 'move-path-end'
      }
      editorAction.current = { type: actionType, objectId, startPos: getMousePos(e), originalObject };
    } else {
      editorAction.current = { type: 'move', objectId, startPos: getMousePos(e), originalObject, attachedTraps: attachedTrapsInfo };
    }
  };

  const handleEditorMouseMove = (e: React.MouseEvent) => {
    if (!editorAction.current) return;
    const { type, startPos, objectId, originalObject } = editorAction.current;
    const currentPos = getMousePos(e);
    const delta = { x: currentPos.x - startPos.x, y: currentPos.y - startPos.y };

    if (type === 'move') {
      if (platforms.some(p => p.id === objectId)) {
        const platform = originalObject as PlatformData;
        const newPos = {
          x: snapToGrid(platform.position.x + delta.x),
          y: snapToGrid(platform.position.y + delta.y),
        };
        setPlatforms(prev => prev.map(p => p.id === objectId ? { ...p, position: newPos } : p));
        
        const attachedTraps = editorAction.current?.attachedTraps;
        if(attachedTraps && attachedTraps.length > 0) {
            setTraps(prevTraps => {
                const nextTraps = [...prevTraps];
                for (const attached of attachedTraps) {
                    const trapIndex = nextTraps.findIndex(t => t.id === attached.trapId);
                    if (trapIndex !== -1) {
                        nextTraps[trapIndex] = {
                            ...nextTraps[trapIndex],
                            position: {
                                x: newPos.x + attached.offset.x,
                                y: newPos.y + attached.offset.y
                            }
                        };
                    }
                }
                return nextTraps;
            });
        }

      } else if (checkpoints.some(c => c.id === objectId)) {
        const newPos = {
            x: snapToGrid(originalObject.position.x + delta.x),
            y: snapToGrid(originalObject.position.y + delta.y),
        };
        setCheckpoints(prev => prev.map(c => c.id === objectId ? { ...c, position: newPos } : c));
      } else if (traps.some(t => t.id === objectId)) {
        const trap = originalObject as TrapData;
        
        const platformsUnderCursor = platforms
            .filter(p => currentPos.x >= p.position.x && currentPos.x < p.position.x + p.width && currentPos.y > p.position.y)
            .sort((a,b) => a.position.y - b.position.y);
        
        const targetPlatform = platformsUnderCursor[0] || null;

        if (targetPlatform) {
            const newPos = {
                x: snapToGrid(currentPos.x - trap.width / 2),
                y: targetPlatform.position.y - trap.height,
            };
            setTraps(prev => prev.map(t => t.id === objectId ? { ...t, position: newPos, platformId: targetPlatform.id } : t));
        }
      }
    } else if (type === 'move-path-end') {
        const platform = originalObject as PlatformData;
        if (!platform.movement) return;
        const newPathEnd = {
            x: snapToGrid(platform.movement.path[1].x + delta.x),
            y: snapToGrid(platform.movement.path[1].y + delta.y),
        };
        setPlatforms(prev => prev.map(p => p.id === objectId ? { ...p, movement: { ...p.movement!, path: [p.movement!.path[0], newPathEnd] } } : p));
    } else { // Resize
      if (platforms.some(p => p.id === objectId)) {
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
      } else if (traps.some(t => t.id === objectId)) {
        const trap = originalObject as TrapData;
        let newX = trap.position.x;
        let newWidth = trap.width;

        if (type === 'resize-right') {
          newWidth = Math.max(GRID_SIZE, snapToGrid(trap.width + delta.x));
        } else if (type === 'resize-left') {
          const snappedDeltaX = snapToGrid(delta.x);
          newX = trap.position.x + snappedDeltaX;
          newWidth = trap.width - snappedDeltaX;
        }

        if (newWidth >= GRID_SIZE) {
          setTraps(prev => prev.map(t => t.id === objectId ? { ...t, position: { ...t.position, x: newX }, width: newWidth } : t));
        }
      }
    }
  };

  const handleEditorMouseUp = () => {
    if (editorAction.current?.type === 'move') {
      const { objectId, originalObject } = editorAction.current;
      const platform = platforms.find(p => p.id === objectId);
      if (platform?.movement) {
        // If a moving platform was moved, update its path start point
        const delta = {
            x: platform.position.x - originalObject.position.x,
            y: platform.position.y - originalObject.position.y
        };
        const newPath: [Vector2D, Vector2D] = [
            platform.position,
            { x: platform.movement.path[1].x + delta.x, y: platform.movement.path[1].y + delta.y }
        ];
        handleUpdatePlatform(objectId, { movement: { ...platform.movement, path: newPath }});
      }
    }
    editorAction.current = null;
  };
  
  const handleContainerMouseDown = (e: React.MouseEvent) => {
      if(e.target === e.currentTarget) setSelectedObjectId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (mode !== 'edit') return;
    setCameraY(y => Math.max(0, Math.min(y + e.deltaY, LEVEL_HEIGHT_MAX - GAME_HEIGHT)));
  };

  const handleAddObject = (type: 'platform' | 'checkpoint' | 'trap') => {
    const newId = nextId.current++;
    const position = { x: snapToGrid(GAME_WIDTH / 2 - 75), y: snapToGrid(cameraY + GAME_HEIGHT / 2) };
    if (type === 'platform') {
      const newPlatform: PlatformData = { id: newId, position, width: 150, height: 20 };
      setPlatforms(prev => [...prev, newPlatform]);
      setSelectedObjectId(newId);
    } else if (type === 'checkpoint') {
      const newCheckpoint: CheckpointData = { id: newId, position, width: 40, height: 40 };
      setCheckpoints(prev => [...prev, newCheckpoint]);
      setSelectedObjectId(newId);
    } else if (type === 'trap') {
        const trapWidth = 80;
        const trapHeight = 20;
        const centerOfView = { x: GAME_WIDTH / 2, y: cameraY + GAME_HEIGHT / 2 };

        const platformsUnder = platforms
            .filter(p => centerOfView.x >= p.position.x && centerOfView.x < p.position.x + p.width && centerOfView.y < p.position.y)
            .sort((a,b) => a.position.y - b.position.y);
        
        const targetPlatform = platformsUnder[0] || null;

        if (!targetPlatform) {
            alert("No platform found below the center of the screen. Add a platform first!");
            return;
        }

        const finalPos = {
            x: snapToGrid(targetPlatform.position.x + targetPlatform.width / 2 - trapWidth / 2),
            y: targetPlatform.position.y - trapHeight,
        };
        const newTrap: TrapData = { id: newId, type: 'spikes', position: finalPos, width: trapWidth, height: trapHeight, platformId: targetPlatform.id };
        setTraps(prev => [...prev, newTrap]);
        setSelectedObjectId(newId);
    }
  };
  
  const handleDeleteSelected = () => {
    if (selectedObjectId === null) return;
    
    const isPlatform = platforms.some(p => p.id === selectedObjectId);

    setPlatforms(prev => prev.filter(p => p.id !== selectedObjectId));
    setCheckpoints(prev => prev.filter(c => c.id !== selectedObjectId));
    setTraps(prev => prev.filter(t => t.id !== selectedObjectId && (!isPlatform || t.platformId !== selectedObjectId)));
    
    setSelectedObjectId(null);
  };
  
  const handleSave = () => {
    const trimmedName = levelName.trim();
    if (!trimmedName) {
        alert("Level name cannot be empty.");
        return;
    }

    const originalName = levelData.name;
    const existingLevels = getLevels();
    const conflictingLevel = existingLevels.find(l => l.name === trimmedName);

    if (conflictingLevel && trimmedName !== originalName) {
        if (!window.confirm(`A level named "${trimmedName}" already exists. Do you want to overwrite it?`)) {
            return;
        }
    }

    setSaveStatus('saving');
    const platformsToSave = platforms.map(p => {
        if (p.movement) {
            // Reset position to the start of the path for saving
            return { ...p, position: p.movement.path[0] };
        }
        return p;
    });
    const levelToSave: LevelData = { name: trimmedName, platforms: platformsToSave, checkpoints, traps };
    saveLevelToStorage(levelToSave);
    
    setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleExport = () => {
    const platformsToSave = platforms.map(p => {
        if (p.movement) {
            return { ...p, position: p.movement.path[0] };
        }
        return p;
    });
    const levelToExport: LevelData = { name: levelName, platforms: platformsToSave, checkpoints, traps };
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
  
  const handleUpdatePlatform = (id: number, updates: Partial<PlatformData>) => {
    setPlatforms(prev => prev.map(p => {
        if (p.id !== id) return p;
        const newPlatform = { ...p, ...updates };
        
        if (updates.movement && !p.movement) {
            setMovingPlatformState(prevMap => new Map(prevMap).set(id, { progress: 0, direction: 1 }));
            newPlatform.position = updates.movement.path[0];
        } else if (updates.movement === undefined && p.movement) {
            setMovingPlatformState(prevMap => {
                const newMap = new Map(prevMap);
                newMap.delete(id);
                return newMap;
            });
        }
        return newPlatform;
    }));
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
  
  const selectedObjectData = useMemo(() => {
      if (selectedObjectId === null) return null;
      const platform = platforms.find(p => p.id === selectedObjectId);
      if (platform) return { id: selectedObjectId, type: 'platform' as const, data: platform };
      
      const checkpoint = checkpoints.find(c => c.id === selectedObjectId);
      if (checkpoint) return { id: selectedObjectId, type: 'checkpoint' as const, data: checkpoint };
      
      const trap = traps.find(t => t.id === selectedObjectId);
      if (trap) return { id: selectedObjectId, type: 'trap' as const, data: trap };

      return null;
  }, [selectedObjectId, platforms, checkpoints, traps]);

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
        onAddTrap={() => handleAddObject('trap')}
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
        {mode === 'edit' && selectedObjectData?.type === 'platform' && (
            <EditorPropertiesPanel
                selectedObject={selectedObjectData}
                onUpdatePlatform={handleUpdatePlatform}
            />
        )}
        <div 
          className="absolute top-0 left-0 w-full"
          style={levelContainerStyle}
        >
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
          {traps.map(trap => (
            <Trap
              key={trap.id}
              {...trap}
              isSelected={mode === 'edit' && selectedObjectId === trap.id}
              isEditable={mode === 'edit'}
              onMouseDown={(e) => handleEditorMouseDown(e, trap.id, 'trap')}
              onResizeHandleMouseDown={(e, dir) => handleEditorMouseDown(e, trap.id, 'trap', dir)}
            />
          ))}

          {mode === 'edit' && platforms.map(p => {
              if (!p.movement || selectedObjectId !== p.id) return null;
              const [start, end] = p.movement.path;
              return (
                  <React.Fragment key={`path-overlay-${p.id}`}>
                      <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none" style={{ zIndex: 100 }}>
                          <line x1={start.x + p.width/2} y1={start.y + p.height/2} x2={end.x + p.width/2} y2={end.y + p.height/2} stroke="rgba(255, 255, 100, 0.7)" strokeWidth="2" strokeDasharray="6,6" />
                      </svg>
                      <div
                          className="absolute w-4 h-4 bg-yellow-400 rounded-full border-2 border-white cursor-pointer"
                          style={{ left: end.x + p.width/2 - 8, top: end.y + p.height/2 - 8, zIndex: 101 }}
                          onMouseDown={(e) => handleEditorMouseDown(e, p.id, 'platform', 'move-path-end')}
                      />
                  </React.Fragment>
              )
          })}
          
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