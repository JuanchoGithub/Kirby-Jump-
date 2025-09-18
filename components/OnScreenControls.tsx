import React, { useRef } from 'react';

export interface OnScreenControlsState {
    left: boolean;
    right: boolean;
    jump: boolean;
}

interface OnScreenControlsProps {
    onChange: (state: OnScreenControlsState) => void;
}

const ControlButton: React.FC<{
    onTouchStart: () => void,
    onTouchEnd: () => void,
    children: React.ReactNode,
    className?: string,
}> = ({ onTouchStart, onTouchEnd, children, className }) => {
    return (
        <div
            className={`w-16 h-16 sm:w-20 sm:h-20 bg-gray-500 bg-opacity-40 rounded-full flex items-center justify-center text-white text-2xl font-bold select-none active:bg-opacity-60 ${className}`}
            onTouchStart={(e) => { e.preventDefault(); onTouchStart(); }}
            onTouchEnd={(e) => { e.preventDefault(); onTouchEnd(); }}
            onMouseDown={(e) => { e.preventDefault(); onTouchStart(); }}
            onMouseUp={(e) => { e.preventDefault(); onTouchEnd(); }}
            onMouseLeave={(e) => { e.preventDefault(); onTouchEnd(); }}
        >
            {children}
        </div>
    )
}

export const OnScreenControls: React.FC<OnScreenControlsProps> = ({ onChange }) => {
    const controlsState = useRef<OnScreenControlsState>({ left: false, right: false, jump: false });

    const handleControlChange = (key: keyof OnScreenControlsState, value: boolean) => {
        controlsState.current[key] = value;
        onChange({ ...controlsState.current });
    };

    return (
        <>
            {/* Movement Controls */}
            <div className="fixed bottom-8 left-8 z-20 flex gap-4">
                <ControlButton
                    onTouchStart={() => handleControlChange('left', true)}
                    onTouchEnd={() => handleControlChange('left', false)}
                >
                    &larr;
                </ControlButton>
                <ControlButton
                    onTouchStart={() => handleControlChange('right', true)}
                    onTouchEnd={() => handleControlChange('right', false)}
                >
                    &rarr;
                </ControlButton>
            </div>

            {/* Action Control */}
            <div className="fixed bottom-8 right-8 z-20">
                <ControlButton
                    onTouchStart={() => handleControlChange('jump', true)}
                    onTouchEnd={() => handleControlChange('jump', false)}
                    className="bg-pink-500 bg-opacity-40"
                >
                    &uarr;
                </ControlButton>
            </div>
        </>
    );
};
