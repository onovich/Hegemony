import { HISTORICAL_TIMELINE_EVENTS } from '../../data/historicalTimeline.js';

function isSameMonth(date, year, month) {
  return date.year === year && date.month === month;
}

function getCityName(nextCities, cityId) {
  return cityId && nextCities[cityId] ? nextCities[cityId].name : '未定之地';
}

function resolveOfficerDebut({ date, nextOfficers, nextCities, logs }) {
  nextOfficers.forEach(officer => {
    if (officer.state !== 'hidden') {
      return;
    }

    if (!officer.debutYear || !officer.debutMonth || !isSameMonth(date, officer.debutYear, officer.debutMonth)) {
      return;
    }

    const debutFactionId = officer.debutFactionId ?? officer.faction ?? 'free';
    officer.faction = debutFactionId;
    officer.cityId = officer.debutCityId && nextCities[officer.debutCityId] ? officer.debutCityId : null;
    officer.state = debutFactionId === 'free' ? 'discovered' : 'active';

    const cityName = getCityName(nextCities, officer.debutCityId);
    const context = officer.debutContext ? `，${officer.debutContext}` : '';

    if (debutFactionId === 'free') {
      logs.push({
        text: `📜 【${officer.name}】于${cityName}进入乱世视野${context}。`,
        type: 'system',
      });
      return;
    }

    logs.push({
      text: `📜 【${officer.name}】于${cityName}投入【${debutFactionId}】阵营${context}。`,
      type: 'system',
    });
  });
}

function resolveOfficerDeath({ date, nextOfficers, logs }) {
  nextOfficers.forEach(officer => {
    if (!officer.deathYear || !officer.deathMonth || !isSameMonth(date, officer.deathYear, officer.deathMonth)) {
      return;
    }

    if (officer.state === 'deceased' || officer.state === 'hidden') {
      return;
    }

    officer.cityId = null;
    officer.state = 'deceased';

    const context = officer.deathContext ? `，${officer.deathContext}` : '';
    logs.push({
      text: `☠️ 【${officer.name}】退出历史舞台${context}。`,
      type: officer.faction === 'player' ? 'warning' : 'system',
    });
  });
}

function resolveStoryEvents({ date, logs }) {
  HISTORICAL_TIMELINE_EVENTS.forEach(event => {
    if (!isSameMonth(date, event.year, event.month)) {
      return;
    }

    logs.push({
      text: `🕰️ ${event.text}`,
      type: 'system',
    });
  });
}

export function resolveHistoricalTimeline({ date, nextCities, nextOfficers }) {
  const logs = [];

  resolveOfficerDebut({ date, nextOfficers, nextCities, logs });
  resolveOfficerDeath({ date, nextOfficers, logs });
  resolveStoryEvents({ date, logs });

  return { logs };
}