import React, { useState, useEffect, useRef } from 'react';
import { useGamepadInput } from '../hooks/useGamepadInput';
import { useMobileDetection } from '../hooks/useIsTouchDevice';

interface MainMenuProps {
    onPlayOriginal: () => void;
    onGoToSelect: () => void;
    onGoToEditor: () => void;
    onPlayImpossible: () => void;
}

const MenuButton: React.FC<{onClick: () => void, isFocused: boolean, children: React.ReactNode}> = ({ onClick, isFocused, children }) => (
    <button
        onClick={onClick}
        className={`w-full max-w-xs sm:w-64 px-6 py-4 bg-yellow-400 text-black font-bold text-xl rounded-lg shadow-lg hover:bg-yellow-500 transition-all transform hover:scale-105 ${isFocused ? 'ring-2 ring-yellow-300 ring-offset-4 ring-offset-gray-800' : ''}`}
    >
        {children}
    </button>
);

export const MainMenu: React.FC<MainMenuProps> = ({ onPlayOriginal, onGoToSelect, onGoToEditor, onPlayImpossible }) => {
    const [focusedIndex, setFocusedIndex] = useState(0);
    const gamepadState = useGamepadInput();
    const prevGamepadState = useRef(gamepadState);
    const lastNavTime = useRef(0);
    const mountTime = useRef(Date.now());
    const { isTouch, isIOS } = useMobileDetection();

    const handleFullScreen = () => {
        if (isIOS) {
            // This trick hides the address bar on iOS Safari by scrolling the page down slightly.
            // It requires the page to be scrollable.
            window.scrollTo(0, 1);
            return;
        }
        
        if (document.fullscreenEnabled) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            }
        } else {
            alert('Fullscreen is not supported on this device/browser.');
        }
    };

    const menuItems = [
        { label: 'Play Original Level', action: onPlayOriginal },
        { label: "Rocco's Impossible Level", action: onPlayImpossible },
        { label: 'My Levels', action: onGoToSelect },
        { label: 'Level Editor', action: onGoToEditor },
    ];

    if (isTouch) {
        menuItems.push({ label: isIOS ? 'Maximize View' : 'Go Fullscreen', action: handleFullScreen });
    }

    useEffect(() => {
        const now = Date.now();
        const navCooldown = 150; // ms to prevent rapid scrolling
        const inputGracePeriod = 200; // ms to ignore input after mount

        const dpadUp = gamepadState.buttons[12]?.pressed && !prevGamepadState.current.buttons[12]?.pressed;
        const dpadDown = gamepadState.buttons[13]?.pressed && !prevGamepadState.current.buttons[13]?.pressed;
        const aButtonPressed = gamepadState.buttons[0]?.pressed && !prevGamepadState.current.buttons[0]?.pressed;

        if (now - lastNavTime.current > navCooldown) {
            if (dpadDown) {
                setFocusedIndex(prev => (prev + 1) % menuItems.length);
                lastNavTime.current = now;
            } else if (dpadUp) {
                setFocusedIndex(prev => (prev - 1 + menuItems.length) % menuItems.length);
                lastNavTime.current = now;
            }
        }
        
        if (aButtonPressed) {
            if (now - mountTime.current > inputGracePeriod) {
                menuItems[focusedIndex].action();
            }
        }

        prevGamepadState.current = gamepadState;
    }, [gamepadState, menuItems, focusedIndex]);

    return (
        <div className="flex flex-col justify-center items-center bg-gray-800 bg-opacity-50 p-8 sm:p-12 rounded-2xl shadow-2xl mb-1">
            <h1 className="text-4xl text-center sm:text-6xl font-bold text-white mb-4" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.7)' }}>
                Kirby's Ascent
            </h1>
            <p className="text-xl sm:text-2xl text-white mb-12">Create and Play</p>
            <div className="flex flex-col gap-6 w-full items-center">
                {menuItems.map((item, index) => (
                    <MenuButton key={item.label} onClick={item.action} isFocused={focusedIndex === index}>
                        {item.label}
                    </MenuButton>
                ))}
            </div>
        </div>
    );
};