const SAVE_STORAGE_KEY = 'hegemony-save-slot-1';

const REQUIRED_SNAPSHOT_FIELDS = [
    'date',
    'ap',
    'resources',
    'cities',
    'factions',
    'officers',
    'inventory',
    'logs',
    'activeTab',
    'activeCityId',
];

const cloneSnapshot = (value) => JSON.parse(JSON.stringify(value));

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const isValidSnapshot = (snapshot) => (
    snapshot !== null &&
    typeof snapshot === 'object' &&
    REQUIRED_SNAPSHOT_FIELDS.every(field => field in snapshot)
);

const buildSaveMetadata = (snapshot, savedAt) => ({
    savedAt,
    dateLabel: snapshot?.date ? `公元 ${snapshot.date.year} 年 ${snapshot.date.month} 月` : '未知时间',
    cityLabel: snapshot?.cities?.[snapshot?.activeCityId]?.name ?? '未知城池',
});

export function saveGameSnapshot(snapshot) {
    if (!canUseStorage() || !isValidSnapshot(snapshot)) {
        return null;
    }

    const savedAt = new Date().toISOString();
    const payload = {
        savedAt,
        snapshot: cloneSnapshot(snapshot),
    };

    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    return buildSaveMetadata(payload.snapshot, savedAt);
}

export function loadGameSnapshot() {
    if (!canUseStorage()) {
        return null;
    }

    const rawPayload = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!rawPayload) {
        return null;
    }

    try {
        const payload = JSON.parse(rawPayload);
        if (!isValidSnapshot(payload?.snapshot)) {
            return null;
        }

        return cloneSnapshot(payload.snapshot);
    } catch {
        return null;
    }
}

export function readGameSaveMetadata() {
    if (!canUseStorage()) {
        return null;
    }

    const rawPayload = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!rawPayload) {
        return null;
    }

    try {
        const payload = JSON.parse(rawPayload);
        if (!isValidSnapshot(payload?.snapshot)) {
            return null;
        }

        return buildSaveMetadata(payload.snapshot, payload.savedAt ?? null);
    } catch {
        return null;
    }
}