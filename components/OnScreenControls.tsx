import React, { useRef, useState, useCallback } from 'react';

export interface OnScreenControlsState {
    move: number; // -1 to 1 for left/right
    jump: boolean;
}

interface OnScreenControlsProps {
    onChange: (state: OnScreenControlsState) => void;
}

const JOYSTICK_BASE_SIZE = 120;
const JOYSTICK_KNOB_SIZE = 60;
const JUMP_BUTTON_SIZE = 80;
const JOYSTICK_MAX_DELTA = (JOYSTICK_BASE_SIZE - JOYSTICK_KNOB_SIZE) / 2;
const JOYSTICK_DEADZONE = 0.1;

export const OnScreenControls: React.FC<OnScreenControlsProps> = ({ onChange }) => {
    const controlsState = useRef<OnScreenControlsState>({ move: 0, jump: false });
    const joystickTouchId = useRef<number | null>(null);
    const joystickCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });

    const sendUpdate = useCallback(() => {
        onChange({ ...controlsState.current });
    }, [onChange]);

    const handleJumpPress = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        if (controlsState.current.jump) return;
        controlsState.current.jump = true;
        sendUpdate();
    };
    
    const handleJumpRelease = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        if (!controlsState.current.jump) return;
        controlsState.current.jump = false;
        sendUpdate();
    };

    const handleJoystickStart = (e: React.TouchEvent) => {
        e.preventDefault();
        if (joystickTouchId.current !== null) return;
        const touch = e.changedTouches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        joystickCenter.current = { 
            x: rect.left + rect.width / 2, 
            y: rect.top + rect.height / 2 
        };
        joystickTouchId.current = touch.identifier;
    };
    
    const handleJoystickMove = (e: React.TouchEvent) => {
        if (joystickTouchId.current === null) return;
        
        const touch = Array.from(e.touches).find(t => t.identifier === joystickTouchId.current);
        if (!touch) return;
        
        const deltaX = touch.clientX - joystickCenter.current.x;
        const deltaY = touch.clientY - joystickCenter.current.y;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        let knobX = deltaX;
        let knobY = deltaY;

        if (distance > JOYSTICK_MAX_DELTA) {
            knobX = (deltaX / distance) * JOYSTICK_MAX_DELTA;
            knobY = (deltaY / distance) * JOYSTICK_MAX_DELTA;
        }

        setKnobPosition({ x: knobX, y: knobY });

        const moveValue = knobX / JOYSTICK_MAX_DELTA;
        const newMove = Math.abs(moveValue) < JOYSTICK_DEADZONE ? 0 : Number(moveValue.toFixed(2));
        
        if (controlsState.current.move !== newMove) {
            controlsState.current.move = newMove;
            sendUpdate();
        }
    };

    const handleJoystickEnd = (e: React.TouchEvent) => {
        const touchEnded = Array.from(e.changedTouches).some(t => t.identifier === joystickTouchId.current);
        if (!touchEnded) return;

        joystickTouchId.current = null;
        setKnobPosition({ x: 0, y: 0 });
        if (controlsState.current.move !== 0) {
            controlsState.current.move = 0;
            sendUpdate();
        }
    };
    
    return (
        <>
            {/* Movement Joystick */}
            <div 
                className="fixed bottom-8 left-8 z-20 select-none"
                style={{ width: JOYSTICK_BASE_SIZE, height: JOYSTICK_BASE_SIZE }}
                onTouchStart={handleJoystickStart}
                onTouchMove={handleJoystickMove}
                onTouchEnd={handleJoystickEnd}
                onTouchCancel={handleJoystickEnd}
            >
                <div 
                    className="w-full h-full bg-gray-500 bg-opacity-40 rounded-full flex items-center justify-center"
                >
                    <div
                        className="bg-gray-400 bg-opacity-60 rounded-full"
                        style={{
                            width: JOYSTICK_KNOB_SIZE,
                            height: JOYSTICK_KNOB_SIZE,
                            transform: `translate(${knobPosition.x}px, ${knobPosition.y}px)`,
                            transition: joystickTouchId.current === null ? 'transform 0.1s ease-out' : 'none',
                        }}
                    />
                </div>
            </div>

            {/* Jump Button */}
            <div 
                className="fixed bottom-8 right-8 z-20 select-none"
                style={{ width: JUMP_BUTTON_SIZE, height: JUMP_BUTTON_SIZE }}
                onTouchStart={handleJumpPress}
                onTouchEnd={handleJumpRelease}
                onTouchCancel={handleJumpRelease}
                onMouseDown={handleJumpPress}
                onMouseUp={handleJumpRelease}
                onMouseLeave={handleJumpRelease}
            >
                <div
                    className="w-full h-full bg-pink-500 bg-opacity-40 rounded-full flex items-center justify-center text-white text-2xl font-bold active:bg-opacity-60"
                >
                    &uarr;
                </div>
            </div>
        </>
    );
};
