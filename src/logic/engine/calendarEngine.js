export function advanceMonth({ year, month }) {
  const nextMonth = month + 1;
  if (nextMonth <= 12) {
    return { year, month: nextMonth };
  }

  return { year: year + 1, month: 1 };
}