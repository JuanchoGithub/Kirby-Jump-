import { LevelData } from '../types';

const STORAGE_KEY = 'kirby-ascent-levels';

export const getLevels = (): LevelData[] => {
    try {
        const levelsJson = localStorage.getItem(STORAGE_KEY);
        if (levelsJson) {
            return JSON.parse(levelsJson);
        }
    } catch (error) {
        console.error("Could not parse levels from localStorage", error);
    }
    return [];
};

export const saveLevel = (levelToSave: LevelData): void => {
    const levels = getLevels();
    const existingLevelIndex = levels.findIndex(level => level.name === levelToSave.name);

    if (existingLevelIndex > -1) {
        // Update existing level
        levels[existingLevelIndex] = levelToSave;
    } else {
        // Add new level
        levels.push(levelToSave);
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
    } catch (error) {
        console.error("Could not save levels to localStorage", error);
    }
};

export const deleteLevel = (levelName: string): void => {
    let levels = getLevels();
    levels = levels.filter(level => level.name !== levelName);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
    } catch (error) {
        console.error("Could not save levels to localStorage after deletion", error);
    }
};
