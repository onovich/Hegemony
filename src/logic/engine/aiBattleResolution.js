import { GAME_BALANCE } from '../../data/gameConfig.js';
import {
  calculateBattlePower,
  calculateDefeatLosses,
  calculateProjectedBattlePower,
  calculateVictoryLosses,
  getCapturedCityTroops,
  shouldAiAttack,
} from './gameBalance.js';

function getAiStrategyProfile(faction) {
  return {
    attackRelationThresholdOffset: 0,
    attackMinTroopsMultiplier: 1,
    attackMinMoraleMultiplier: 1,
    attackPowerAdvantageRatioMultiplier: 1,
    ...faction.aiStrategyProfile,
  };
}

function getGoalBattleModifiers(aiPlan = null) {
  return {
    attackRelationThresholdOffset: 0,
    attackMinTroopsMultiplier: 1,
    attackMinMoraleMultiplier: 1,
    attackPowerAdvantageRatioMultiplier: 1,
    ...(aiPlan?.config ?? {}),
  };
}

export function resolveAiMonthlyBattles({
  nextCities,
  nextOfficers,
  factions,
  aiPlans,
  getFactionCitiesFromState,
  getCityProfileFromState,
}) {
  const logs = [];
  const aiFactionIds = [...new Set(Object.values(nextCities).filter(city => city.owner !== 'player').map(city => city.owner))];

  aiFactionIds.forEach(factionId => {
    const playerCitiesNow = getFactionCitiesFromState('player');
    if (!playerCitiesNow.length) {
      return;
    }

    const factionCities = getFactionCitiesFromState(factionId);
    if (!factionCities.length) {
      return;
    }

    const attackerCandidates = factionCities.map(city => {
      const cityStats = getCityProfileFromState(city.id, factionId).militaryStats;

      return {
        city,
        stats: cityStats,
        projectedPower: calculateProjectedBattlePower({
          troops: city.troops,
          cmd: cityStats.cmd || GAME_BALANCE.military.defaultEnemyCommand,
          morale: city.morale,
        }),
      };
    }).sort((left, right) => right.projectedPower - left.projectedPower);

    const defenderCandidates = playerCitiesNow.map(city => {
      const cityStats = getCityProfileFromState(city.id, 'player').militaryStats;

      return {
        city,
        stats: cityStats,
        projectedPower: calculateProjectedBattlePower({
          troops: city.troops,
          cmd: cityStats.cmd || GAME_BALANCE.military.defaultEnemyCommand,
          morale: city.morale,
          defense: city.defense,
          isDefender: true,
        }),
      };
    }).sort((left, right) => left.projectedPower - right.projectedPower);

    const attacker = attackerCandidates[0];
    const defender = defenderCandidates[0];
    if (!attacker || !defender) {
      return;
    }

    const relation = factions[factionId]?.relation ?? 0;
    const strategyProfile = getAiStrategyProfile(factions[factionId] ?? {});
    const goalBattleModifiers = getGoalBattleModifiers(aiPlans?.[factionId]);
    if (!shouldAiAttack({
      attackerCity: attacker.city,
      attackerStats: attacker.stats,
      targetCity: defender.city,
      targetStats: defender.stats,
      relation,
      attackRelationThreshold: GAME_BALANCE.ai.attackRelationThreshold + strategyProfile.attackRelationThresholdOffset + goalBattleModifiers.attackRelationThresholdOffset,
      attackMinTroops: Math.floor(GAME_BALANCE.ai.attackMinTroops * strategyProfile.attackMinTroopsMultiplier * goalBattleModifiers.attackMinTroopsMultiplier),
      attackMinMorale: Math.floor(GAME_BALANCE.ai.attackMinMorale * strategyProfile.attackMinMoraleMultiplier * goalBattleModifiers.attackMinMoraleMultiplier),
      attackPowerAdvantageRatio: GAME_BALANCE.ai.attackPowerAdvantageRatio * strategyProfile.attackPowerAdvantageRatioMultiplier * goalBattleModifiers.attackPowerAdvantageRatioMultiplier,
    })) {
      return;
    }

    const attackerCity = nextCities[attacker.city.id];
    const defenderCity = nextCities[defender.city.id];
    logs.push({
      text: `⚠️ 【${factions[factionId].name}】自【${attackerCity.name}】出兵，进攻我方【${defenderCity.name}】！`,
      type: 'warning',
    });

    const attackerPower = calculateBattlePower({
      troops: attackerCity.troops,
      cmd: attacker.stats.cmd || GAME_BALANCE.military.defaultEnemyCommand,
      morale: attackerCity.morale,
    });
    const defenderPower = calculateBattlePower({
      troops: defenderCity.troops,
      cmd: defender.stats.cmd || GAME_BALANCE.military.defaultEnemyCommand,
      morale: defenderCity.morale,
      defense: defenderCity.defense,
      isDefender: true,
    });

    if (attackerPower > defenderPower) {
      const troopsLost = calculateVictoryLosses(defenderCity.troops);
      const capturedTroops = getCapturedCityTroops(defenderCity.troops);
      nextCities[attackerCity.id] = {
        ...attackerCity,
        troops: Math.max(0, attackerCity.troops - troopsLost),
        morale: Math.max(45, attackerCity.morale - 5),
      };
      nextCities[defenderCity.id] = {
        ...defenderCity,
        owner: factionId,
        governorId: null,
        commanderId: null,
        troops: capturedTroops,
        morale: 55,
      };

      const fallbackCity = getFactionCitiesFromState('player').find(city => city.id !== defenderCity.id);
      nextOfficers.forEach(officer => {
        if (officer.faction !== 'player' || officer.cityId !== defenderCity.id) {
          return;
        }

        if (fallbackCity) {
          officer.cityId = fallbackCity.id;
        } else {
          officer.cityId = null;
        }
      });

      logs.push({
        text: `❌ 【${defenderCity.name}】失守！敌军攻入城中，我方损失该城控制权。`,
        type: 'error',
      });
      return;
    }

    const troopsLost = calculateDefeatLosses(attackerCity.troops);
    nextCities[attackerCity.id] = {
      ...attackerCity,
      troops: Math.max(0, attackerCity.troops - troopsLost),
      morale: Math.max(35, attackerCity.morale - 10),
    };
    nextCities[defenderCity.id] = {
      ...defenderCity,
      troops: Math.max(0, Math.floor(defenderCity.troops * GAME_BALANCE.military.defenderTroopLossRateOnRepel)),
    };
    logs.push({
      text: `✅ 【${defenderCity.name}】成功击退【${factions[factionId].name}】来犯之敌！`,
      type: 'success',
    });
  });

  return { logs };
}