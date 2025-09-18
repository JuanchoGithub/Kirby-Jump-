import { useState, useEffect, useRef, useCallback } from 'react';

export interface GamepadState {
  axes: readonly number[];
  buttons: readonly GamepadButton[];
}

const defaultState: GamepadState = {
  axes: [0, 0, 0, 0],
  buttons: [],
};

export const useGamepadInput = (): GamepadState => {
  const [gamepadState, setGamepadState] = useState<GamepadState>(defaultState);
  // FIX: Explicitly initialize useRef with `undefined` to resolve error about missing argument. The type must also be updated to allow `undefined`.
  const animationFrameRef = useRef<number | undefined>(undefined);
  const gamepadIndexRef = useRef<number | null>(null);

  const pollGamepad = useCallback(() => {
    if (gamepadIndexRef.current === null) {
      // If we're not tracking a gamepad, ensure state is default
      if (gamepadState.axes[0] !== 0 || gamepadState.buttons.length > 0) {
        setGamepadState(defaultState);
      }
      animationFrameRef.current = requestAnimationFrame(pollGamepad);
      return;
    }

    const gamepads = navigator.getGamepads();
    const gp = gamepads[gamepadIndexRef.current];

    if (gp) {
      setGamepadState({
        axes: gp.axes,
        buttons: gp.buttons,
      });
    } else {
        // Gamepad might have been disconnected without an event
        gamepadIndexRef.current = null;
        setGamepadState(defaultState);
    }
    
    animationFrameRef.current = requestAnimationFrame(pollGamepad);
  }, [gamepadState]);

  useEffect(() => {
    const handleGamepadConnected = (event: GamepadEvent) => {
        if (gamepadIndexRef.current === null) {
            gamepadIndexRef.current = event.gamepad.index;
        }
    };

    const handleGamepadDisconnected = (event: GamepadEvent) => {
        if (gamepadIndexRef.current === event.gamepad.index) {
            gamepadIndexRef.current = null;
        }
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Check if a gamepad is already connected
    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (gp) {
        gamepadIndexRef.current = gp.index;
        break;
      }
    }

    animationFrameRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [pollGamepad]);

  return gamepadState;
};
