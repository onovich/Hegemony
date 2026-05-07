import { useEffect, useState } from 'react';
import { FolderOpen, Play, Save, Sword } from 'lucide-react';

const TITLE_ACTIONS = [
    {
        id: 'new',
        title: '新游戏',
        description: '开启新的 190 年洛阳战局',
        shortcut: '1',
        tone: 'primary',
        icon: Play,
    },
    {
        id: 'save',
        title: '存档',
        description: '保存当前挂起的战局进度',
        shortcut: '2',
        tone: 'neutral',
        icon: Save,
    },
    {
        id: 'load',
        title: '读档',
        description: '载入本地最新单槽存档',
        shortcut: '3',
        tone: 'neutral',
        icon: FolderOpen,
    },
];

const formatSavedAt = (savedAt) => {
    if (!savedAt) {
        return '尚无存档记录';
    }

    const parsed = new Date(savedAt);
    if (Number.isNaN(parsed.getTime())) {
        return '存档时间未知';
    }

    return parsed.toLocaleString('zh-CN', {
        hour12: false,
    });
};

export default function HegemonyTitleScreen({
    hasSuspendedGame,
    saveMetadata,
    statusMessage,
    statusTone,
    onNewGame,
    onSave,
    onLoad,
}) {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const syncViewport = (event) => setIsDesktop(event.matches);

        setIsDesktop(mediaQuery.matches);

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', syncViewport);
            return () => mediaQuery.removeEventListener('change', syncViewport);
        }

        mediaQuery.addListener(syncViewport);
        return () => mediaQuery.removeListener(syncViewport);
    }, []);

    useEffect(() => {
        if (!isDesktop) {
            return undefined;
        }

        const handleKeydown = (event) => {
            const target = event.target;
            const isEditable = target instanceof HTMLElement && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable
            );

            if (isEditable || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }

            if (event.key === '1') {
                event.preventDefault();
                onNewGame();
                return;
            }

            if (event.key === '2' && hasSuspendedGame) {
                event.preventDefault();
                onSave();
                return;
            }

            if (event.key === '3' && saveMetadata) {
                event.preventDefault();
                onLoad();
            }
        };

        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [isDesktop, hasSuspendedGame, saveMetadata, onNewGame, onSave, onLoad]);

    const statusClassName = statusTone === 'error'
        ? 'border-red-900/50 bg-red-950/40 text-red-200'
        : 'border-emerald-900/40 bg-emerald-950/30 text-emerald-100';

    const actionHandlers = {
        new: onNewGame,
        save: onSave,
        load: onLoad,
    };

    const actionAvailability = {
        new: true,
        save: hasSuspendedGame,
        load: Boolean(saveMetadata),
    };

    const renderActionButton = (action, compact = false) => {
        const Icon = action.icon;
        const isEnabled = actionAvailability[action.id];
        const baseClassName = action.tone === 'primary'
            ? 'border-amber-700/40 bg-amber-900/25 hover:border-amber-500/60 hover:bg-amber-900/40'
            : 'border-slate-700 bg-slate-950/60 hover:border-amber-700/50 hover:bg-slate-900/80';
        const disabledClassName = 'cursor-not-allowed border-slate-800 bg-slate-950/40 opacity-50';

        if (compact) {
            return (
                <button
                    key={action.id}
                    type="button"
                    onClick={actionHandlers[action.id]}
                    disabled={!isEnabled}
                    className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center transition ${isEnabled ? baseClassName : disabledClassName}`}
                >
                    <Icon className="h-5 w-5 text-amber-300" />
                    <span className="text-sm font-bold text-amber-100">{action.title}</span>
                    <span className="text-[11px] text-slate-400">{action.shortcut}</span>
                </button>
            );
        }

        return (
            <button
                key={action.id}
                type="button"
                onClick={actionHandlers[action.id]}
                disabled={!isEnabled}
                className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition ${isEnabled ? baseClassName : disabledClassName}`}
            >
                <span>
                    <span className="block text-lg font-bold text-amber-100">{action.title}</span>
                    <span className="mt-1 block text-sm text-slate-400">{action.description}</span>
                </span>
                <span className="flex items-center gap-3">
                    {isDesktop ? (
                        <span className="rounded-full border border-amber-800/30 bg-black/20 px-2 py-1 text-xs font-bold text-amber-300">
                            {action.shortcut}
                        </span>
                    ) : null}
                    <Icon className="h-5 w-5 text-amber-300" />
                </span>
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-4 pb-28 text-amber-50 sm:px-6 sm:py-6 lg:px-8 lg:pb-8" style={{ backgroundImage: 'radial-gradient(circle at top, rgba(120,53,15,0.28), rgba(2,6,23,0.96) 58%), linear-gradient(145deg, #020617, #0f172a 48%, #111827)' }}>
            <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl flex-col justify-center gap-5 lg:min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-[1.1fr,0.9fr] lg:gap-8">
                <section className="rounded-[2rem] border border-amber-900/30 bg-slate-950/70 p-6 shadow-2xl shadow-black/50 backdrop-blur-sm sm:p-8 lg:p-10">
                    <div className="inline-flex items-center gap-3 rounded-full border border-amber-800/30 bg-amber-950/30 px-4 py-2 text-xs tracking-[0.28em] text-amber-300 sm:text-sm">
                        <Sword className="h-4 w-4" />
                        三国群雄
                    </div>
                    <h1 className="mt-6 text-4xl font-bold tracking-[0.3em] text-amber-400 sm:text-5xl lg:text-6xl">霸业</h1>
                    <p className="mt-3 text-xs tracking-[0.24em] text-slate-500">HEGEMONY OF THE LATE HAN</p>
                    <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                        从洛阳残局起步，经营城池、调度武将、周旋诸侯，逐步把一座孤城推向真正的霸业基础。
                    </p>
                    <div className="mt-6 rounded-2xl border border-amber-900/20 bg-black/20 p-4 text-sm text-slate-300">
                        <div className="text-xs tracking-[0.2em] text-slate-500">当前模式</div>
                        <div className="mt-2 font-bold text-amber-100">标题页只保留核心入口；新游戏后的背景与目标说明会在下一页展示。</div>
                    </div>
                    <div className="mt-4 hidden rounded-2xl border border-amber-900/20 bg-black/20 p-4 text-sm text-slate-300 lg:block">
                        <div className="text-xs tracking-[0.2em] text-slate-500">桌面快捷键</div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {TITLE_ACTIONS.map(action => (
                                <div key={action.id} className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3 text-center">
                                    <div className="text-lg font-bold text-amber-300">{action.shortcut}</div>
                                    <div className="mt-1 text-xs text-slate-400">{action.title}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <aside className="w-full rounded-[2rem] border border-amber-900/30 bg-slate-900/80 p-5 shadow-2xl shadow-black/50 backdrop-blur-sm sm:p-6 lg:p-8">
                    <div className="text-xs tracking-[0.25em] text-slate-500">标题页</div>
                    <div className="mt-2 text-xl font-bold tracking-[0.18em] text-amber-300 sm:text-2xl">开始选择</div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">新游戏、存档、读档。移动端保留底部快捷入口，桌面端支持 1 / 2 / 3。</p>

                    <div className="mt-6 hidden space-y-3 lg:block">
                        {TITLE_ACTIONS.map(action => renderActionButton(action))}
                    </div>

                    <div className="mt-6 rounded-2xl border border-amber-900/20 bg-black/20 p-4 text-sm text-slate-300">
                        <div className="text-xs tracking-[0.2em] text-slate-500">存档状态</div>
                        <div className="mt-3 space-y-2">
                            <div>标题页可存档：{hasSuspendedGame ? '有挂起战局' : '暂无挂起战局'}</div>
                            <div>最近存档：{saveMetadata ? formatSavedAt(saveMetadata.savedAt) : '暂无'}</div>
                            <div>存档位置：{saveMetadata ? `${saveMetadata.dateLabel} · ${saveMetadata.cityLabel}` : '尚未建立'}</div>
                        </div>
                    </div>

                    {statusMessage ? (
                        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${statusClassName}`}>
                            {statusMessage}
                        </div>
                    ) : null}
                </aside>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-amber-900/20 bg-slate-950/95 px-3 pt-3 backdrop-blur lg:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
                <div className="mx-auto max-w-6xl">
                    <div className="mb-2 flex items-center justify-between px-1 text-[11px] tracking-[0.2em] text-slate-500">
                        <span>移动端快捷入口</span>
                        <span>拇指区操作</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {TITLE_ACTIONS.map(action => renderActionButton(action, true))}
                    </div>
                </div>
            </div>
        </div>
    );
}