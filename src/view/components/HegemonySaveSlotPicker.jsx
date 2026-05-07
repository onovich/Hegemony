export default function HegemonySaveSlotPicker({
    title,
    description,
    slots,
    actionLabel,
    onSelect,
    onCancel,
    disabledSlotIds = [],
}) {
    return (
        <div className="rounded-2xl border border-amber-900/20 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-bold text-amber-200">{title}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">{description}</div>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-amber-700/50 hover:text-amber-100"
                >
                    取消
                </button>
            </div>

            <div className="mt-4 space-y-3">
                {slots.map(slot => {
                    const isDisabled = disabledSlotIds.includes(slot.slotId);

                    return (
                        <button
                            key={slot.slotId}
                            type="button"
                            onClick={() => onSelect(slot.slotId)}
                            disabled={isDisabled}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${isDisabled ? 'cursor-not-allowed border-slate-800 bg-slate-950/40 opacity-50' : 'border-slate-700 bg-slate-950/60 hover:border-amber-700/50 hover:bg-slate-900/80'}`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-bold text-amber-100">{slot.slotLabel}</div>
                                    <div className="mt-1 text-xs text-slate-400">{slot.dateLabel} · {slot.cityLabel}</div>
                                </div>
                                <div className="text-xs font-bold text-amber-300">{actionLabel}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}