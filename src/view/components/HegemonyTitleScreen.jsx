import { FolderOpen, Play, Save, Sword } from 'lucide-react';

const TITLE_ACTIONS = [
    {
        id: 'new',
        title: '新游戏',
        description: '开始新的乱世征程',
        tone: 'primary',
        icon: Play,
    },
    {
        id: 'save',
        title: '存档',
        description: '保存当前挂起的战局进度',
        tone: 'neutral',
        icon: Save,
    },
    {
        id: 'load',
        title: '读档',
        description: '载入本地最新单槽存档',
        tone: 'neutral',
        icon: FolderOpen,
    },
];

export default function HegemonyTitleScreen({
    hasSuspendedGame,
    saveMetadata,
    statusMessage,
    statusTone,
    onNewGame,
    onSave,
    onLoad,
}) {
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

    const renderActionButton = (action) => {
        const Icon = action.icon;
        const isEnabled = actionAvailability[action.id];
        const baseClassName = action.tone === 'primary'
            ? 'border-amber-700/40 bg-amber-900/25 hover:border-amber-500/60 hover:bg-amber-900/40'
            : 'border-slate-700 bg-slate-950/60 hover:border-amber-700/50 hover:bg-slate-900/80';
        const disabledClassName = 'cursor-not-allowed border-slate-800 bg-slate-950/40 opacity-50';

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
                <Icon className="h-5 w-5 text-amber-300" />
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-4 text-amber-50 sm:px-6 sm:py-6 lg:px-8" style={{ backgroundImage: 'radial-gradient(circle at top, rgba(120,53,15,0.28), rgba(2,6,23,0.96) 58%), linear-gradient(145deg, #020617, #0f172a 48%, #111827)' }}>
            <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl flex-col items-center justify-center gap-6 lg:min-h-[calc(100vh-4rem)]">
                <section className="w-full rounded-[2rem] border border-amber-900/30 bg-slate-950/70 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-sm sm:p-10 lg:p-12">
                    <div className="inline-flex items-center gap-3 rounded-full border border-amber-800/30 bg-amber-950/30 px-4 py-2 text-xs tracking-[0.28em] text-amber-300 sm:text-sm">
                        <Sword className="h-4 w-4" />
                        三国群雄
                    </div>
                    <h1 className="mt-6 text-4xl font-bold tracking-[0.3em] text-amber-400 sm:text-5xl lg:text-6xl">霸业</h1>
                    <p className="mt-3 text-xs tracking-[0.24em] text-slate-500">HEGEMONY OF THE LATE HAN</p>
                </section>

                <aside className="w-full rounded-[2rem] border border-amber-900/30 bg-slate-900/80 p-5 shadow-2xl shadow-black/50 backdrop-blur-sm sm:p-6 lg:p-8">
                    <div className="space-y-3">
                        {TITLE_ACTIONS.map(action => renderActionButton(action))}
                    </div>

                    {statusMessage ? (
                        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${statusClassName}`}>
                            {statusMessage}
                        </div>
                    ) : null}
                </aside>
            </div>
        </div>
    );
}