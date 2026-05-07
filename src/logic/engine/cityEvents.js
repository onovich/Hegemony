import { CITY_ROLE_EVENT_POOLS, CITY_UNIQUE_EVENT_POOLS } from '../../data/cityEvents.js';
import { GAME_BALANCE } from '../../data/gameConfig.js';

const RESOURCE_KEYS = new Set(['gold', 'food', 'reputation']);
const CITY_KEYS = new Set(['agriculture', 'commerce', 'defense', 'troops', 'morale']);

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const clampCityValue = (key, value) => {
  if (key === 'morale') {
    return Math.max(0, Math.min(100, value));
  }

  return Math.max(0, value);
};

const interpolateText = (template, values) => Object.entries(values).reduce(
  (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
  template,
);

const getCityEventChance = (profile) => {
  const { cityEvents } = GAME_BALANCE;
  const economyPol = profile.economyStats.pol ?? 0;
  const militaryCmd = profile.militaryStats.cmd ?? 0;
  const rawChance = cityEvents.baseChance
    + (profile.governor ? cityEvents.governorBonus : 0)
    + (profile.commander ? cityEvents.commanderBonus : 0)
    + economyPol * cityEvents.governanceFactor
    + militaryCmd * cityEvents.commandFactor;

  return Math.min(cityEvents.maxChance, rawChance);
};

const getCityEventPool = (city) => [
  ...(CITY_UNIQUE_EVENT_POOLS[city.id] ?? []),
  ...(CITY_ROLE_EVENT_POOLS[city.role] ?? []),
];

const rollEventOutcome = (event) => Object.fromEntries(
  Object.entries(event.effects).map(([key, [min, max]]) => [key, randInt(min, max)]),
);

export function resolveMonthlyCityEvents({ cities, getCityProfile }) {
  const resourceDelta = { gold: 0, food: 0, reputation: 0 };
  const cityUpdates = {};
  const logs = [];

  cities.forEach((city) => {
    const profile = getCityProfile(city.id);
    const triggerChance = getCityEventChance(profile);
    if (Math.random() * 100 >= triggerChance) {
      return;
    }

    const eventPool = getCityEventPool(city);
    if (!eventPool.length) {
      return;
    }

    const event = eventPool[randInt(0, eventPool.length - 1)];
    const outcome = rollEventOutcome(event);
    const nextCity = { ...(cityUpdates[city.id] ?? city) };

    Object.entries(outcome).forEach(([key, value]) => {
      if (RESOURCE_KEYS.has(key)) {
        resourceDelta[key] += value;
        return;
      }

      if (CITY_KEYS.has(key)) {
        nextCity[key] = clampCityValue(key, (nextCity[key] ?? 0) + value);
      }
    });

    cityUpdates[city.id] = nextCity;
    logs.push({
      text: interpolateText(event.text, { city: city.name, ...outcome }),
      type: event.type,
    });
  });

  return {
    resourceDelta,
    cityUpdates,
    logs,
  };
}