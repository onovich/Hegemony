import { GAME_BALANCE } from '../../data/gameConfig.js';
import { getDirectedStatsWithSpecialty } from './officerSpecialties.js';
import { applyCityLeadershipRelationshipEffects } from './officerRelationships.js';

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const GOVERNOR_ROLE_WEIGHTS = {
  capital: { pol: 1.1, int: 0.6, cha: 0.7, cmd: 0.2 },
  agriculture: { pol: 1.2, int: 0.2, cha: 0.4, cmd: 0.1 },
  commerce: { pol: 1, int: 0.5, cha: 0.9, cmd: 0.1 },
  military: { pol: 0.7, int: 0.3, cha: 0.4, cmd: 0.5 },
};

const COMMANDER_ROLE_WEIGHTS = {
  capital: { cmd: 1, cha: 0.5, int: 0.2, pol: 0.1 },
  agriculture: { cmd: 0.8, cha: 0.3, int: 0.2, pol: 0.1 },
  commerce: { cmd: 0.9, cha: 0.4, int: 0.3, pol: 0.1 },
  military: { cmd: 1.25, cha: 0.45, int: 0.2, pol: 0.1 },
};

function getAiStrategyProfile(faction = {}, aiPlan = null) {
  const goalGrowthMultipliers = aiPlan?.config?.growthMultipliers ?? {};
  return {
    governorWeightBias: {
      pol: 1,
      int: 1,
      cha: 1,
      cmd: 1,
    },
    commanderWeightBias: {
      cmd: 1,
      cha: 1,
      int: 1,
      pol: 1,
    },
    growthMultipliers: {
      troops: 1,
      agriculture: 1,
      commerce: 1,
      defense: 1,
      morale: 1,
    },
    ...faction.aiStrategyProfile,
    governorWeightBias: {
      pol: 1,
      int: 1,
      cha: 1,
      cmd: 1,
      ...(faction.aiStrategyProfile?.governorWeightBias ?? {}),
    },
    commanderWeightBias: {
      cmd: 1,
      cha: 1,
      int: 1,
      pol: 1,
      ...(faction.aiStrategyProfile?.commanderWeightBias ?? {}),
    },
    growthMultipliers: {
      troops: 1,
      agriculture: 1,
      commerce: 1,
      defense: 1,
      morale: 1,
      ...(faction.aiStrategyProfile?.growthMultipliers ?? {}),
      troops: (faction.aiStrategyProfile?.growthMultipliers?.troops ?? 1) * (goalGrowthMultipliers.troops ?? 1),
      agriculture: (faction.aiStrategyProfile?.growthMultipliers?.agriculture ?? 1) * (goalGrowthMultipliers.agriculture ?? 1),
      commerce: (faction.aiStrategyProfile?.growthMultipliers?.commerce ?? 1) * (goalGrowthMultipliers.commerce ?? 1),
      defense: (faction.aiStrategyProfile?.growthMultipliers?.defense ?? 1) * (goalGrowthMultipliers.defense ?? 1),
      morale: (faction.aiStrategyProfile?.growthMultipliers?.morale ?? 1) * (goalGrowthMultipliers.morale ?? 1),
    },
  };
}

function getRoleWeights(role, mapping) {
  return mapping[role] ?? mapping.capital;
}

function applyWeightBias(weights, bias) {
  return Object.fromEntries(
    Object.entries(weights).map(([stat, weight]) => [stat, weight * (bias[stat] ?? 1)])
  );
}

function scoreOfficer(officer, weights) {
  return Object.entries(weights).reduce((total, [stat, weight]) => total + (officer[stat] ?? 0) * weight, 0);
}

function pickBestOfficerId(officers, weights) {
  if (!officers.length) {
    return null;
  }

  return officers
    .map(officer => ({ officerId: officer.id, score: scoreOfficer(officer, weights) }))
    .sort((left, right) => right.score - left.score)[0]?.officerId ?? null;
}

function getRoleGrowthBonus(role) {
  return GAME_BALANCE.ai.roleGrowthBonus[role] ?? GAME_BALANCE.ai.roleGrowthBonus.capital;
}

function calculateAiCityGrowth(city, profile, strategyProfile) {
  const roleBonus = getRoleGrowthBonus(city.role);
  const growthMultipliers = strategyProfile.growthMultipliers;

  return {
    troops: Math.floor((randInt(GAME_BALANCE.ai.monthlyTroopsMin, GAME_BALANCE.ai.monthlyTroopsMax)
      + Math.floor(profile.militaryStats.cmd * GAME_BALANCE.ai.troopCmdFactor)
      + Math.floor(profile.militaryStats.cha * GAME_BALANCE.ai.troopChaFactor)
      + roleBonus.troops) * growthMultipliers.troops),
    agriculture: Math.floor((randInt(GAME_BALANCE.ai.monthlyAgricultureMin, GAME_BALANCE.ai.monthlyAgricultureMax)
      + Math.floor(profile.economyStats.pol * GAME_BALANCE.ai.agriculturePolFactor)
      + roleBonus.agriculture) * growthMultipliers.agriculture),
    commerce: Math.floor((randInt(GAME_BALANCE.ai.monthlyCommerceMin, GAME_BALANCE.ai.monthlyCommerceMax)
      + Math.floor(profile.economyStats.pol * GAME_BALANCE.ai.commercePolFactor)
      + Math.floor(profile.economyStats.cha * GAME_BALANCE.ai.commerceChaFactor)
      + roleBonus.commerce) * growthMultipliers.commerce),
    defense: Math.floor((randInt(GAME_BALANCE.ai.monthlyDefenseMin, GAME_BALANCE.ai.monthlyDefenseMax)
      + Math.floor(profile.militaryStats.cmd * GAME_BALANCE.ai.defenseCmdFactor)
      + roleBonus.defense) * growthMultipliers.defense),
    morale: Math.floor((randInt(GAME_BALANCE.ai.monthlyMoraleMin, GAME_BALANCE.ai.monthlyMoraleMax)
      + Math.floor(profile.militaryStats.cmd * GAME_BALANCE.ai.moraleCmdFactor)
      + Math.floor(profile.militaryStats.cha * GAME_BALANCE.ai.moraleChaFactor)
      + roleBonus.morale) * growthMultipliers.morale),
  };
}

export function resolveAiFactionCityManagement({ factionId, factionName, faction, aiPlan = null, cities, officers }) {
  const cityUpdates = {};
  const logs = [];
  const strategyProfile = getAiStrategyProfile(faction, aiPlan);

  cities.forEach(city => {
    const stationedOfficers = officers.filter(officer => (
      officer.faction === factionId &&
      officer.state === 'active' &&
      officer.cityId === city.id
    ));

    const governorWeights = applyWeightBias(
      getRoleWeights(city.role, GOVERNOR_ROLE_WEIGHTS),
      strategyProfile.governorWeightBias
    );
    const commanderWeights = applyWeightBias(
      getRoleWeights(city.role, COMMANDER_ROLE_WEIGHTS),
      strategyProfile.commanderWeightBias
    );
    const nextGovernorId = pickBestOfficerId(stationedOfficers, governorWeights);
    const nextCommanderId = pickBestOfficerId(stationedOfficers, commanderWeights);
    const economyProfile = getDirectedStatsWithSpecialty(stationedOfficers, nextGovernorId, 'governor');
    const militaryProfile = getDirectedStatsWithSpecialty(stationedOfficers, nextCommanderId, 'commander');
    const relationshipProfile = applyCityLeadershipRelationshipEffects({
      economyStats: economyProfile.stats,
      militaryStats: militaryProfile.stats,
      governor: stationedOfficers.find(officer => officer.id === nextGovernorId) ?? null,
      commander: stationedOfficers.find(officer => officer.id === nextCommanderId) ?? null,
    });
    const profile = {
      stationedOfficers,
      economyStats: relationshipProfile.economyStats,
      militaryStats: relationshipProfile.militaryStats,
      governor: stationedOfficers.find(officer => officer.id === nextGovernorId) ?? null,
      commander: stationedOfficers.find(officer => officer.id === nextCommanderId) ?? null,
      governorSpecialty: economyProfile.activeSpecialty,
      commanderSpecialty: militaryProfile.activeSpecialty,
      leadershipRelation: relationshipProfile.relationshipEffect,
    };
    const growth = calculateAiCityGrowth(city, profile, strategyProfile);

    cityUpdates[city.id] = {
      ...city,
      governorId: nextGovernorId,
      commanderId: nextCommanderId,
      troops: city.troops + growth.troops,
      agriculture: city.agriculture + growth.agriculture,
      commerce: city.commerce + growth.commerce,
      defense: city.defense + growth.defense,
      morale: Math.min(100, city.morale + growth.morale),
    };

    if (nextGovernorId && city.governorId !== nextGovernorId) {
      const governor = stationedOfficers.find(officer => officer.id === nextGovernorId);
      logs.push({
        text: `【${factionName}】任命【${governor?.name ?? '无名官吏'}】为【${city.name}】太守，激活特技【${profile.governorSpecialty?.name ?? '无'}】。`,
        type: 'system',
      });
    }

    if (nextCommanderId && city.commanderId !== nextCommanderId) {
      const commander = stationedOfficers.find(officer => officer.id === nextCommanderId);
      logs.push({
        text: `【${factionName}】任命【${commander?.name ?? '无名将领'}】为【${city.name}】主将，激活特技【${profile.commanderSpecialty?.name ?? '无'}】。`,
        type: 'warning',
      });
    }
  });

  return {
    cityUpdates,
    logs,
  };
}