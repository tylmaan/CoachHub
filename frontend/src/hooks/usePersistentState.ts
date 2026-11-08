import { useState } from "react";

export function usePersistentState<T>(key: string, initial: T) {
    const [value, setValue] = useState<T>(() => {
        try {
            const stored = sessionStorage.getItem(key);
            return stored === null ? initial : (JSON.parse(stored) as T);
        } catch {
            return initial;
        }
    });

    function setPersistent(next: T) {
        setValue(next);
        try {
            sessionStorage.setItem(key, JSON.stringify(next));
        } catch {
            // ignore
        }
    }

    return [value, setPersistent] as const;
}