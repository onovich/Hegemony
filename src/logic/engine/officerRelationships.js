import { GAME_BALANCE } from '../../data/gameConfig.js';
import { OFFICER_PAIR_CITY_EVENTS } from '../../data/officerCityEvents.js';
import { ALIGNMENT_RELATION_SCORES, OFFICER_RELATION_PROFILES } from '../../data/officerRelationships.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const EMPTY_CITY_EFFECT = {
  key: 'neutral',
  relationScore: 0,
  relationLabel: '未成形',
  economy: { pol: 0, cha: 0 },
  military: { cmd: 0, cha: 0 },
};

function applyStatDelta(stats, delta) {
  return {
    ...stats,
    cmd: Math.max(0, (stats.cmd ?? 0) + (delta.cmd ?? 0)),
    int: Math.max(0, (stats.int ?? 0) + (delta.int ?? 0)),
    pol: Math.max(0, (stats.pol ?? 0) + (delta.pol ?? 0)),
    cha: Math.max(0, (stats.cha ?? 0) + (delta.cha ?? 0)),
  };
}

function getOfficerProfile(officer) {
  return OFFICER_RELATION_PROFILES[officer?.id] ?? { alignment: 'order', bonds: [], rivals: [] };
}

function getAlignmentScore(sourceAlignment, targetAlignment) {
  return ALIGNMENT_RELATION_SCORES[sourceAlignment]?.[targetAlignment] ?? 0;
}

export function getOfficerRelationScore(sourceOfficer, targetOfficer) {
  if (!sourceOfficer || !targetOfficer || sourceOfficer.id === targetOfficer.id) {
    return 0;
  }

  const sourceProfile = getOfficerProfile(sourceOfficer);
  const targetProfile = getOfficerProfile(targetOfficer);
  let score = getAlignmentScore(sourceProfile.alignment, targetProfile.alignment);

  if (sourceProfile.bonds.includes(targetOfficer.id) || targetProfile.bonds.includes(sourceOfficer.id)) {
    score += 16;
  }

  if (sourceProfile.rivals.includes(targetOfficer.id) || targetProfile.rivals.includes(sourceOfficer.id)) {
    score -= 16;
  }

  return score;
}

export function getOfficerRelationLabel(score) {
  if (score >= GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    return '知己';
  }

  if (score >= GAME_BALANCE.relationships.loyaltyPositiveThreshold) {
    return '亲近';
  }

  if (score <= -GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    return '死敌';
  }

  if (score <= GAME_BALANCE.relationships.loyaltyNegativeThreshold) {
    return '疏离';
  }

  return '中立';
}

export function calculateRecruitRelationshipBonus(ruler, targetOfficer) {
  const relationScore = getOfficerRelationScore(ruler, targetOfficer);
  const bonus = Math.round(relationScore * GAME_BALANCE.relationships.recruitScoreFactor);

  return clamp(bonus, -GAME_BALANCE.relationships.recruitMaxBonus, GAME_BALANCE.relationships.recruitMaxBonus);
}

function getDriftForScore(score, positiveValue, negativeValue, strongPositiveValue, strongNegativeValue) {
  if (score >= GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    return strongPositiveValue;
  }

  if (score >= GAME_BALANCE.relationships.loyaltyPositiveThreshold) {
    return positiveValue;
  }

  if (score <= -GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    return strongNegativeValue;
  }

  if (score <= GAME_BALANCE.relationships.loyaltyNegativeThreshold) {
    return negativeValue;
  }

  return 0;
}

export function calculateMonthlyRelationshipDrift({ officer, ruler, governor, commander }) {
  if (!officer || !ruler || officer.id === ruler.id) {
    return { delta: 0, rulerScore: 0, leaderScore: 0 };
  }

  const rulerScore = getOfficerRelationScore(officer, ruler);
  let delta = getDriftForScore(
    rulerScore,
    GAME_BALANCE.relationships.rulerPositiveDrift,
    GAME_BALANCE.relationships.rulerNegativeDrift,
    GAME_BALANCE.relationships.rulerStrongPositiveDrift,
    GAME_BALANCE.relationships.rulerStrongNegativeDrift,
  );

  const leaders = [governor, commander].filter(Boolean).filter(leader => leader.id !== officer.id);
  const leaderScore = leaders.reduce((bestScore, leader) => {
    const relationScore = getOfficerRelationScore(officer, leader);
    return Math.abs(relationScore) > Math.abs(bestScore) ? relationScore : bestScore;
  }, 0);

  delta += getDriftForScore(
    leaderScore,
    GAME_BALANCE.relationships.leaderPositiveDrift,
    GAME_BALANCE.relationships.leaderNegativeDrift,
    GAME_BALANCE.relationships.leaderPositiveDrift,
    GAME_BALANCE.relationships.leaderNegativeDrift,
  );

  return {
    delta,
    rulerScore,
    leaderScore,
  };
}

export function getCityLeadershipRelationshipEffect(governor, commander) {
  if (!governor || !commander || governor.id === commander.id) {
    return EMPTY_CITY_EFFECT;
  }

  const relationScore = getOfficerRelationScore(governor, commander);
  const relationLabel = getOfficerRelationLabel(relationScore);
  let key = 'neutral';

  if (relationScore >= GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    key = 'strongPositive';
  } else if (relationScore >= GAME_BALANCE.relationships.loyaltyPositiveThreshold) {
    key = 'positive';
  } else if (relationScore <= -GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    key = 'strongNegative';
  } else if (relationScore <= GAME_BALANCE.relationships.loyaltyNegativeThreshold) {
    key = 'negative';
  }

  if (key === 'neutral') {
    return {
      ...EMPTY_CITY_EFFECT,
      relationScore,
      relationLabel,
    };
  }

  return {
    key,
    relationScore,
    relationLabel,
    economy: GAME_BALANCE.relationships.cityLeadershipEffects[key].economy,
    military: GAME_BALANCE.relationships.cityLeadershipEffects[key].military,
  };
}

export function applyCityLeadershipRelationshipEffects({ economyStats, militaryStats, governor, commander }) {
  const leadershipEffect = getCityLeadershipRelationshipEffect(governor, commander);

  return {
    relationshipEffect: leadershipEffect,
    economyStats: applyStatDelta(economyStats, leadershipEffect.economy),
    militaryStats: applyStatDelta(militaryStats, leadershipEffect.military),
  };
}

function getRelationshipTier(score) {
  if (score >= GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    return 'strongPositive';
  }

  if (score >= GAME_BALANCE.relationships.loyaltyPositiveThreshold) {
    return 'positive';
  }

  if (score <= -GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    return 'strongNegative';
  }

  if (score <= GAME_BALANCE.relationships.loyaltyNegativeThreshold) {
    return 'negative';
  }

  return 'neutral';
}

function getStrongestOfficerPair(officers) {
  let bestPair = null;

  for (let index = 0; index < officers.length; index += 1) {
    for (let offset = index + 1; offset < officers.length; offset += 1) {
      const first = officers[index];
      const second = officers[offset];
      const score = getOfficerRelationScore(first, second);

      if (!bestPair || Math.abs(score) > Math.abs(bestPair.score)) {
        bestPair = { first, second, score };
      }
    }
  }

  return bestPair;
}

function getCityOfficerEventChance(score) {
  return Math.min(
    GAME_BALANCE.relationships.cityOfficerEvents.maxChance,
    GAME_BALANCE.relationships.cityOfficerEvents.baseChance + Math.abs(score) * GAME_BALANCE.relationships.cityOfficerEvents.scoreChanceFactor,
  );
}

function interpolateText(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function getOfficerPairKey(firstOfficerId, secondOfficerId) {
  return [firstOfficerId, secondOfficerId].sort().join('|');
}

function getGenericCityOfficerEventConfig(tier) {
  const config = GAME_BALANCE.relationships.cityOfficerEvents[tier];

  return {
    type: tier === 'strongPositive' || tier === 'positive' ? 'success' : 'warning',
    text: tier === 'strongPositive' || tier === 'positive'
      ? '【{{city}}】中，【{{first}}】与【{{second}}】意气相投，共襄城务，城中士气提升 {{morale}}，额外获得 {{gold}} 金。'
      : '【{{city}}】中，【{{first}}】与【{{second}}】龃龉日深，内耗不断，城中士气下降 {{morale}}，额外损失 {{gold}} 金。',
    effects: {
      morale: [config.moraleMin, config.moraleMax],
      gold: [config.goldMin, config.goldMax],
      loyalty: [config.loyaltyMin, config.loyaltyMax],
    },
  };
}

function rollEventEffects(eventConfig) {
  return Object.fromEntries(
    Object.entries(eventConfig.effects).map(([key, [min, max]]) => [key, randInt(min, max)]),
  );
}

function pickCityOfficerEvent(pair, tier) {
  const pairKey = getOfficerPairKey(pair.first.id, pair.second.id);
  const pairEvents = (OFFICER_PAIR_CITY_EVENTS[pairKey] ?? []).filter((event) => event.tier === tier);

  if (pairEvents.length > 0) {
    return pairEvents[randInt(0, pairEvents.length - 1)];
  }

  return getGenericCityOfficerEventConfig(tier);
}

export function resolveMonthlyOfficerRelationshipEvents({ cities, officers, factionId }) {
  const cityUpdates = {};
  const officerLoyaltyChanges = {};
  const resourceDelta = { gold: 0, food: 0, reputation: 0 };
  const logs = [];

  cities.forEach((city) => {
    const stationedOfficers = officers.filter((officer) => (
      officer.faction === factionId &&
      officer.state === 'active' &&
      officer.cityId === city.id
    ));

    if (stationedOfficers.length < 2) {
      return;
    }

    const pair = getStrongestOfficerPair(stationedOfficers);
    if (!pair) {
      return;
    }

    const tier = getRelationshipTier(pair.score);
    if (tier === 'neutral') {
      return;
    }

    if (Math.random() * 100 >= getCityOfficerEventChance(pair.score)) {
      return;
    }

    const eventConfig = pickCityOfficerEvent(pair, tier);
    const rolledEffects = rollEventEffects(eventConfig);
    const moraleDelta = rolledEffects.morale;
    const loyaltyDelta = rolledEffects.loyalty;
    const goldDelta = rolledEffects.gold;
    const isPositive = pair.score > 0;
    const nextCity = { ...(cityUpdates[city.id] ?? city) };

    nextCity.morale = clamp(nextCity.morale + (isPositive ? moraleDelta : -moraleDelta), 0, 100);
    cityUpdates[city.id] = nextCity;
    resourceDelta.gold += isPositive ? goldDelta : -goldDelta;
    officerLoyaltyChanges[pair.first.id] = (officerLoyaltyChanges[pair.first.id] ?? 0) + (isPositive ? loyaltyDelta : -loyaltyDelta);
    officerLoyaltyChanges[pair.second.id] = (officerLoyaltyChanges[pair.second.id] ?? 0) + (isPositive ? loyaltyDelta : -loyaltyDelta);

    logs.push({
      text: interpolateText(eventConfig.text, {
        city: city.name,
        first: pair.first.name,
        second: pair.second.name,
        morale: moraleDelta,
        gold: goldDelta,
        loyalty: loyaltyDelta,
      }),
      type: eventConfig.type,
    });
  });

  return {
    cityUpdates,
    officerLoyaltyChanges,
    resourceDelta,
    logs,
  };
}