import { advanceFactionEconomy } from './gameBalance.js';
import { resolvePlayerMonthlyTurn } from './playerTurnResolution.js';
import { resolveAiFactionCityManagement } from './aiCityManagement.js';
import { resolveAiMonthlyBattles } from './aiBattleResolution.js';

export function resolveMonthlyTurnFlow({
  nextCities,
  nextOfficers,
  resources,
  factions,
  factionRulerIds,
  getFactionCitiesFromState,
  getFactionOfficersFromState,
  getCityProfileFromState,
  getCityRoleLabel,
}) {
  const myCities = getFactionCitiesFromState('player');
  const myOfficers = getFactionOfficersFromState('player');
  const economy = advanceFactionEconomy({
    cities: myCities,
    officerCount: myOfficers.length,
    getCityStats: (city) => getCityProfileFromState(city.id, 'player').economyStats,
  });
  const playerTurnResult = resolvePlayerMonthlyTurn({
    nextCities,
    nextOfficers,
    resources,
    factions,
    factionRulerIds,
    economy,
    getFactionCitiesFromState,
    getFactionOfficersFromState,
    getCityProfileFromState,
    getCityRoleLabel,
  });
  const logs = [...playerTurnResult.logs];

  const aiFactionIds = [...new Set(Object.values(nextCities).filter(city => city.owner !== 'player').map(city => city.owner))];

  aiFactionIds.forEach(factionId => {
    const aiManagement = resolveAiFactionCityManagement({
      factionId,
      factionName: factions[factionId].name,
      cities: getFactionCitiesFromState(factionId),
      officers: nextOfficers,
    });

    Object.entries(aiManagement.cityUpdates).forEach(([cityId, updatedCity]) => {
      nextCities[cityId] = updatedCity;
    });

    logs.push(...aiManagement.logs);
  });

  const aiBattleResult = resolveAiMonthlyBattles({
    nextCities,
    nextOfficers,
    factions,
    getFactionCitiesFromState,
    getCityProfileFromState,
  });

  logs.push(...aiBattleResult.logs);

  const remainingPlayerCities = Object.values(nextCities).filter(city => city.owner === 'player');
  const enemyCities = Object.values(nextCities).filter(city => city.owner !== 'player');

  if (remainingPlayerCities.length === 0) {
    logs.push({
      text: '☠️ 我方城池尽失，基业崩溃，霸业未成而中道崩殂！',
      type: 'error',
    });

    return {
      resources: playerTurnResult.resources,
      logs,
      gameResult: 'defeat',
    };
  }

  if (enemyCities.length === 0) {
    logs.push({
      text: '⭐⭐⭐ 捷报！您已攻克所有敌城，一统天下，成就霸业！ ⭐⭐⭐',
      type: 'success',
    });

    return {
      resources: playerTurnResult.resources,
      logs,
      gameResult: 'victory',
    };
  }

  return {
    resources: playerTurnResult.resources,
    logs,
    gameResult: null,
  };
}