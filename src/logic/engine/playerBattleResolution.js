import { GAME_BALANCE } from '../../data/gameConfig.js';
import {
  calculateAttackFoodCost,
  calculateBattlePower,
  calculateDefeatLosses,
  calculateVictoryLosses,
  getCapturedCityTroops,
} from './gameBalance.js';

function chance(percent) {
  return Math.random() * 100 < percent;
}

const BATTLE_SCENE_LABELS = {
  plain: '平原',
  fort: '坚城',
  river: '水战',
  siege: '攻城',
  pass: '关隘',
};

export const PLAYER_BATTLE_STRATEGIES = {
  steady: {
    id: 'steady',
    label: '稳扎',
    summary: '稳步推进，降低战损，适合兵力接近时持重压阵。',
    powerMultiplier: 0.98,
    intelligenceFactor: 0.06,
    defenseShift: 8,
    victoryLossMultiplier: 0.8,
    defeatLossMultiplier: 0.88,
    repelLossMultiplier: 0.94,
  },
  assault: {
    id: 'assault',
    label: '强攻',
    summary: '集中兵力强压城头，提升破城概率，但战损更高。',
    powerMultiplier: 1.12,
    intelligenceFactor: 0.04,
    defenseShift: 0,
    victoryLossMultiplier: 1.15,
    defeatLossMultiplier: 1.18,
    repelLossMultiplier: 0.9,
  },
  raid: {
    id: 'raid',
    label: '奇袭',
    summary: '利用军情与破口突击，适合智将或有内应时使用。',
    powerMultiplier: 1.02,
    intelligenceFactor: 0.14,
    defenseShift: -10,
    victoryLossMultiplier: 0.94,
    defeatLossMultiplier: 1,
    repelLossMultiplier: 0.84,
  },
  fire: {
    id: 'fire',
    label: '火攻',
    summary: '借地形与火势撕开防线，仅适用于水战或攻城环境。',
    requiredSceneTags: ['river', 'siege'],
    powerMultiplier: 1.08,
    intelligenceFactor: 0.2,
    defenseShift: -22,
    victoryLossMultiplier: 1.02,
    defeatLossMultiplier: 1.08,
    repelLossMultiplier: 0.82,
  },
};

function getSceneLabel(sceneTag) {
  return BATTLE_SCENE_LABELS[sceneTag] ?? '野战';
}

function clampLoss(value) {
  return Math.max(0, Math.floor(value));
}

function getStrategyProfile(strategyId, targetCity) {
  const fallback = PLAYER_BATTLE_STRATEGIES.steady;
  const strategy = PLAYER_BATTLE_STRATEGIES[strategyId] ?? fallback;
  const requiredSceneTags = strategy.requiredSceneTags ?? [];

  if (!requiredSceneTags.length || requiredSceneTags.includes(targetCity.battleSceneTag)) {
    return strategy;
  }

  return fallback;
}

export function getAvailablePlayerBattleStrategies(targetCity) {
  return Object.values(PLAYER_BATTLE_STRATEGIES).filter(strategy => {
    const requiredSceneTags = strategy.requiredSceneTags ?? [];
    return !requiredSceneTags.length || requiredSceneTags.includes(targetCity.battleSceneTag);
  });
}

export function buildPlayerBattlePreview({
  myCity,
  targetCity,
  attackerStats,
  defenderStats,
  factionName,
}) {
  const baseAttackPower = calculateBattlePower({
    troops: myCity.troops,
    cmd: attackerStats.cmd,
    morale: myCity.morale,
  });
  const baseDefensePower = calculateBattlePower({
    troops: targetCity.troops,
    cmd: defenderStats.cmd || GAME_BALANCE.military.defaultEnemyCommand,
    morale: targetCity.morale,
    defense: targetCity.defense,
    isDefender: true,
  });

  return {
    targetName: targetCity.name,
    factionName,
    sceneLabel: getSceneLabel(targetCity.battleSceneTag),
    openingLabel: targetCity.diplomacyOpening?.label ?? null,
    openingSummary: targetCity.diplomacyOpening?.summary ?? null,
    attackFoodCost: calculateAttackFoodCost(myCity.troops),
    attackerPower: Math.round(baseAttackPower),
    defenderPower: Math.round(baseDefensePower),
    availableStrategies: getAvailablePlayerBattleStrategies(targetCity),
  };
}

export function resolvePlayerBattle({
  cities,
  officers,
  resources,
  factions,
  myCity,
  targetCity,
  attackerStats,
  defenderStats,
  strategyId = 'steady',
}) {
  const targetFaction = targetCity.owner;
  const nextCities = Object.fromEntries(
    Object.entries(cities).map(([cityId, city]) => [cityId, { ...city }]),
  );
  const nextOfficers = officers.map(officer => ({ ...officer }));
  const nextResources = { ...resources };
  const logs = [];
  const strategy = getStrategyProfile(strategyId, targetCity);
  const diplomacyOpeningBonus = targetCity.diplomacyOpening ? 0.12 : 0;
  const intelligenceGap = (attackerStats.int ?? 0) - (defenderStats.int ?? GAME_BALANCE.military.defaultEnemyCommand);
  const attackerPowerModifier = strategy.powerMultiplier
    + intelligenceGap * strategy.intelligenceFactor / 100
    + diplomacyOpeningBonus;
  const defenderDefense = Math.max(0, targetCity.defense + strategy.defenseShift - (targetCity.diplomacyOpening ? 14 : 0));

  const myPower = calculateBattlePower({
    troops: myCity.troops,
    cmd: attackerStats.cmd,
    morale: myCity.morale,
  }) * Math.max(0.8, attackerPowerModifier);
  const enemyPower = calculateBattlePower({
    troops: targetCity.troops,
    cmd: defenderStats.cmd || GAME_BALANCE.military.defaultEnemyCommand,
    morale: targetCity.morale,
    defense: defenderDefense,
    isDefender: true,
  });

  logs.push({
    text: `⚔️ 布阵：我军自【${myCity.name}】出兵攻向【${targetCity.name}】，战场环境为${getSceneLabel(targetCity.battleSceneTag)}。本次方略为【${strategy.label}】。`,
    type: 'system',
  });
  logs.push({
    text: targetCity.diplomacyOpening
      ? `⚔️ 交锋：敌城已有“${targetCity.diplomacyOpening.label}”破口，我军借势突进，前线情报对我方有利。`
      : `⚔️ 交锋：双方前锋接战，我军统率 ${attackerStats.cmd} 对敌军统率 ${defenderStats.cmd || GAME_BALANCE.military.defaultEnemyCommand}。`,
    type: myPower >= enemyPower ? 'system' : 'warning',
  });

  if (myPower > enemyPower) {
    const troopsLost = clampLoss(calculateVictoryLosses(targetCity.troops) * strategy.victoryLossMultiplier);
    const capturedTroops = getCapturedCityTroops(targetCity.troops);
    const capturedNames = [];

    nextCities[myCity.id] = {
      ...nextCities[myCity.id],
      troops: Math.max(0, nextCities[myCity.id].troops - troopsLost),
    };
    nextCities[targetCity.id] = {
      ...nextCities[targetCity.id],
      owner: 'player',
      governorId: null,
      commanderId: null,
      troops: capturedTroops,
      morale: 60,
    };

    nextOfficers.forEach(officer => {
      if (officer.faction !== targetFaction || officer.cityId !== targetCity.id) {
        return;
      }

      if (chance(50)) {
        capturedNames.push(officer.name);
        officer.faction = 'player';
        officer.cityId = targetCity.id;
        officer.state = 'active';
        officer.loyalty = 40;
        return;
      }

      officer.faction = 'free';
      officer.cityId = null;
      officer.state = 'discovered';
    });

    const spoilGold = Math.floor(targetCity.commerce * 10);
    const spoilFood = Math.floor(targetCity.agriculture * 20);
    nextResources.gold += spoilGold;
    nextResources.food += spoilFood;
    nextResources.reputation += 5;

    logs.push({
      text: `⚔️ 决胜：我军突破【${targetCity.name}】防线，敌军阵脚瓦解，城中守备开始溃散。`,
      type: 'success',
    });

    let battleLog = `⚔️ 战斗胜利！您成功攻占了【${targetCity.name}】！我军损失 ${troopsLost} 兵力。缴获资金 ${spoilGold}，粮草 ${spoilFood}。`;
    if (capturedNames.length > 0) {
      battleLog += `俘虏并收编了敌将：${capturedNames.join(', ')}。`;
    }
    logs.push({ text: battleLog, type: 'success' });

    const remainingEnemyCities = Object.values(nextCities).filter(city => city.owner !== 'player');
    if (remainingEnemyCities.length === 0) {
      logs.push({
        text: '⭐⭐⭐ 捷报！您已攻克所有敌城，一统天下，成就霸业！ ⭐⭐⭐',
        type: 'success',
      });
    }

    return {
      cities: nextCities,
      officers: nextOfficers,
      resources: nextResources,
      logs,
      gameResult: remainingEnemyCities.length === 0 ? 'victory' : null,
    };
  }

  const troopsLost = clampLoss(calculateDefeatLosses(myCity.troops) * strategy.defeatLossMultiplier);
  nextCities[myCity.id] = {
    ...nextCities[myCity.id],
    troops: Math.max(0, nextCities[myCity.id].troops - troopsLost),
    morale: Math.max(10, nextCities[myCity.id].morale - GAME_BALANCE.military.defeatMoralePenalty),
  };
  nextCities[targetCity.id] = {
    ...nextCities[targetCity.id],
    troops: Math.max(0, Math.floor(nextCities[targetCity.id].troops * GAME_BALANCE.military.defenderTroopLossRateOnRepel * strategy.repelLossMultiplier)),
  };
  logs.push({
    text: `⚔️ 决胜：敌军依托地形稳住阵脚，我军攻势受挫，被迫撤回【${myCity.name}】整顿。`,
    type: 'error',
  });
  logs.push({
    text: `⚔️ 战斗失败！敌方城防坚固，我军大败而归，损失了 ${troopsLost} 兵力，士气大跌！`,
    type: 'error',
  });

  return {
    cities: nextCities,
    officers: nextOfficers,
    resources: nextResources,
    logs,
    gameResult: null,
  };
}