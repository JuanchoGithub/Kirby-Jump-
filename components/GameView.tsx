import React, { useState, useCallback, useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { Player } from './Player';
import { Platform } from './Platform';
import { Checkpoint } from './Checkpoint';
import { Trap } from './Trap';
import { Scenery } from './Scenery';
import { EditorSidebar } from './EditorSidebar';
import { OnScreenControls, OnScreenControlsState } from './OnScreenControls';
import { useGameLoop } from '../hooks/useGameLoop';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { useGamepadInput } from '../hooks/useGamepadInput';
import { useMobileDetection } from '../hooks/useIsTouchDevice';
import { PlayerState, Vector2D, PlatformData, CheckpointData, LevelData, Theme, TrapData, GameObject } from '../types';
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
const THEMES: Theme[] = ['day', 'afternoon', 'night', 'twilight'];

export type EditorTool = 'select' | 'add-platform' | 'add-checkpoint' | 'add-trap';
const EDITOR_TOOLS: EditorTool[] = ['select', 'add-platform', 'add-checkpoint', 'add-trap'];

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>

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
      isFalling: false,
      groundedOnPlatformId: null,
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
  const [hoveredObjectId, setHoveredObjectId] = useState<number | null>(null);
  const [isSidebarFocused, setIsSidebarFocused] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [editorCursor, setEditorCursor] = useState<{pos: Vector2D, visible: boolean}>({ pos: {x: 0, y: 0}, visible: false });
  const [showTestConfirm, setShowTestConfirm] = useState(false);
  const [confirmFocusIndex, setConfirmFocusIndex] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitConfirmFocusIndex, setExitConfirmFocusIndex] = useState(0);
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [scale, setScale] = useState(1);
  const { isTouch: isTouchDevice } = useMobileDetection();
  const [onScreenControls, setOnScreenControls] = useState<OnScreenControlsState>({ move: 0, jump: false });

  const dpadSpeedChangeState = useRef({ startTime: 0, direction: 0, lastTick: 0 });
  
  const editorAction = useRef<{
    type: 'move' | 'resize-left' | 'resize-right' | 'move-path-end',
    startPos: Vector2D,
    objectId: number,
    originalObject: PlatformData | CheckpointData | TrapData,
    attachedTraps?: { trapId: number, offset: Vector2D }[]
  } | null>(null);
  const editorTouchId = useRef<number | null>(null);

  const nextId = useRef(Math.max(
    0,
    ...levelData.platforms.map(p => p.id),
    ...levelData.checkpoints.map(c => c.id),
    ...(levelData.traps || []).map(t => t.id)
  ) + 1);

  const activeKeys = useKeyboardInput();
  const gamepadState = useGamepadInput();
  const prevGamepadState = useRef(gamepadState);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const calculateScale = () => {
        if (!gameContainerRef.current) return;
        const { width, height } = gameContainerRef.current.getBoundingClientRect();
        const newScale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT) * 0.95; // 0.95 for padding
        setScale(newScale);
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const handleSave = useCallback((showAlert = true) => {
    const trimmedName = levelName.trim(); if (!trimmedName) { if(showAlert) alert("Level name cannot be empty."); return; }
    const existingLevels = getLevels();
    if (existingLevels.find(l => l.name === trimmedName) && trimmedName !== levelData.name) {
        if (showAlert && !window.confirm(`Overwrite "${trimmedName}"?`)) return;
    }
    setSaveStatus('saving');
    const platformsToSave = platforms.map(p => p.movement ? { ...p, position: p.movement.path[0] } : p);
    saveLevelToStorage({ name: trimmedName, platforms: platformsToSave, checkpoints, traps });
    setTimeout(() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); }, 500);
  }, [levelName, levelData.name, platforms, checkpoints, traps]);

  const resetGame = useCallback((fullReset: boolean) => {
    const sourcePlatforms = fullReset ? levelData.platforms : platforms;
    const { platforms: resetPlatforms, movingState: resetMovingState } = getInitialPlatformState(sourcePlatforms);

    setPlatforms(resetPlatforms);
    setMovingPlatformState(resetMovingState);
    setActiveTool('select');

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

  const handleToggleMode = useCallback(() => {
    if (mode === 'play') {
      const { platforms: resetPlatforms, movingState: resetMovingState } = getInitialPlatformState(platforms);
      const platformResetDeltas = new Map<number, Vector2D>();
      platforms.forEach(currentPlatform => {
          if (currentPlatform.movement) {
              const resetPlatform = resetPlatforms.find(p => p.id === currentPlatform.id);
              if (resetPlatform) platformResetDeltas.set(currentPlatform.id, { x: resetPlatform.position.x - currentPlatform.position.x, y: resetPlatform.position.y - currentPlatform.position.y });
          }
      });
      const resetTraps = traps.map(trap => {
          if (trap.platformId && platformResetDeltas.has(trap.platformId)) {
              const delta = platformResetDeltas.get(trap.platformId)!;
              return { ...trap, position: { x: trap.position.x + delta.x, y: trap.position.y + delta.y } };
          }
          return trap;
      });
      setPlatforms(resetPlatforms);
      setMovingPlatformState(resetMovingState);
      setTraps(resetTraps);
      setMode('edit');
    } else {
      resetGame(false);
      setMode('play');
    }
  }, [mode, platforms, traps, resetGame]);
  
  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    if (initialMode === 'edit') {
        handleToggleMode();
    } else {
        onExit();
    }
  };

  const handleUpdatePlatform = useCallback((id: number, updates: Partial<PlatformData>) => {
    setPlatforms(prev => prev.map(p => {
        if (p.id !== id) return p;
        const newPlatform = { ...p, ...updates };
        if (updates.movement && !p.movement) {
            setMovingPlatformState(prevMap => new Map(prevMap).set(id, { progress: 0, direction: 1 }));
            newPlatform.position = updates.movement.path[0];
        } else if (updates.movement === undefined && p.movement) {
            setMovingPlatformState(prevMap => { const newMap = new Map(prevMap); newMap.delete(id); return newMap; });
        }
        return newPlatform;
    }));
  }, []);

  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;
  
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

  const handleEditorGamepadInput = useCallback(() => {
    if (isSidebarFocused || showTestConfirm || showExitConfirm) return;

    const deadzone = 0.2;
    const cursorSpeed = 8;
    const leftStickX = gamepadState.axes[0] || 0;
    const leftStickY = gamepadState.axes[1] || 0;
    const rightStickX = gamepadState.axes[2] || 0;
    const rightStickY = gamepadState.axes[3] || 0;
    const rightStickActive = Math.abs(rightStickX) > deadzone || Math.abs(rightStickY) > deadzone;
    const prevRightStickActive = Math.abs(prevGamepadState.current.axes[2] || 0) > deadzone || Math.abs(prevGamepadState.current.axes[3] || 0) > deadzone;

    // --- Cursor Movement ---
    if (Math.abs(leftStickX) > deadzone || Math.abs(leftStickY) > deadzone) {
        setEditorCursor(prev => {
            let newX = prev.pos.x + leftStickX * cursorSpeed;
            let newY = prev.pos.y + leftStickY * cursorSpeed;
            newX = Math.max(0, Math.min(GAME_WIDTH, newX));
            newY = Math.max(cameraY, Math.min(cameraY + GAME_HEIGHT, newY));
            return { pos: { x: newX, y: newY }, visible: true };
        });
    }

    // --- Button Presses ---
    const aButtonPressed = gamepadState.buttons[0]?.pressed && !prevGamepadState.current.buttons[0]?.pressed;
    const bButtonPressed = gamepadState.buttons[1]?.pressed && !prevGamepadState.current.buttons[1]?.pressed;
    const yButtonPressed = gamepadState.buttons[3]?.pressed && !prevGamepadState.current.buttons[3]?.pressed;
    const lbPressed = gamepadState.buttons[4]?.pressed && !prevGamepadState.current.buttons[4]?.pressed;
    const rbPressed = gamepadState.buttons[5]?.pressed && !prevGamepadState.current.buttons[5]?.pressed;
    const rtValue = gamepadState.buttons[7]?.value || 0;
    const prevRtValue = prevGamepadState.current.buttons[7]?.value || 0;
    const rtPressed = rtValue > 0.5;
    const rtReleased = !rtPressed && prevRtValue > 0.5;
    const viewButtonPressed = gamepadState.buttons[8]?.pressed && !prevGamepadState.current.buttons[8]?.pressed;
    const startButtonPressed = gamepadState.buttons[9]?.pressed && !prevGamepadState.current.buttons[9]?.pressed;
    const dpadUp = gamepadState.buttons[12]?.pressed;
    const dpadDown = gamepadState.buttons[13]?.pressed;
    const dpadLeft = gamepadState.buttons[14]?.pressed;
    const dpadRight = gamepadState.buttons[15]?.pressed;

    // --- High-Priority Actions & State Transitions ---
    if (startButtonPressed) { handleRequestTestLevel(); return; }
    if (viewButtonPressed) { setIsSidebarFocused(true); setIsSidebarOpen(true); return; }
    if (bButtonPressed) { setSelectedObjectId(null); }
    if (yButtonPressed) {
        const currentIndex = THEMES.indexOf(theme);
        onSetTheme(THEMES[(currentIndex + 1) % THEMES.length]);
    }
    
    // --- Path Editing State ---
    if (rtPressed && !isEditingPath && selectedObjectData?.type === 'platform') {
        setIsEditingPath(true);
        if (!selectedObjectData.data.movement) {
            const platform = selectedObjectData.data;
            handleUpdatePlatform(platform.id, { movement: { path: [platform.position, { x: platform.position.x + 100, y: platform.position.y }], speed: 50 } });
        }
    }
    if ((rtReleased || selectedObjectId === null) && isEditingPath) setIsEditingPath(false);
    
    // --- Continuous Actions (State-based) ---
    if (isEditingPath) {
        if (selectedObjectData?.type === 'platform' && selectedObjectData.data.movement) {
            // Path End Position
            const platform = selectedObjectData.data;
            const snappedCursorPos = { x: snapToGrid(editorCursor.pos.x), y: snapToGrid(editorCursor.pos.y) };
            const newPathEnd = { x: snappedCursorPos.x - platform.width / 2, y: snappedCursorPos.y - platform.height / 2 };
            handleUpdatePlatform(platform.id, { movement: { ...platform.movement, path: [platform.movement.path[0], newPathEnd] } });
            
            // Speed Control
            const currentDirection = dpadUp ? 1 : (dpadDown ? -1 : 0);
            const now = performance.now();
            if (currentDirection !== 0) {
                if (dpadSpeedChangeState.current.direction !== currentDirection) {
                    dpadSpeedChangeState.current.startTime = now;
                    dpadSpeedChangeState.current.direction = currentDirection;
                    dpadSpeedChangeState.current.lastTick = 0; // Force immediate first tick
                }
                if (now - dpadSpeedChangeState.current.lastTick > 50) { // Update ~20 times/sec
                    const timeHeld = now - dpadSpeedChangeState.current.startTime;
                    const acceleration = Math.min(5, Math.floor(timeHeld / 500));
                    const speedChange = currentDirection * (1 + acceleration);
                    const newSpeed = Math.max(0, platform.movement.speed + speedChange);
                    handleUpdatePlatform(platform.id, { movement: { ...platform.movement, speed: newSpeed } });
                    dpadSpeedChangeState.current.lastTick = now;
                }
            } else {
                dpadSpeedChangeState.current.direction = 0;
            }
        }
    } else { // Not editing path, handle object movement and resizing
        if (selectedObjectId === null && Math.abs(rightStickY) > deadzone) {
            const scrollSpeed = 10;
            setCameraY(prevY => Math.max(0, Math.min(prevY + rightStickY * scrollSpeed, LEVEL_HEIGHT_MAX - GAME_HEIGHT)));
        } else if (rightStickActive && selectedObjectId !== null) {
            const moveSpeed = 4;
            const delta = { x: rightStickX * moveSpeed, y: rightStickY * moveSpeed };
            if (selectedObjectData?.type === 'platform') {
                setPlatforms(prev => prev.map(p => { 
                    if (p.id !== selectedObjectId) return p; 
                    const newPos = { x: p.position.x + delta.x, y: p.position.y + delta.y }; 
                    const platformDelta = { x: newPos.x - p.position.x, y: newPos.y - p.position.y }; 
                    if (platformDelta.x !== 0 || platformDelta.y !== 0) { setTraps(prevTraps => prevTraps.map(t => t.platformId === p.id ? { ...t, position: { x: t.position.x + platformDelta.x, y: t.position.y + platformDelta.y } } : t)); } 
                    const newMovement = p.movement ? { ...p.movement, path: [newPos, { x: p.movement.path[1].x + platformDelta.x, y: p.movement.path[1].y + platformDelta.y }] as [Vector2D, Vector2D] } : undefined;
                    return { ...p, position: newPos, movement: newMovement };
                }));
            } else if (selectedObjectData?.type === 'checkpoint') {
                setCheckpoints(prev => prev.map(c => c.id === selectedObjectId ? { ...c, position: { x: c.position.x + delta.x, y: c.position.y + delta.y } } : c));
            } else if (selectedObjectData?.type === 'trap') {
                setTraps(prev => prev.map(t => t.id === selectedObjectId ? { ...t, position: { x: t.position.x + delta.x, y: t.position.y + delta.y }, platformId: null } : t));
            }
        } else if (prevRightStickActive && !rightStickActive && selectedObjectId !== null) {
            // Snap on release logic
            if (selectedObjectData?.type === 'platform') { 
                setPlatforms(prev => prev.map(p => { 
                    if (p.id !== selectedObjectId) return p; 
                    const newPos = { x: snapToGrid(p.position.x), y: snapToGrid(p.position.y) }; 
                    const platformDelta = { x: newPos.x - p.position.x, y: newPos.y - p.position.y }; 
                    if (platformDelta.x !== 0 || platformDelta.y !== 0) { setTraps(prevTraps => prevTraps.map(t => t.platformId === p.id ? { ...t, position: { x: t.position.x + platformDelta.x, y: t.position.y + platformDelta.y } } : t)); } 
                    const newMovement = p.movement ? { ...p.movement, path: [newPos, { x: p.movement.path[1].x + platformDelta.x, y: p.movement.path[1].y + platformDelta.y }] as [Vector2D, Vector2D] } : undefined;
                    return { ...p, position: newPos, movement: newMovement };
                }));
            } else if (selectedObjectData?.type === 'checkpoint') { setCheckpoints(prev => prev.map(c => c.id === selectedObjectId ? { ...c, position: { x: snapToGrid(c.position.x), y: snapToGrid(c.position.y) } } : c));
            } else if (selectedObjectData?.type === 'trap') { const trap = traps.find(t => t.id === selectedObjectId); if (!trap) return; const targetPlatform = platforms.find(p => trap.position.x + trap.width / 2 > p.position.x && trap.position.x + trap.width / 2 < p.position.x + p.width && Math.abs((trap.position.y + trap.height) - p.position.y) < GRID_SIZE * 2 ) || null; setTraps(prev => prev.map(t => t.id === selectedObjectId ? { ...t, position: { x: snapToGrid(t.position.x), y: targetPlatform ? targetPlatform.position.y - t.height : snapToGrid(t.position.y) }, platformId: targetPlatform?.id ?? null } : t)); }
        }

        if (selectedObjectId !== null && (dpadLeft || dpadRight)) {
            const resizeAmount = dpadRight ? GRID_SIZE : -GRID_SIZE;
            if (selectedObjectData?.type === 'platform') { setPlatforms(prev => prev.map(p => p.id === selectedObjectId && p.width + resizeAmount >= GRID_SIZE * 2 ? { ...p, width: p.width + resizeAmount } : p));
            } else if (selectedObjectData?.type === 'trap') { setTraps(prev => prev.map(t => t.id === selectedObjectId && t.width + resizeAmount >= GRID_SIZE ? { ...t, width: t.width + resizeAmount } : t)); }
        }
    }

    // --- Discrete Actions (Single Press) ---
    if (aButtonPressed) {
        if (activeTool === 'select') setSelectedObjectId(hoveredObjectId); else handleEditorInteraction(editorCursor.pos);
    }
    if (lbPressed || rbPressed) {
        const currentIndex = EDITOR_TOOLS.indexOf(activeTool);
        const direction = rbPressed ? 1 : -1;
        setActiveTool(EDITOR_TOOLS[(currentIndex + direction + EDITOR_TOOLS.length) % EDITOR_TOOLS.length]);
    }

  }, [gamepadState, editorCursor, cameraY, activeTool, hoveredObjectId, selectedObjectId, selectedObjectData, isSidebarFocused, platforms, traps, checkpoints, isEditingPath, theme, onSetTheme, handleUpdatePlatform]);

  const gameTick = useCallback((deltaTime: number) => {
    if (mode === 'edit') {
        handleEditorGamepadInput();
        if (activeTool === 'select' && !selectedObjectId) {
            let newHoveredId: number | null = null;
            const { x, y } = editorCursor.pos;
            const allObjects: GameObject[] = [...platforms, ...checkpoints, ...traps];
            const objectsUnderCursor = allObjects.filter(obj => x >= obj.position.x && x <= obj.position.x + obj.width && y >= obj.position.y && y <= obj.position.y + obj.height).sort((a, b) => b.id - a.id);
            if (objectsUnderCursor.length > 0) newHoveredId = objectsUnderCursor[0].id;
            setHoveredObjectId(newHoveredId);
        } else {
            if (hoveredObjectId !== null) setHoveredObjectId(null);
        }
        prevGamepadState.current = gamepadState;
        return;
    }
    if (isFinished) return;

    const viewButtonPressed = gamepadState.buttons[8]?.pressed && !prevGamepadState.current.buttons[8]?.pressed;
    if (viewButtonPressed) { setShowExitConfirm(true); setExitConfirmFocusIndex(0); return; }

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
        if (newProgress >= 1) { newProgress = 1; newDirection = -1; } 
        else if (newProgress <= 0) { newProgress = 0; newDirection = 1; }
        movingPlatformState.set(p.id, { progress: newProgress, direction: newDirection });
        const newPosition = { x: path[0].x + pathVector.x * newProgress, y: path[0].y + pathVector.y * newProgress };
        platformDeltas.set(p.id, { x: newPosition.x - p.position.x, y: newPosition.y - p.position.y });
        return { ...p, position: newPosition };
    });
    const updatedTraps = traps.map(trap => {
        if (trap.platformId && platformDeltas.has(trap.platformId)) {
            const delta = platformDeltas.get(trap.platformId)!;
            return { ...trap, position: { x: trap.position.x + delta.x, y: trap.position.y + delta.y } };
        }
        return trap;
    });
    setPlatforms(updatedPlatforms);
    setTraps(updatedTraps);
    setPlayerState(prev => {
      let { position, velocity, isGrounded, lastCheckpoint } = { ...prev };
      if (prev.isGrounded && prev.groundedOnPlatformId) {
        const delta = platformDeltas.get(prev.groundedOnPlatformId);
        if (delta) { position.x += delta.x; position.y += delta.y; }
      }
      
      const deadzone = 0.2;
      const leftStickX = gamepadState.axes[0] || 0;
      
      let horizontalInput = 0;

      // Gamepad has priority
      if (Math.abs(leftStickX) > deadzone) {
          horizontalInput = leftStickX;
      } 
      // Then on-screen stick
      else if (Math.abs(onScreenControls.move) > deadzone) {
          horizontalInput = onScreenControls.move;
      }
      // Fallback to keyboard
      else {
          const isLeft = activeKeys.has('ArrowLeft');
          const isRight = activeKeys.has('ArrowRight');
          if (isLeft && !isRight) horizontalInput = -1;
          else if (isRight && !isLeft) horizontalInput = 1;
      }
      
      velocity.x = horizontalInput * PLAYER_SPEED;
      
      const jumpPressed = activeKeys.has('ArrowUp') || (gamepadState.buttons[0]?.pressed);

      if ((jumpPressed || onScreenControls.jump) && isGrounded) {
          velocity.y = JUMP_STRENGTH;
      }

      velocity.y += GRAVITY;
      const nextPosition = { x: position.x + velocity.x, y: position.y + velocity.y };
      let finalGroundedPlatform: PlatformData | null = null;
      for (const platform of updatedPlatforms) {
        if (position.y + PLAYER_HEIGHT <= platform.position.y + 1 && nextPosition.y + PLAYER_HEIGHT >= platform.position.y && velocity.y >= 0 && nextPosition.x + PLAYER_WIDTH > platform.position.x && nextPosition.x < platform.position.x + platform.width) {
          if (finalGroundedPlatform === null || platform.position.y < finalGroundedPlatform.position.y) finalGroundedPlatform = platform;
        }
      }
      let groundedOnPlatformId: number | null = null;
      if (finalGroundedPlatform) {
        velocity.y = 0;
        nextPosition.y = finalGroundedPlatform.position.y - PLAYER_HEIGHT;
        isGrounded = true;
        groundedOnPlatformId = finalGroundedPlatform.id;
      } else { isGrounded = false; }
      position = { ...nextPosition };
      if (position.x < 0) position.x = 0;
      if (position.x > GAME_WIDTH - PLAYER_WIDTH) position.x = GAME_WIDTH - PLAYER_WIDTH;
      for (const trap of updatedTraps) {
          if (position.x < trap.position.x + trap.width && position.x + PLAYER_WIDTH > trap.position.x && position.y < trap.position.y + trap.height && position.y + PLAYER_HEIGHT > trap.position.y) {
              position = { ...lastCheckpoint }; velocity = { x: 0, y: 0 }; isGrounded = false; groundedOnPlatformId = null; break;
          }
      }
      if (position.y > LEVEL_HEIGHT_MAX) { position = { ...lastCheckpoint }; velocity = { x: 0, y: 0 }; isGrounded = false; groundedOnPlatformId = null; }
      const victoryCheckpoint = checkpoints.length > 0 ? checkpoints.sort((a, b) => a.position.y - b.position.y)[0] : null;
      for (const checkpoint of checkpoints) {
        if (position.x < checkpoint.position.x + checkpoint.width && position.x + PLAYER_WIDTH > checkpoint.position.x && position.y < checkpoint.position.y + checkpoint.height && position.y + PLAYER_HEIGHT > checkpoint.position.y) {
          if (!activeCheckpoints.has(checkpoint.id)) {
            setActiveCheckpoints(prev => new Set(prev).add(checkpoint.id));
            lastCheckpoint = { x: checkpoint.position.x, y: checkpoint.position.y - PLAYER_HEIGHT };
            if (victoryCheckpoint && checkpoint.id === victoryCheckpoint.id) setIsFinished(true);
          }
        }
      }
      const playerScreenY = position.y - cameraY;
      if (playerScreenY < CAMERA_SCROLL_THRESHOLD) setCameraY(y => Math.max(0, position.y - CAMERA_SCROLL_THRESHOLD));
      else if (playerScreenY > GAME_HEIGHT - CAMERA_SCROLL_THRESHOLD/2) {
          const newCamY = Math.min(LEVEL_HEIGHT_MAX - GAME_HEIGHT, position.y - (GAME_HEIGHT - CAMERA_SCROLL_THRESHOLD/2));
          if(newCamY > cameraY) setCameraY(newCamY);
      }
      return { position, velocity, isGrounded, lastCheckpoint, isJumping: !isGrounded && velocity.y < 0, isFalling: !isGrounded && velocity.y > 0, groundedOnPlatformId };
    });
    prevGamepadState.current = gamepadState;
  }, [cameraY, activeCheckpoints, isFinished, platforms, checkpoints, traps, mode, movingPlatformState, gamepadState, handleEditorGamepadInput, editorCursor.pos, selectedObjectId, activeTool, hoveredObjectId, onScreenControls, activeKeys]);

  useGameLoop(gameTick, isFinished || showTestConfirm || showExitConfirm || (mode === 'edit' && isSidebarFocused));
  
  const handleDeleteSelected = useCallback(() => {
    if (selectedObjectId === null) return;
    const isPlatform = platforms.some(p => p.id === selectedObjectId);
    setPlatforms(prev => prev.filter(p => p.id !== selectedObjectId));
    setCheckpoints(prev => prev.filter(c => c.id !== selectedObjectId));
    setTraps(prev => prev.filter(t => t.id !== selectedObjectId && (!isPlatform || t.platformId !== selectedObjectId)));
    setSelectedObjectId(null);
  }, [platforms, selectedObjectId]);
  
  useEffect(() => {
    if (mode !== 'edit' || isSidebarFocused) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isSidebarFocused, handleDeleteSelected]);

  useEffect(() => {
    if (!isFinished) return;
    const aButtonPressed = gamepadState.buttons[0]?.pressed && !prevGamepadState.current.buttons[0]?.pressed;
    if (aButtonPressed) {
        resetGame(initialMode === 'play');
    }
    prevGamepadState.current = gamepadState;
  }, [isFinished, gamepadState, resetGame, initialMode]);

  useEffect(() => {
    if (!showTestConfirm && !showExitConfirm) return;

    const dpadLeftPressed = gamepadState.buttons[14]?.pressed && !prevGamepadState.current.buttons[14]?.pressed;
    const dpadRightPressed = gamepadState.buttons[15]?.pressed && !prevGamepadState.current.buttons[15]?.pressed;
    const aButtonPressed = gamepadState.buttons[0]?.pressed && !prevGamepadState.current.buttons[0]?.pressed;
    const bButtonPressed = gamepadState.buttons[1]?.pressed && !prevGamepadState.current.buttons[1]?.pressed;

    if (showTestConfirm) {
        if (dpadRightPressed) setConfirmFocusIndex(i => (i + 1) % 3);
        if (dpadLeftPressed) setConfirmFocusIndex(i => (i - 1 + 3) % 3);
        if (aButtonPressed) {
            if (confirmFocusIndex === 0) { handleSave(false); handleToggleMode(); }
            else if (confirmFocusIndex === 1) handleToggleMode();
            setShowTestConfirm(false);
        }
        if (bButtonPressed) setShowTestConfirm(false);
    } else if (showExitConfirm) {
        if (dpadRightPressed) setExitConfirmFocusIndex(i => (i + 1) % 2);
        if (dpadLeftPressed) setExitConfirmFocusIndex(i => (i - 1 + 2) % 2);
        if (aButtonPressed) {
            if (exitConfirmFocusIndex === 0) handleConfirmExit();
            else setShowExitConfirm(false); // Cancel
        }
        if (bButtonPressed) setShowExitConfirm(false);
    }
    prevGamepadState.current = gamepadState;
  }, [showTestConfirm, showExitConfirm, gamepadState, confirmFocusIndex, exitConfirmFocusIndex, onExit, handleToggleMode, handleSave, handleConfirmExit]);

  const handleRequestTestLevel = () => {
    setShowTestConfirm(true);
    setConfirmFocusIndex(0);
  };

  const getEventPosition = useCallback((e: React.MouseEvent | React.TouchEvent): Vector2D | null => {
    let touchToUse: React.Touch | React.MouseEvent | undefined;
  
    if ('touches' in e) {
      let relevantTouches: React.TouchList;
      if (e.type === 'touchend' || e.type === 'touchcancel') {
        relevantTouches = e.changedTouches;
      } else {
        relevantTouches = e.touches;
      }
  
      if (editorTouchId.current !== null) {
        for (let i = 0; i < relevantTouches.length; i++) {
          const touch = relevantTouches.item(i);
          if (touch.identifier === editorTouchId.current) {
            touchToUse = touch;
            break;
          }
        }
      }
      
      if (!touchToUse && e.changedTouches.length > 0) {
        touchToUse = e.changedTouches[0];
      }
  
      if (!touchToUse) return null;
    } else {
      touchToUse = e;
    }
  
    if (!gameAreaRef.current) return { x: 0, y: 0 };
    const rect = gameAreaRef.current.getBoundingClientRect();
    
    const x = (touchToUse.clientX - rect.left) / scale;
    const y = (touchToUse.clientY - rect.top) / scale;
  
    return { x, y: y + cameraY };
  }, [cameraY, scale]);
  
  const handleEditorInteractionStart = (e: React.MouseEvent | React.TouchEvent, objectId: number, type: 'platform' | 'checkpoint' | 'trap', handle?: 'left' | 'right' | 'move-path-end') => {
    e.stopPropagation();

    if ('touches' in e) {
        if (editorTouchId.current !== null || e.changedTouches.length === 0) return;
        editorTouchId.current = e.changedTouches[0].identifier;
    }
    
    const startPos = getEventPosition(e);
    if (!startPos) {
        if ('touches' in e) editorTouchId.current = null;
        return;
    }

    setActiveTool('select');
    setSelectedObjectId(objectId);
    let objectList = type === 'platform' ? platforms : type === 'checkpoint' ? checkpoints : traps;
    const originalObject = objectList.find(o => o.id === objectId);
    if (!originalObject) return;
    let attachedTrapsInfo: { trapId: number, offset: Vector2D }[] | undefined = undefined;
    if (type === 'platform' && !handle) {
        attachedTrapsInfo = traps.filter(t => t.platformId === (originalObject as PlatformData).id).map(t => ({ trapId: t.id, offset: { x: t.position.x - originalObject.position.x, y: t.position.y - originalObject.position.y } }));
    }
    const actionType = handle ? (handle === 'left' ? 'resize-left' : handle === 'right' ? 'resize-right' : handle) : 'move';
    editorAction.current = { type: actionType, objectId, startPos, originalObject, attachedTraps: attachedTrapsInfo };
  };

  const handleEditorInteractionMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) { 
        e.preventDefault(); 
        if (editorTouchId.current === null && editorAction.current) return;
    }

    const currentPos = getEventPosition(e);
    if (!currentPos) return;

    setEditorCursor({ pos: currentPos, visible: true });
    if (!editorAction.current) return;

    const { type, startPos, objectId, originalObject } = editorAction.current;
    const delta = { x: currentPos.x - startPos.x, y: currentPos.y - startPos.y };
    if (type === 'move') {
      if (platforms.some(p => p.id === objectId)) {
        const platform = originalObject as PlatformData;
        const newPos = { x: platform.position.x + delta.x, y: platform.position.y + delta.y };
        const newMovement = platform.movement ? { ...platform.movement, path: [newPos, { x: platform.movement.path[1].x + delta.x, y: platform.movement.path[1].y + delta.y }] as [Vector2D, Vector2D] } : undefined;
        setPlatforms(prev => prev.map(p => p.id === objectId ? { ...p, position: newPos, movement: newMovement } : p));
        if(editorAction.current?.attachedTraps?.length) {
            setTraps(prevTraps => {
                const nextTraps = [...prevTraps];
                for (const attached of editorAction.current!.attachedTraps!) {
                    const trapIndex = nextTraps.findIndex(t => t.id === attached.trapId);
                    if (trapIndex !== -1) nextTraps[trapIndex] = { ...nextTraps[trapIndex], position: { x: newPos.x + attached.offset.x, y: newPos.y + attached.offset.y } };
                }
                return nextTraps;
            });
        }
      } else if (checkpoints.some(c => c.id === objectId)) {
        const newPos = { x: originalObject.position.x + delta.x, y: originalObject.position.y + delta.y };
        setCheckpoints(prev => prev.map(c => c.id === objectId ? { ...c, position: newPos } : c));
      } else if (traps.some(t => t.id === objectId)) {
        const newPos = { x: originalObject.position.x + delta.x, y: originalObject.position.y + delta.y };

        const trapCenterX = newPos.x + originalObject.width / 2;
        
        const potentialPlatforms = platforms.filter(p => 
            trapCenterX >= p.position.x && 
            trapCenterX < p.position.x + p.width
        );

        let targetPlatform: PlatformData | null = null;
        let minDistance = Infinity;

        for (const p of potentialPlatforms) {
            const distance = Math.abs((newPos.y + originalObject.height) - p.position.y);
            if (distance < minDistance) {
                minDistance = distance;
                targetPlatform = p;
            }
        }
        
        if (targetPlatform && minDistance < GRID_SIZE * 3) {
            newPos.y = targetPlatform.position.y - originalObject.height;
            setTraps(prev => prev.map(t => t.id === objectId ? { ...t, position: newPos, platformId: targetPlatform!.id } : t));
        } else {
            setTraps(prev => prev.map(t => t.id === objectId ? { ...t, position: newPos, platformId: null } : t));
        }
      }
    } else if (type === 'move-path-end') {
        const platform = originalObject as PlatformData;
        if (!platform.movement) return;
        const newPathEnd = { x: platform.movement.path[1].x + delta.x, y: platform.movement.path[1].y + delta.y };
        setPlatforms(prev => prev.map(p => p.id === objectId ? { ...p, movement: { ...p.movement!, path: [p.movement!.path[0], newPathEnd] } } : p));
    } else { // Resize
      if (platforms.some(p => p.id === objectId)) {
        const platform = originalObject as PlatformData; let newX = platform.position.x; let newWidth = platform.width;
        if (type === 'resize-right') newWidth = Math.max(GRID_SIZE * 2, platform.width + delta.x);
        else if (type === 'resize-left') { const snappedDeltaX = delta.x; newX = platform.position.x + snappedDeltaX; newWidth = platform.width - snappedDeltaX; }
        if (newWidth >= GRID_SIZE * 2) setPlatforms(prev => prev.map(p => p.id === objectId ? { ...p, position: {...p.position, x: newX }, width: newWidth } : p));
      } else if (traps.some(t => t.id === objectId)) {
        const trap = originalObject as TrapData; let newX = trap.position.x; let newWidth = trap.width;
        if (type === 'resize-right') newWidth = Math.max(GRID_SIZE, trap.width + delta.x);
        else if (type === 'resize-left') { const snappedDeltaX = delta.x; newX = trap.position.x + snappedDeltaX; newWidth = trap.width - snappedDeltaX; }
        if (newWidth >= GRID_SIZE) setTraps(prev => prev.map(t => t.id === objectId ? { ...t, position: { ...t.position, x: newX }, width: newWidth } : t));
      }
    }
  }, [getEventPosition, platforms, checkpoints, traps]);

  const handleEditorInteractionEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
        if (editorTouchId.current !== null) {
            const touchEnded = Array.from(e.changedTouches).some(t => t.identifier === editorTouchId.current);
            if (!touchEnded) return; // Not our touch.
        }
    }

    if (!editorAction.current) {
        if ('touches' in e) editorTouchId.current = null;
        return;
    }

    const { type, objectId } = editorAction.current;
    
    if (type === 'move') {
        const platformToMove = platforms.find(p => p.id === objectId);
        const checkpointToMove = checkpoints.find(c => c.id === objectId);
        const trapToMove = traps.find(t => t.id === objectId);

        if (platformToMove) {
            const newPos = { x: snapToGrid(platformToMove.position.x), y: snapToGrid(platformToMove.position.y) };
            const platformDelta = { x: newPos.x - platformToMove.position.x, y: newPos.y - platformToMove.position.y };

            if (platformDelta.x !== 0 || platformDelta.y !== 0) {
                setPlatforms(prev => prev.map(p => {
                    if (p.id !== objectId) return p;
                    const newMovement = p.movement ? { ...p.movement, path: [newPos, { x: p.movement.path[1].x + platformDelta.x, y: p.movement.path[1].y + platformDelta.y }] as [Vector2D, Vector2D] } : undefined;
                    return { ...p, position: newPos, movement: newMovement };
                }));
                setTraps(prevTraps => prevTraps.map(t => {
                    if (t.platformId === objectId) {
                        return { ...t, position: { x: t.position.x + platformDelta.x, y: t.position.y + platformDelta.y } };
                    }
                    return t;
                }));
            }
        } else if (checkpointToMove) {
            setCheckpoints(prev => prev.map(c => c.id === objectId ? { ...c, position: { x: snapToGrid(c.position.x), y: snapToGrid(c.position.y) } } : c));
        } else if (trapToMove) {
            const finalX = snapToGrid(trapToMove.position.x);
            const finalCenterX = finalX + trapToMove.width / 2;
            const finalY = trapToMove.position.y;

            const targetPlatform = platforms
                .filter(p => finalCenterX >= p.position.x && finalCenterX < p.position.x + p.width && Math.abs((finalY + trapToMove.height) - p.position.y) < GRID_SIZE * 2)
                .sort((a, b) => a.position.y - b.position.y)[0] || null;
            
            setTraps(prev => prev.map(t => {
                if (t.id !== objectId) return t;
                if (targetPlatform) {
                    return { ...t, position: { x: finalX, y: targetPlatform.position.y - t.height }, platformId: targetPlatform.id };
                } else {
                    return { ...t, position: { x: finalX, y: snapToGrid(finalY) }, platformId: null };
                }
            }));
        }
    } else if (type === 'move-path-end') {
        setPlatforms(prev => prev.map(p => { if (p.id !== objectId || !p.movement) return p; return { ...p, movement: { ...p.movement, path: [p.movement.path[0], { x: snapToGrid(p.movement.path[1].x), y: snapToGrid(p.movement.path[1].y) }] } }; }));
    } else { // Resize
        if (platforms.some(p => p.id === objectId)) {
            setPlatforms(prev => prev.map(p => { if (p.id !== objectId) return p; const newWidth = snapToGrid(p.width); const widthDiff = newWidth - p.width; const newX = type === 'resize-left' ? p.position.x - widthDiff : p.position.x; return { ...p, position: { ...p.position, x: newX }, width: newWidth }; }));
        } else if (traps.some(t => t.id === objectId)) {
            setTraps(prev => prev.map(t => { if (t.id !== objectId) return t; const newWidth = snapToGrid(t.width); const widthDiff = newWidth - t.width; const newX = type === 'resize-left' ? t.position.x - widthDiff : t.position.x; return { ...t, position: { ...t.position, x: newX }, width: newWidth }; }));
        }
    }
    
    editorAction.current = null;
    if ('touches' in e) {
        editorTouchId.current = null;
    }
  }, [platforms, checkpoints, traps, snapToGrid]);
  
  const handleEditorInteraction = (pos: Vector2D) => {
    switch(activeTool) {
        case 'add-platform': handleAddObject('platform', pos); break;
        case 'add-checkpoint': handleAddObject('checkpoint', pos); break;
        case 'add-trap': handleAddObject('trap', pos); break;
        case 'select': setSelectedObjectId(null); break;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (mode !== 'edit' || isSidebarFocused) return;
    if (e.shiftKey && selectedObjectId !== null && selectedObjectData && (selectedObjectData.type === 'platform' || selectedObjectData.type === 'trap')) {
        e.preventDefault();
        const resizeAmount = e.deltaY > 0 ? -GRID_SIZE : GRID_SIZE;
        if (selectedObjectData.type === 'platform') {
            setPlatforms(prev => prev.map(p => p.id === selectedObjectId && p.width + resizeAmount >= GRID_SIZE * 2 ? { ...p, width: p.width + resizeAmount } : p));
        } else if (selectedObjectData.type === 'trap') {
            setTraps(prev => prev.map(t => t.id === selectedObjectId && t.width + resizeAmount >= GRID_SIZE ? { ...t, width: t.width + resizeAmount } : t));
        }
        return;
    }
    setCameraY(y => Math.max(0, Math.min(y + e.deltaY, LEVEL_HEIGHT_MAX - GAME_HEIGHT)));
  };

  const handleAddObject = (type: 'platform' | 'checkpoint' | 'trap', pos: Vector2D) => {
    const newId = nextId.current++;
    if (type === 'platform') {
      const [width, height] = [150, 20];
      const newPlatform: PlatformData = { id: newId, position: { x: snapToGrid(pos.x - width/2), y: snapToGrid(pos.y - height/2) }, width, height };
      setPlatforms(prev => [...prev, newPlatform]);
      setSelectedObjectId(newId);
    } else if (type === 'checkpoint') {
      const [width, height] = [40, 40];
      const newCheckpoint: CheckpointData = { id: newId, position: { x: snapToGrid(pos.x - width/2), y: snapToGrid(pos.y - height/2) }, width, height };
      setCheckpoints(prev => [...prev, newCheckpoint]);
      setSelectedObjectId(newId);
    } else if (type === 'trap') {
        const [width, height] = [80, 20];
        const snappedX = snapToGrid(pos.x - width/2);
        
        const potentialPlatforms = platforms.filter(p => 
            pos.x >= p.position.x && 
            pos.x < p.position.x + p.width
        );

        let closestPlatform: PlatformData | null = null;
        let minDistance = Infinity;
        
        for (const p of potentialPlatforms) {
            const distance = pos.y - p.position.y;
            if (distance >= 0 && distance < minDistance) {
                minDistance = distance;
                closestPlatform = p;
            }
        }
        
        const newTrap: TrapData = closestPlatform 
            ? { 
                id: newId, 
                type: 'spikes', 
                position: { x: snappedX, y: closestPlatform.position.y - height }, 
                width, height, 
                platformId: closestPlatform.id 
              }
            : { 
                id: newId, 
                type: 'spikes', 
                position: { x: snappedX, y: snapToGrid(pos.y - height/2) }, 
                width, height, 
                platformId: null 
              };

        setTraps(prev => [...prev, newTrap]);
        setSelectedObjectId(newId);
    }
    setActiveTool('select');
  };
  
  const handleExport = () => {
    const trimmedName = levelName.trim();
    if (!trimmedName) { alert("Please enter a name for the level before exporting."); return; }
    const platformsToSave = platforms.map(p => p.movement ? { ...p, position: p.movement.path[0] } : p);
    const levelToExport: LevelData = { name: trimmedName, platforms: platformsToSave, checkpoints, traps };
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(levelToExport, null, 2))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${trimmedName}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const gridPattern = useMemo(() => {
    if (mode !== 'edit') return {};
    const gridColor = theme === 'night' || theme === 'twilight' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    return { backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` };
  }, [mode, theme]);
  
  const levelContainerStyle = { height: LEVEL_HEIGHT_MAX, transform: `translateY(${-cameraY}px)`, ...gridPattern };
  const gameViewportStyle: React.CSSProperties = {
    width: GAME_WIDTH, height: GAME_HEIGHT, perspective: '1000px', cursor: (mode === 'edit' && !isSidebarFocused && !isTouchDevice) ? 'none' : 'auto',
    ...(theme === 'twilight' && { backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e3a8a, #3c5a99, #60a5fa, #a690c8, #fb923c, #fcd34d)', backgroundSize: `100% ${LEVEL_HEIGHT_MAX}px`, backgroundRepeat: 'no-repeat', backgroundPosition: `0px ${-cameraY}px`, }),
  };

  const renderEditorCursor = () => {
    if (mode !== 'edit' || !editorCursor.visible || isSidebarFocused || isTouchDevice) return null;
    let cursorElement = null;
    const ghostStyle = { opacity: 0.5 };
    switch(activeTool) {
        case 'add-platform': cursorElement = <div style={ghostStyle}><Platform id={-1} position={{x: snapToGrid(editorCursor.pos.x - 75), y: snapToGrid(editorCursor.pos.y - 10)}} width={150} height={20} isSelected={false} isEditable={false} onMouseDown={()=>{}} onTouchStart={() => {}} onResizeHandleMouseDown={()=>{}} onResizeHandleTouchStart={() => {}} isHovered={false} isTouchDevice={isTouchDevice} isBeingDragged={false} activeHandle={null}/></div>; break;
        case 'add-checkpoint': cursorElement = <div style={ghostStyle}><Checkpoint id={-1} position={{x: snapToGrid(editorCursor.pos.x - 20), y: snapToGrid(editorCursor.pos.y - 20)}} width={40} height={40} isActive={false} isSelected={false} isEditable={false} onMouseDown={()=>{}} onTouchStart={() => {}} isHovered={false} isBeingDragged={false}/></div>; break;
        case 'add-trap': cursorElement = <div style={ghostStyle}><Trap id={-1} type="spikes" position={{x: snapToGrid(editorCursor.pos.x - 40), y: snapToGrid(editorCursor.pos.y - 10)}} width={80} height={20} isSelected={false} isEditable={false} onMouseDown={()=>{}} onTouchStart={() => {}} onResizeHandleMouseDown={()=>{}} onResizeHandleTouchStart={() => {}} isHovered={false} isTouchDevice={isTouchDevice} isBeingDragged={false} activeHandle={null}/></div>; break;
        default: cursorElement = <div className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full pointer-events-none" style={{ left: editorCursor.pos.x, top: editorCursor.pos.y, zIndex: 200 }}><div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/></div>;
    }
    return <div className="absolute top-0 left-0 pointer-events-none" style={{transform: `translateY(${-cameraY}px)`, zIndex: 150}}>{cursorElement}</div>
  };
  
  const renderConfirmDialog = () => {
    if (!showTestConfirm) return null;
    const confirmButtons = ["Save & Test", "Test", "Cancel"];
    return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-white">
                <h2 className="text-2xl font-bold mb-4 text-center">Test Level</h2>
                <p className="text-gray-300 mb-6">Do you want to save your changes first?</p>
                <div className="flex justify-center items-center gap-4">
                    {confirmButtons.map((text, index) => ( <button key={text} onClick={() => { if (index === 0) { handleSave(false); handleToggleMode(); } else if (index === 1) handleToggleMode(); setShowTestConfirm(false); }} className={`px-6 py-2 rounded-lg font-bold transition-all transform hover:scale-105 ${index === confirmFocusIndex ? 'ring-2 ring-yellow-400' : ''} ${index === 0 ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`} > {text} </button> ))}
                </div>
            </div>
        </div>
    );
  };
  
  const renderExitConfirmDialog = () => {
    if (!showExitConfirm) return null;
    const isFromEditor = initialMode === 'edit';
    const title = isFromEditor ? "Stop Testing?" : "Exit Game?";
    const message = isFromEditor ? "Do you want to return to the level editor?" : "Are you sure you want to stop playing?";
    const confirmButtons = isFromEditor ? ["To Editor", "Cancel"] : ["Exit", "Cancel"];

    return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-white">
                <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-center items-center gap-4">
                    {confirmButtons.map((text, index) => ( <button key={text} onClick={() => { if (index === 0) handleConfirmExit(); else setShowExitConfirm(false); }} className={`px-6 py-2 rounded-lg font-bold transition-all transform hover:scale-105 ${index === exitConfirmFocusIndex ? 'ring-2 ring-yellow-400' : ''} ${index === 0 ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-600 hover:bg-gray-500'}`} > {text} </button> ))}
                </div>
            </div>
        </div>
    );
  };
  
  const handleGameAreaInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === e.currentTarget && mode === 'edit') {
        const pos = getEventPosition(e);
        if(pos) handleEditorInteraction(pos);
    }
  }
  
  const handleGameAreaInteractionMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      if (mode === 'edit') handleEditorInteractionMove(e);
  }, [mode, handleEditorInteractionMove]);
  
  const handleGameAreaInteractionEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      if (mode === 'edit') handleEditorInteractionEnd(e);
  }, [mode, handleEditorInteractionEnd]);

  return (
    <div className={`w-full h-full flex items-center justify-center relative ${mode === 'edit' && !isTouchDevice ? 'flex-row' : 'flex-col lg:flex-row'}`}>
      <div ref={gameContainerRef} className="flex-grow w-full h-full flex justify-center items-center p-2 lg:p-4">
        <div style={{ transform: `scale(${scale})` }}>
            <div
                className={`relative rounded-2xl shadow-2xl overflow-hidden border-8 border-gray-700 ${theme === 'twilight' ? '' : THEME_CONFIG[theme].bg}`}
                style={gameViewportStyle}
                onWheel={handleWheel}
                onMouseMove={handleGameAreaInteractionMove}
                onMouseLeave={mode === 'edit' ? () => setEditorCursor(c => ({...c, visible: false})) : undefined}
                onMouseUp={handleGameAreaInteractionEnd}
                onTouchMove={handleGameAreaInteractionMove}
                onTouchEnd={handleGameAreaInteractionEnd}
                onTouchCancel={handleGameAreaInteractionEnd}
            >
                <div 
                    ref={gameAreaRef}
                    className="absolute top-0 left-0 w-full" 
                    style={{ height: GAME_HEIGHT, transform: `scale(${1/scale})`, transformOrigin: 'top left' }}
                />
                <div 
                    className="absolute top-0 left-0 w-full" 
                    style={levelContainerStyle}
                    onMouseDown={handleGameAreaInteractionStart}
                    onTouchStart={handleGameAreaInteractionStart}
                >
                    {THEME_CONFIG[theme].scenery.map(scenery => <Scenery key={scenery.id} {...scenery} />)}
                    {platforms.map(platform => {
                        const isBeingDragged = editorAction.current?.type === 'move' && editorAction.current.objectId === platform.id;
                        let activeHandle: 'left' | 'right' | null = null;
                        if (editorAction.current?.objectId === platform.id) {
                            if (editorAction.current.type === 'resize-left') activeHandle = 'left';
                            else if (editorAction.current.type === 'resize-right') activeHandle = 'right';
                        }
                        return <Platform key={platform.id} {...platform} isSelected={mode === 'edit' && selectedObjectId === platform.id} isEditable={mode === 'edit'} onMouseDown={(e) => handleEditorInteractionStart(e, platform.id, 'platform')} onTouchStart={(e) => handleEditorInteractionStart(e, platform.id, 'platform')} onResizeHandleMouseDown={(e, dir) => handleEditorInteractionStart(e, platform.id, 'platform', dir)} onResizeHandleTouchStart={(e, dir) => handleEditorInteractionStart(e, platform.id, 'platform', dir)} isHovered={hoveredObjectId === platform.id} isTouchDevice={isTouchDevice} isBeingDragged={isBeingDragged} activeHandle={activeHandle} />
                    })}
                    {checkpoints.map(checkpoint => {
                        const isBeingDragged = editorAction.current?.type === 'move' && editorAction.current.objectId === checkpoint.id;
                        return <Checkpoint key={checkpoint.id} {...checkpoint} isActive={activeCheckpoints.has(checkpoint.id)} isSelected={mode === 'edit' && selectedObjectId === checkpoint.id} isEditable={mode === 'edit'} onMouseDown={(e) => handleEditorInteractionStart(e, checkpoint.id, 'checkpoint')} onTouchStart={(e) => handleEditorInteractionStart(e, checkpoint.id, 'checkpoint')} isHovered={hoveredObjectId === checkpoint.id} isBeingDragged={isBeingDragged}/>
                    })}
                    {traps.map(trap => {
                        const isBeingDragged = editorAction.current?.type === 'move' && editorAction.current.objectId === trap.id;
                        let activeHandle: 'left' | 'right' | null = null;
                        if (editorAction.current?.objectId === trap.id) {
                            if (editorAction.current.type === 'resize-left') activeHandle = 'left';
                            else if (editorAction.current.type === 'resize-right') activeHandle = 'right';
                        }
                        return <Trap key={trap.id} {...trap} isSelected={mode === 'edit' && selectedObjectId === trap.id} isEditable={mode === 'edit'} onMouseDown={(e) => handleEditorInteractionStart(e, trap.id, 'trap')} onTouchStart={(e) => handleEditorInteractionStart(e, trap.id, 'trap')} onResizeHandleMouseDown={(e, dir) => handleEditorInteractionStart(e, trap.id, 'trap', dir)} onResizeHandleTouchStart={(e, dir) => handleEditorInteractionStart(e, trap.id, 'trap', dir)} isHovered={hoveredObjectId === trap.id} isTouchDevice={isTouchDevice} isBeingDragged={isBeingDragged} activeHandle={activeHandle}/>
                    })}
                    {/* FIX: Renamed map parameter from 'p' to 'platform' to avoid potential scoping issues and improve readability. */}
                    {mode === 'edit' && platforms.map(platform => {
                        if (!platform.movement || (selectedObjectId !== platform.id && !(isEditingPath && selectedObjectId === platform.id))) return null;
                        const [start, end] = platform.movement.path;
                        const anchorSize = isTouchDevice ? 24 : 16;
                        const isPathAnchorDragged = editorAction.current?.type === 'move-path-end' && editorAction.current.objectId === platform.id;
                        return (
                            <React.Fragment key={`path-overlay-${platform.id}`}>
                                <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none" style={{ zIndex: 100 }}>
                                    <line x1={start.x + platform.width/2} y1={start.y + platform.height/2} x2={end.x + platform.width/2} y2={end.y + platform.height/2} stroke="rgba(255, 255, 100, 0.7)" strokeWidth="2" strokeDasharray="6,6" />
                                </svg>
                                <div className={`absolute bg-yellow-400 rounded-full border-2 border-white cursor-pointer transition-transform duration-100 ${isPathAnchorDragged ? 'scale-150' : ''}`} style={{ left: end.x + platform.width/2 - anchorSize/2, top: end.y + platform.height/2 - anchorSize/2, width: anchorSize, height: anchorSize, zIndex: 101 }} onMouseDown={(e) => handleEditorInteractionStart(e, platform.id, 'platform', 'move-path-end')} onTouchStart={(e) => handleEditorInteractionStart(e, platform.id, 'platform', 'move-path-end')} />
                            </React.Fragment>
                        )
                    })}
                    {mode === 'play' && <Player playerState={playerState} />}
                </div>
                {renderEditorCursor()}
                {renderConfirmDialog()}
                {renderExitConfirmDialog()}
                {isFinished && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center z-50">
                    <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>You Win!</h1>
                    <p className="text-lg sm:text-2xl text-white mb-8">Congratulations!</p>
                    <button onClick={() => resetGame(initialMode === 'play')} className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-lg shadow-lg hover:bg-yellow-500 transition-colors ring-2 ring-yellow-300 ring-offset-4 ring-offset-black">Play Again</button>
                </div>
                )}
            </div>
        </div>
      </div>
      
      {mode === 'play' && (
        <div style={{width: GAME_WIDTH * scale}} className={`absolute top-2 left-1/2 -translate-x-1/2 p-2 bg-gray-800 rounded-lg shadow-lg flex items-center justify-between gap-2 z-20`}>
              <button onClick={() => setShowExitConfirm(true)} className="px-3 py-2 rounded-lg transition-colors text-white text-sm bg-gray-700 hover:bg-gray-600">{'< Back'}</button>
              <h1 className="text-lg font-bold text-white hidden sm:block truncate">{levelName}</h1>
              <button onClick={handleToggleMode} className="px-3 py-2 rounded-lg transition-colors text-white text-sm bg-gray-700 hover:bg-gray-600">Edit</button>
        </div>
      )}
      
      {mode === 'play' && isTouchDevice && <OnScreenControls onChange={setOnScreenControls} />}

      {mode === 'edit' && (
        <>
            {isTouchDevice && (
              <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className={`lg:hidden fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg transition-opacity ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  aria-label="Open Editor Sidebar"
              >
                  <div className="w-6 h-6"><EditIcon/></div>
              </button>
            )}

            {isTouchDevice && isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-20" />}
            
            <div className={`
                ${isTouchDevice 
                    ? `h-full transition-transform duration-300 ease-in-out bg-gray-800 fixed top-0 right-0 w-full max-w-xs sm:w-72 z-30 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'} lg:relative lg:translate-x-0 lg:shadow-none lg:w-72 lg:h-auto lg:flex-shrink-0`
                    : 'h-full bg-gray-800 relative w-72 flex-shrink-0'
                }
            `}>
                <EditorSidebar
                    theme={theme}
                    onSetTheme={onSetTheme}
                    onDeleteSelected={handleDeleteSelected}
                    isObjectSelected={selectedObjectId !== null}
                    onSave={() => handleSave()}
                    onExport={handleExport}
                    onExit={onExit}
                    onRequestTestLevel={handleRequestTestLevel}
                    levelName={levelName}
                    onLevelNameChange={setLevelName}
                    saveStatus={saveStatus}
                    selectedObject={selectedObjectData?.type === 'platform' ? selectedObjectData : null}
                    onUpdatePlatform={handleUpdatePlatform}
                    activeTool={activeTool}
                    onSetTool={setActiveTool}
                    gamepadState={gamepadState}
                    prevGamepadState={prevGamepadState.current}
                    isSidebarFocused={isSidebarFocused}
                    onSetIsSidebarFocused={setIsSidebarFocused}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>
        </>
      )}
    </div>
  );
};