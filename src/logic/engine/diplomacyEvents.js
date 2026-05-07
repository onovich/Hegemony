import { DIPLOMACY_STATE_EVENT_POOLS, PLAYER_DIPLOMACY_FOLLOW_UP_EVENT_POOLS } from '../../data/diplomacyEvents.js';
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

const clampRelation = (value) => Math.max(0, Math.min(100, value));

const interpolateText = (template, values) => Object.entries(values).reduce(
  (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
  template,
);

const rollEventOutcome = (event) => Object.fromEntries(
  Object.entries(event.effects).map(([key, [min, max]]) => [key, randInt(min, max)]),
);

function applyDiplomacyEvent({ event, faction, playerCities, nextCities, cityUpdates, resourceDelta, factions }) {
  const targetCity = event.scope === 'city' && playerCities.length
    ? playerCities[randInt(0, playerCities.length - 1)]
    : null;
  const outcome = rollEventOutcome(event);
  const nextCity = targetCity ? { ...(cityUpdates[targetCity.id] ?? nextCities[targetCity.id] ?? targetCity) } : null;

  Object.entries(outcome).forEach(([key, value]) => {
    if (RESOURCE_KEYS.has(key)) {
      resourceDelta[key] += value;
      return;
    }

    if (CITY_KEYS.has(key) && nextCity) {
      nextCity[key] = clampCityValue(key, (nextCity[key] ?? 0) + value);
      return;
    }

    if (key === 'relation') {
      factions[faction.id] = {
        ...factions[faction.id],
        relation: clampRelation((factions[faction.id].relation ?? 0) + value),
      };
    }
  });

  if (nextCity && targetCity) {
    cityUpdates[targetCity.id] = nextCity;
  }

  return {
    text: interpolateText(event.text, {
      faction: faction.name,
      city: targetCity?.name ?? '边城',
      ...outcome,
    }),
    type: event.type,
  };
}

function getDiplomacyState(faction) {
  if (faction.relation >= GAME_BALANCE.diplomacy.tradeThreshold) {
    return 'trade';
  }

  if (faction.relation <= GAME_BALANCE.diplomacy.hostileThreshold) {
    return 'hostile';
  }

  return null;
}

function getDiplomacyEventChance(faction, state) {
  const monthlyEvents = GAME_BALANCE.diplomacy.monthlyEvents;
  if (state === 'trade') {
    const relationBonus = Math.max(0, faction.relation - GAME_BALANCE.diplomacy.tradeThreshold);
    return Math.min(monthlyEvents.maxChance, monthlyEvents.tradeBaseChance + relationBonus * monthlyEvents.tradeRelationFactor);
  }

  const hostilityBonus = Math.max(0, GAME_BALANCE.diplomacy.hostileThreshold - faction.relation);
  return Math.min(monthlyEvents.maxChance, monthlyEvents.hostileBaseChance + hostilityBonus * monthlyEvents.hostileRelationFactor);
}

export function resolveMonthlyDiplomacyEvents({ factions, playerCities, nextCities }) {
  const resourceDelta = { gold: 0, food: 0, reputation: 0 };
  const cityUpdates = {};
  const logs = [];

  Object.values(factions)
    .filter(faction => faction.id !== 'player')
    .forEach((faction) => {
      const currentFaction = factions[faction.id];
      const followUpActions = Array.isArray(currentFaction.recentDiplomacyActions)
        ? currentFaction.recentDiplomacyActions
        : Array.isArray(currentFaction.recentPlayerDiplomacyActions)
          ? currentFaction.recentPlayerDiplomacyActions
        : currentFaction.recentPlayerDiplomacyAction?.type
          ? [currentFaction.recentPlayerDiplomacyAction]
          : [];

      if (followUpActions.length > 0) {
        factions[faction.id] = {
          ...currentFaction,
          recentDiplomacyActions: [],
          recentPlayerDiplomacyActions: [],
          recentPlayerDiplomacyAction: null,
        };

        followUpActions.forEach((followUpAction) => {
          const followUpPool = PLAYER_DIPLOMACY_FOLLOW_UP_EVENT_POOLS[followUpAction.type] ?? [];
          if (!followUpPool.length) {
            return;
          }

          const followUpEvent = followUpPool[randInt(0, followUpPool.length - 1)];
          logs.push(applyDiplomacyEvent({
            event: followUpEvent,
            faction: factions[faction.id],
            playerCities,
            nextCities,
            cityUpdates,
            resourceDelta,
            factions,
          }));
        });

        return;
      }

      const state = getDiplomacyState(factions[faction.id]);
      if (!state) {
        return;
      }

      const eventPool = DIPLOMACY_STATE_EVENT_POOLS[state] ?? [];
      if (!eventPool.length) {
        return;
      }

      if (Math.random() * 100 >= getDiplomacyEventChance(factions[faction.id], state)) {
        return;
      }

      const event = eventPool[randInt(0, eventPool.length - 1)];
      logs.push(applyDiplomacyEvent({
        event,
        faction: factions[faction.id],
        playerCities,
        nextCities,
        cityUpdates,
        resourceDelta,
        factions,
      }));
    });

  return {
    resourceDelta,
    cityUpdates,
    logs,
  };
}