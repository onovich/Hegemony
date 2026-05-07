import { GAME_BALANCE } from '../../data/gameConfig.js';
import {
  calculateBattlePower,
  calculateDefeatLosses,
  calculateVictoryLosses,
  getCapturedCityTroops,
} from './gameBalance.js';

function chance(percent) {
  return Math.random() * 100 < percent;
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
}) {
  const targetFaction = targetCity.owner;
  const nextCities = Object.fromEntries(
    Object.entries(cities).map(([cityId, city]) => [cityId, { ...city }]),
  );
  const nextOfficers = officers.map(officer => ({ ...officer }));
  const nextResources = { ...resources };
  const logs = [];

  const myPower = calculateBattlePower({
    troops: myCity.troops,
    cmd: attackerStats.cmd,
    morale: myCity.morale,
  });
  const enemyPower = calculateBattlePower({
    troops: targetCity.troops,
    cmd: defenderStats.cmd || GAME_BALANCE.military.defaultEnemyCommand,
    morale: targetCity.morale,
    defense: targetCity.defense,
    isDefender: true,
  });

  if (myPower > enemyPower) {
    const troopsLost = calculateVictoryLosses(targetCity.troops);
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

  const troopsLost = calculateDefeatLosses(myCity.troops);
  nextCities[myCity.id] = {
    ...nextCities[myCity.id],
    troops: Math.max(0, nextCities[myCity.id].troops - troopsLost),
    morale: Math.max(10, nextCities[myCity.id].morale - GAME_BALANCE.military.defeatMoralePenalty),
  };
  nextCities[targetCity.id] = {
    ...nextCities[targetCity.id],
    troops: Math.max(0, Math.floor(nextCities[targetCity.id].troops * GAME_BALANCE.military.defenderTroopLossRateOnRepel)),
  };
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