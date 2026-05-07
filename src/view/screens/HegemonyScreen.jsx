import { useState } from 'react';
import { loadGameSnapshot, readGameSaveMetadata, saveGameSnapshot } from '../../logic/engine/gamePersistence.js';
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
  const [saveMetadata, setSaveMetadata] = useState(() => readGameSaveMetadata());
  const [titleStatus, setTitleStatus] = useState(null);

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

  const handleSaveSnapshot = (snapshot) => {
    if (!snapshot) {
      return { ok: false, message: '当前没有可保存的战局。' };
    }

    const metadata = saveGameSnapshot(snapshot);
    if (!metadata) {
      return { ok: false, message: '本地存档失败，请检查浏览器存储是否可用。' };
    }

    setSuspendedSnapshot(snapshot);
    setSaveMetadata(metadata);
    setTitleStatus({ tone: 'success', message: `已保存战局：${metadata.dateLabel} · ${metadata.cityLabel}` });
    return { ok: true, message: `已保存战局：${metadata.dateLabel} · ${metadata.cityLabel}` };
  };

  const handleLoadSavedGame = () => {
    const snapshot = loadGameSnapshot();
    if (!snapshot) {
      setTitleStatus({ tone: 'error', message: '当前没有可读取的有效存档。' });
      return { ok: false, message: '当前没有可读取的有效存档。' };
    }

    setTitleStatus(null);
    setSuspendedSnapshot(snapshot);
    setSaveMetadata(readGameSaveMetadata());
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
    const result = handleSaveSnapshot(suspendedSnapshot);
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
          saveMetadata={saveMetadata}
          statusMessage={titleStatus?.message ?? null}
          statusTone={titleStatus?.tone ?? 'success'}
          onNewGame={handleStartNewGame}
          onSave={handleTitleSave}
          onLoad={handleLoadSavedGame}
        />
      ) : screenMode === 'guide' ? (
        <HegemonyOpeningScreen
          openingState={openingState}
          onBack={() => setScreenMode('title')}
          onStartHome={() => handleStartScenario('HOME')}
          onStartCouncil={() => handleStartScenario('COUNCIL')}
        />
      ) : (
        <HegemonyGame
          key={runtimeKey}
          initialSnapshot={initialSnapshot}
          onSaveGame={handleSaveSnapshot}
          onLoadSavedGame={handleLoadSavedGame}
          onReturnToTitle={handleReturnToTitle}
        />
      )}
    </>
  );
}