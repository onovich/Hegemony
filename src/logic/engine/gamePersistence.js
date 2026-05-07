export const SAVE_SLOT_DEFINITIONS = [
    { id: 'slot-1', label: '槽位一' },
    { id: 'slot-2', label: '槽位二' },
    { id: 'slot-3', label: '槽位三' },
];

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

const buildStorageKey = (slotId) => `hegemony-save-${slotId}`;

const isValidSnapshot = (snapshot) => (
    snapshot !== null &&
    typeof snapshot === 'object' &&
    REQUIRED_SNAPSHOT_FIELDS.every(field => field in snapshot)
);

const buildEmptySlotMetadata = (slot) => ({
    slotId: slot.id,
    slotLabel: slot.label,
    hasData: false,
    savedAt: null,
    dateLabel: '空存档',
    cityLabel: '尚未保存',
});

const buildSaveMetadata = (slot, snapshot, savedAt) => ({
    slotId: slot.id,
    slotLabel: slot.label,
    hasData: true,
    savedAt,
    dateLabel: snapshot?.date ? `公元 ${snapshot.date.year} 年 ${snapshot.date.month} 月` : '未知时间',
    cityLabel: snapshot?.cities?.[snapshot?.activeCityId]?.name ?? '未知城池',
});

const resolveSlot = (slotId) => SAVE_SLOT_DEFINITIONS.find(slot => slot.id === slotId) ?? SAVE_SLOT_DEFINITIONS[0];

export function saveGameSnapshot(snapshot, slotId = SAVE_SLOT_DEFINITIONS[0].id) {
    if (!canUseStorage() || !isValidSnapshot(snapshot)) {
        return null;
    }

    const slot = resolveSlot(slotId);
    const savedAt = new Date().toISOString();
    const payload = {
        savedAt,
        snapshot: cloneSnapshot(snapshot),
    };

    window.localStorage.setItem(buildStorageKey(slot.id), JSON.stringify(payload));
    return buildSaveMetadata(slot, payload.snapshot, savedAt);
}

export function loadGameSnapshot(slotId = SAVE_SLOT_DEFINITIONS[0].id) {
    if (!canUseStorage()) {
        return null;
    }

    const slot = resolveSlot(slotId);
    const rawPayload = window.localStorage.getItem(buildStorageKey(slot.id));
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

export function readGameSaveMetadata(slotId = SAVE_SLOT_DEFINITIONS[0].id) {
    const slot = resolveSlot(slotId);
    if (!canUseStorage()) {
        return buildEmptySlotMetadata(slot);
    }

    const rawPayload = window.localStorage.getItem(buildStorageKey(slot.id));
    if (!rawPayload) {
        return buildEmptySlotMetadata(slot);
    }

    try {
        const payload = JSON.parse(rawPayload);
        if (!isValidSnapshot(payload?.snapshot)) {
            return buildEmptySlotMetadata(slot);
        }

        return buildSaveMetadata(slot, payload.snapshot, payload.savedAt ?? null);
    } catch {
        return buildEmptySlotMetadata(slot);
    }
}

export function readAllGameSaveMetadata() {
    return SAVE_SLOT_DEFINITIONS.map(slot => readGameSaveMetadata(slot.id));
}