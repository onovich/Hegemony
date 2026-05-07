import { useState } from 'react';
import { loadGameSnapshot, readAllGameSaveMetadata, saveGameSnapshot } from '../../logic/engine/gamePersistence.js';
import { INITIAL_CITIES, INITIAL_DATE, INITIAL_OFFICERS, INITIAL_RESOURCES } from '../../data/gameConfig.js';
import { getCityRoleLabel } from '../../logic/engine/gameBalance.js';
import ScreenMountNote from '../components/ScreenMountNote.jsx';
import HegemonyOpeningScreen from '../components/HegemonyOpeningScreen.jsx';
import HegemonyTitleScreen from '../components/HegemonyTitleScreen.jsx';
import HegemonyGame from './HegemonyGame.jsx';
import { useArchitectureStatus } from '../../logic/hooks/useArchitectureStatus.js';

const createRuntimeKey = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const openingCity = INITIAL_CITIES.luoyang;
const openingRuler = INITIAL_OFFICERS.find(officer => officer.id === 'player_ruler');

export default function HegemonyScreen() {
  useArchitectureStatus();
  const [screenMode, setScreenMode] = useState('title');
  const [runtimeKey, setRuntimeKey] = useState(createRuntimeKey);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [suspendedSnapshot, setSuspendedSnapshot] = useState(null);
  const [saveSlots, setSaveSlots] = useState(() => readAllGameSaveMetadata());
  const [titleStatus, setTitleStatus] = useState(null);

  const refreshSaveSlots = () => setSaveSlots(readAllGameSaveMetadata());

  const openingState = {
    date: INITIAL_DATE,
    rulerName: openingRuler?.name ?? '主公(您)',
    resources: INITIAL_RESOURCES,
    totalTroops: openingCity?.troops ?? 3600,
    city: {
      name: openingCity?.name ?? '洛阳',
      specialty: openingCity?.specialty ?? '帝都中枢',
      purposeLabel: getCityRoleLabel(openingCity ?? { role: 'capital' }),
    },
  };

  const refreshRuntime = (nextSnapshot, nextTab = null) => {
    const runtimeSnapshot = nextSnapshot
      ? {
          ...nextSnapshot,
          activeTab: nextTab ?? nextSnapshot.activeTab,
        }
      : nextTab
        ? { activeTab: nextTab }
        : null;

    setInitialSnapshot(runtimeSnapshot);
    setRuntimeKey(createRuntimeKey());
    setScreenMode('game');
  };

  const handleStartNewGame = () => {
    setTitleStatus(null);
    setScreenMode('guide');
  };

  const handleStartScenario = (nextTab = 'HOME') => {
    setTitleStatus(null);
    refreshRuntime(null, nextTab);
  };

  const handleSaveSnapshot = (snapshot, slotId) => {
    if (!snapshot) {
      return { ok: false, message: '当前没有可保存的战局。' };
    }

    const metadata = saveGameSnapshot(snapshot, slotId);
    if (!metadata) {
      return { ok: false, message: '本地存档失败，请检查浏览器存储是否可用。' };
    }

    setSuspendedSnapshot(snapshot);
    refreshSaveSlots();
    setTitleStatus({ tone: 'success', message: `已保存至${metadata.slotLabel}：${metadata.dateLabel} · ${metadata.cityLabel}` });
    return { ok: true, message: `已保存至${metadata.slotLabel}：${metadata.dateLabel} · ${metadata.cityLabel}` };
  };

  const handleLoadSavedGame = (slotId) => {
    const snapshot = loadGameSnapshot(slotId);
    if (!snapshot) {
      setTitleStatus({ tone: 'error', message: '当前没有可读取的有效存档。' });
      return { ok: false, message: '当前没有可读取的有效存档。' };
    }

    setTitleStatus(null);
    setSuspendedSnapshot(snapshot);
    refreshSaveSlots();
    refreshRuntime(snapshot);
    return { ok: true, message: '已读取本地存档。' };
  };

  const handleReturnToTitle = (snapshot) => {
    setSuspendedSnapshot(snapshot ?? null);
    setTitleStatus(null);
    setScreenMode('title');
    return { ok: true };
  };

  const handleTitleSave = () => {
    const defaultSlot = saveSlots[0]?.slotId;
    const result = handleSaveSnapshot(suspendedSnapshot, defaultSlot);
    if (!result.ok) {
      setTitleStatus({ tone: 'error', message: result.message });
    }
  };

  return (
    <>
      <ScreenMountNote />
      {screenMode === 'title' ? (
        <HegemonyTitleScreen
          hasSuspendedGame={Boolean(suspendedSnapshot)}
          saveSlots={saveSlots}
          statusMessage={titleStatus?.message ?? null}
          statusTone={titleStatus?.tone ?? 'success'}
          onNewGame={handleStartNewGame}
          onSave={slotId => handleSaveSnapshot(suspendedSnapshot, slotId)}
          onLoad={handleLoadSavedGame}
        />
      ) : screenMode === 'guide' ? (
        <HegemonyOpeningScreen
          openingState={openingState}
          onBack={() => setScreenMode('title')}
          onStart={() => handleStartScenario('HOME')}
        />
      ) : (
        <HegemonyGame
          key={runtimeKey}
          initialSnapshot={initialSnapshot}
          saveSlots={saveSlots}
          onSaveGame={handleSaveSnapshot}
          onLoadSavedGame={handleLoadSavedGame}
          onReturnToTitle={handleReturnToTitle}
        />
      )}
    </>
  );
}