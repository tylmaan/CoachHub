import { useCallback, useState } from 'react';

const MAX_HISTORY = 100;

interface History<T> {
    past: T[];
    present: T;
    future: T[];
}

export function useHistory<T>(initial: T) {
    const [history, setHistory] = useState<History<T>>({ 
        past: [], 
        present: initial, 
        future: [] 
    });

    const commit = useCallback((next: T) => {
        setHistory((h) => ({
            past: [...h.past, h.present].slice(-MAX_HISTORY),
            present: next,
            future: []
        }));
    }, []);

    const undo = useCallback(() => {
        setHistory((h) => {
            if (h.past.length === 0) return h;
            return { 
                past: h.past.slice(0, -1),
                present: h.past[h.past.length - 1],
                future: [h.present, ...h.future]
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory((h) => {
            if (h.future.length === 0) return h;
            return { 
                past: [...h.past, h.present],
                present: h.future[0],
                future: h.future.slice(1)
            };
        });
    }, []);

    return {
        present: history.present,
        commit,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0
    };
}