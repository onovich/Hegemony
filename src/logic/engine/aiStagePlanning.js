import { GAME_BALANCE } from '../../data/gameConfig.js';

function sumFactionTroops(cities) {
  return cities.reduce((total, city) => total + city.troops, 0);
}

function getAverageMorale(cities) {
  if (!cities.length) {
    return 0;
  }

  return cities.reduce((total, city) => total + city.morale, 0) / cities.length;
}

function getGoalBias(faction = {}) {
  return {
    military: 1,
    development: 1,
    diplomacy: 1,
    ...(faction.aiStrategyProfile?.goalBias ?? {}),
  };
}

export function resolveAiStagePlans({ factions, getFactionCitiesFromState }) {
  const plans = {};
  const logs = [];
  const planning = GAME_BALANCE.ai.planning;
  const playerCities = getFactionCitiesFromState('player');
  const playerTroops = sumFactionTroops(playerCities);
  const playerCityCount = playerCities.length;

  Object.values(factions)
    .filter(faction => faction.id !== 'player')
    .forEach((faction) => {
      const factionCities = getFactionCitiesFromState(faction.id);
      if (!factionCities.length) {
        return;
      }

      const relation = faction.relation ?? 50;
      const factionTroops = sumFactionTroops(factionCities);
      const troopRatio = playerTroops > 0 ? factionTroops / playerTroops : 1.2;
      const averageMorale = getAverageMorale(factionCities);
      const cityCount = factionCities.length;
      const bias = getGoalBias(faction);
      const scores = {
        military:
          (troopRatio >= planning.strongTroopRatio ? 1.2 : troopRatio >= 1 ? 0.8 : 0.2)
          + (relation <= GAME_BALANCE.diplomacy.hostileThreshold ? 0.9 : relation < planning.highRelation ? 0.3 : 0)
          + (cityCount >= playerCityCount ? 0.35 : 0.1)
          + bias.military,
        development:
          (troopRatio < planning.weakTroopRatio ? 1.1 : 0.35)
          + (averageMorale < planning.lowMorale ? 0.8 : 0.2)
          + (cityCount < playerCityCount ? 0.35 : 0.1)
          + bias.development,
        diplomacy:
          (relation >= planning.highRelation ? 1.1 : relation >= GAME_BALANCE.ai.diplomacy.giftMinRelation ? 0.6 : 0.1)
          + (troopRatio < 1 ? 0.55 : 0.15)
          + (cityCount <= playerCityCount ? 0.2 : 0)
          + bias.diplomacy,
      };

      const goalId = Object.entries(scores)
        .sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'development';
      const goalConfig = GAME_BALANCE.ai.stageGoals[goalId] ?? GAME_BALANCE.ai.stageGoals.development;

      plans[faction.id] = {
        goalId,
        label: goalConfig.label,
        config: goalConfig,
      };

      logs.push({
        text: `【${faction.name}】本月转入「${goalConfig.label}」方略。`,
        type: goalId === 'military' ? 'warning' : 'system',
      });
    });

  return {
    plans,
    logs,
  };
}