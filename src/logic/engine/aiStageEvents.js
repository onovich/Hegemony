import { AI_STAGE_EVENT_POOLS } from '../../data/aiStageEvents.js';
import { GAME_BALANCE } from '../../data/gameConfig.js';

const CITY_KEYS = new Set(['agriculture', 'commerce', 'defense', 'troops', 'morale']);

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const clampCityValue = (key, value) => {
  if (key === 'morale') {
    return Math.max(0, Math.min(100, value));
  }

  return Math.max(0, value);
};

const clampRelation = (value) => Math.max(0, Math.min(100, value));

const interpolateText = (template, values) => Object.entries(values).reduce(
  (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
  template,
);

const rollEventOutcome = (event) => Object.fromEntries(
  Object.entries(event.effects).map(([key, [min, max]]) => [key, randInt(min, max)]),
);

function getTriggerChance(goalId) {
  const stageEvents = GAME_BALANCE.ai.stageEvents;
  const bonus = stageEvents.goalChanceBonus[goalId] ?? 0;
  return Math.min(stageEvents.maxChance, stageEvents.baseChance + bonus);
}

function pickTargetCity(cities, targetRule) {
  if (!cities.length) {
    return null;
  }

  const sortedBy = (selector) => [...cities].sort(selector)[0] ?? null;

  switch (targetRule) {
    case 'highestTroops':
      return sortedBy((left, right) => right.troops - left.troops);
    case 'lowestDefense':
      return sortedBy((left, right) => left.defense - right.defense);
    case 'weakestEconomy':
      return sortedBy((left, right) => (left.agriculture + left.commerce) - (right.agriculture + right.commerce));
    case 'highestCommerce':
      return sortedBy((left, right) => right.commerce - left.commerce);
    case 'capitalOrBestCommerce': {
      const capital = cities.find(city => city.role === 'capital');
      return capital ?? sortedBy((left, right) => right.commerce - left.commerce);
    }
    default:
      return cities[0] ?? null;
  }
}

export function resolveAiStageEvents({ nextCities, nextFactions, aiPlans, getFactionCitiesFromState }) {
  const logs = [];

  Object.entries(aiPlans).forEach(([factionId, aiPlan]) => {
    const eventPool = AI_STAGE_EVENT_POOLS[aiPlan.goalId] ?? [];
    if (!eventPool.length) {
      return;
    }

    if (Math.random() * 100 >= getTriggerChance(aiPlan.goalId)) {
      return;
    }

    const factionCities = getFactionCitiesFromState(factionId);
    if (!factionCities.length) {
      return;
    }

    const event = eventPool[randInt(0, eventPool.length - 1)];
    const targetCity = event.scope === 'city' ? pickTargetCity(factionCities, event.target) : null;
    const outcome = rollEventOutcome(event);

    Object.entries(outcome).forEach(([key, value]) => {
      if (CITY_KEYS.has(key) && targetCity) {
        nextCities[targetCity.id] = {
          ...nextCities[targetCity.id],
          [key]: clampCityValue(key, (nextCities[targetCity.id][key] ?? 0) + value),
        };
        return;
      }

      if (key === 'relation') {
        nextFactions[factionId] = {
          ...nextFactions[factionId],
          relation: clampRelation((nextFactions[factionId].relation ?? 0) + value),
        };
      }
    });

    logs.push({
      text: interpolateText(event.text, {
        faction: nextFactions[factionId].name,
        city: targetCity?.name ?? '本部',
        ...outcome,
      }),
      type: event.type,
    });
  });

  return { logs };
}