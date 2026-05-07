import { ArrowLeft, Scroll, Sword, Warehouse } from 'lucide-react';

const OPENING_FOCUS = [
    {
        title: '守住洛阳',
        description: '先稳住粮金、士气与城防，避免首月被周边乱局拖垮。',
    },
    {
        title: '补齐人手',
        description: '尽快让城里有足够的太守、主将与驻守武将，别让孤城空转。',
    },
    {
        title: '看清敌友',
        description: '先判断谁值得停战或结好，再决定第一刀向哪座城挥下。',
    },
];

export default function HegemonyOpeningScreen({
    openingState,
    onBack,
    onStart,
}) {
    const date = openingState?.date ?? { year: 190, month: 1 };
    const city = openingState?.city ?? { name: '洛阳', specialty: '帝都中枢', purposeLabel: '都城' };
    const rulerName = openingState?.rulerName ?? '主公';
    const resources = openingState?.resources ?? { gold: 2500, food: 14000 };
    const totalTroops = openingState?.totalTroops ?? 3600;

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-4 pb-24 text-amber-50 sm:px-6 sm:py-6 lg:px-8 lg:pb-8" style={{ backgroundImage: 'radial-gradient(circle at top, rgba(120,53,15,0.22), rgba(2,6,23,0.96) 56%), linear-gradient(160deg, #020617, #0f172a 46%, #111827)' }}>
            <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col gap-5 lg:min-h-[calc(100vh-4rem)] lg:justify-center lg:gap-8">
                <header className="rounded-[2rem] border border-amber-900/30 bg-slate-950/75 p-6 shadow-2xl shadow-black/50 backdrop-blur sm:p-8 lg:p-10">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="text-xs tracking-[0.3em] text-amber-300/80">公元 {date.year} 年 {date.month} 月 · 新游戏引导</div>
                            <h1 className="mt-3 text-3xl font-bold tracking-[0.18em] text-amber-100 sm:text-4xl lg:text-5xl">洛阳残局</h1>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                                董卓西迁之后，帝都只剩残垣与流民。{rulerName}据守{city.name}，兵不多、地位重，开局优势是名分，风险也是名分。
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-amber-700/50 hover:text-amber-100"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            回到标题
                        </button>
                    </div>
                </header>

                <div className="grid gap-5 lg:grid-cols-[1.15fr,0.85fr] lg:gap-8">
                    <section className="rounded-[2rem] border border-amber-900/25 bg-slate-950/70 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:p-6 lg:p-8">
                        <div className="flex items-center gap-3 text-amber-300">
                            <Scroll className="h-5 w-5" />
                            <div className="text-sm font-bold tracking-[0.2em]">开局重点</div>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                            {OPENING_FOCUS.map((item, index) => (
                                <div key={item.title} className="rounded-2xl border border-amber-900/20 bg-black/20 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-700/50 bg-amber-950/40 text-sm font-bold text-amber-200">{index + 1}</div>
                                        <div className="font-bold text-amber-100">{item.title}</div>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 rounded-2xl border border-amber-900/20 bg-black/20 p-4 text-sm leading-6 text-slate-300">
                            立足之初不必贪快。先稳住城池，再扩张兵力与盟友，霸业才能有真正的根基。
                        </div>
                    </section>

                    <aside className="rounded-[2rem] border border-amber-900/25 bg-slate-900/80 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:p-6 lg:p-8">
                        <div className="flex items-center gap-3 text-amber-300">
                            <Warehouse className="h-5 w-5" />
                            <div className="text-sm font-bold tracking-[0.2em]">起兵底子</div>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-300">
                            <div className="rounded-2xl bg-slate-950/70 p-4">
                                <div className="text-xs text-slate-500">据点</div>
                                <div className="mt-2 font-bold text-amber-100">{city.name}</div>
                            </div>
                            <div className="rounded-2xl bg-slate-950/70 p-4">
                                <div className="text-xs text-slate-500">定位</div>
                                <div className="mt-2 font-bold text-amber-100">{city.purposeLabel}</div>
                            </div>
                            <div className="rounded-2xl bg-slate-950/70 p-4">
                                <div className="text-xs text-slate-500">现有兵力</div>
                                <div className="mt-2 font-bold text-amber-100">{totalTroops}</div>
                            </div>
                            <div className="rounded-2xl bg-slate-950/70 p-4">
                                <div className="text-xs text-slate-500">城市特性</div>
                                <div className="mt-2 font-bold text-amber-100">{city.specialty}</div>
                            </div>
                            <div className="rounded-2xl bg-slate-950/70 p-4">
                                <div className="text-xs text-slate-500">金库</div>
                                <div className="mt-2 font-bold text-amber-100">{resources.gold}</div>
                            </div>
                            <div className="rounded-2xl bg-slate-950/70 p-4">
                                <div className="text-xs text-slate-500">粮草</div>
                                <div className="mt-2 font-bold text-amber-100">{resources.food}</div>
                            </div>
                        </div>
                        <div className="mt-5 rounded-2xl border border-amber-900/20 bg-black/20 p-4 text-sm leading-6 text-slate-400">
                            {city.name}作为{city.purposeLabel}，会更早吸引各方目光。你并不缺开局存在感，真正缺的是第一轮稳住局面的效率。
                        </div>
                    </aside>
                </div>

                <div className="hidden items-center justify-end lg:flex">
                    <button
                        type="button"
                        onClick={onStart}
                        className="inline-flex items-center justify-center rounded-full border border-amber-700/50 bg-amber-900/40 px-6 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-800/50"
                    >
                        <Sword className="mr-2 h-4 w-4" />
                        整军立旗，开始争霸
                    </button>
                </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-amber-900/20 bg-slate-950/95 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
                <div className="mx-auto max-w-6xl">
                    <button
                        type="button"
                        onClick={onStart}
                        className="w-full rounded-2xl border border-amber-700/50 bg-amber-900/40 px-4 py-3 text-sm font-bold text-amber-100"
                    >
                        整军立旗，开始争霸
                    </button>
                </div>
            </div>
        </div>
    );
}