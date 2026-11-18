import { useCallback, useEffect, useRef, useState } from "react";

const SAVE_DELAY = 800;

export type SaveStatus = "saved" | "pending" | "saving" | "error";

export function useAutosave<T>(value: T, save: (value: T) => Promise<void>, enabled: boolean) {
    const key = JSON.stringify(value);
    const [savedKey, setSavedKey] = useState(key);
    const [failedKey, setFailedKey] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const latest = useRef({ value, save });

    useEffect(() => {
        latest.current = { value, save };
    });

    const dirty = key !== savedKey;
    const failed = failedKey === key;

    const persist = useCallback(async () => {
        const { value: current, save: doSave } = latest.current;
        const currentKey = JSON.stringify(current);
        setSaving(true);
        try {
            await doSave(current);
            setSavedKey(currentKey);
            setFailedKey(null);
            return true;
        } catch {
            setFailedKey(currentKey);
            return false;
        } finally {
            setSaving(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled || !dirty || saving || failed) return;
        const timer = setTimeout(persist, SAVE_DELAY);
        return () => clearTimeout(timer);
    }, [enabled, dirty, saving, failed, key, persist]);
    
    async function flush() {
        if (saving) return false;
        if (!enabled || !dirty) return true;
        return persist();
    }

    const status: SaveStatus = failed ? "error" : saving ? "saving" : dirty ? "pending" : "saved";

    return { status, flush, retry: persist };
}