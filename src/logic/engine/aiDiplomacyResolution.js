import { GAME_BALANCE } from '../../data/gameConfig.js';
import { establishCeasefire } from './diplomacyStatusResolution.js';
import {
  getAlienateLoyaltyDrop,
  getAlienateSuccessChance,
  getEffectiveFactionStats,
  getGiftRelationBoost,
} from './gameBalance.js';

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (percent) => Math.random() * 100 < percent;

function getAiDiplomacyProfile(faction) {
  return {
    giftChanceMultiplier: 1,
    giftBoostMultiplier: 1,
    pressureChanceMultiplier: 1,
    pressureDropMultiplier: 1,
    pressureTroopRatioMultiplier: 1,
    alienateChanceMultiplier: 1,
    ...faction.aiDiplomacyProfile,
  };
}

function getGoalDiplomacyModifiers(aiPlan = null) {
  return {
    giftChanceMultiplier: 1,
    giftBoostMultiplier: 1,
    pressureChanceMultiplier: 1,
    pressureDropMultiplier: 1,
    pressureTroopRatioMultiplier: 1,
    alienateChanceMultiplier: 1,
    ...(aiPlan?.config?.diplomacyModifiers ?? {}),
  };
}

function getFactionTroops(cities) {
  return cities.reduce((total, city) => total + city.troops, 0);
}

export function resolveAiMonthlyDiplomacy({
  nextFactions,
  nextOfficers,
  aiPlans,
  getFactionCitiesFromState,
  getFactionOfficersFromState,
}) {
  const logs = [];
  const playerCities = getFactionCitiesFromState('player');
  const playerOfficers = getFactionOfficersFromState('player');
  const playerTroops = getFactionTroops(playerCities);
  const playerCourtOfficers = playerOfficers.filter(officer => officer.id !== 'player_ruler');

  Object.values(nextFactions)
    .filter(faction => faction.id !== 'player')
    .forEach(faction => {
      const factionCities = getFactionCitiesFromState(faction.id);
      if (!factionCities.length) {
        return;
      }

      const factionOfficers = getFactionOfficersFromState(faction.id);
      const relation = nextFactions[faction.id].relation ?? 50;
      const ceasefireTurns = nextFactions[faction.id].ceasefireTurns ?? 0;
      const diplomacyProfile = getAiDiplomacyProfile(faction);
      const goalDiplomacyModifiers = getGoalDiplomacyModifiers(aiPlans?.[faction.id]);
      const factionStats = getEffectiveFactionStats(factionOfficers);
      const factionTroops = getFactionTroops(factionCities);
      const isMilitarilyStronger = playerTroops > 0
        ? factionTroops >= playerTroops * (GAME_BALANCE.ai.diplomacy.pressureTroopRatio * diplomacyProfile.pressureTroopRatioMultiplier * goalDiplomacyModifiers.pressureTroopRatioMultiplier)
        : true;

      if (
        ceasefireTurns <= 0 &&
        relation <= GAME_BALANCE.diplomacy.hostileThreshold &&
        playerCourtOfficers.length > 0 &&
        chance(GAME_BALANCE.ai.diplomacy.alienateChance * diplomacyProfile.alienateChanceMultiplier * goalDiplomacyModifiers.alienateChanceMultiplier)
      ) {
        const targetOfficer = playerCourtOfficers[randInt(0, playerCourtOfficers.length - 1)];
        if (chance(getAlienateSuccessChance(factionStats.int, targetOfficer.int))) {
          const loyaltyDrop = getAlienateLoyaltyDrop();
          const nextTarget = nextOfficers.find(officer => officer.id === targetOfficer.id);
          if (nextTarget) {
            nextTarget.loyalty = Math.max(0, nextTarget.loyalty - loyaltyDrop);
            logs.push({
              text: `【${faction.name}】暗中散布流言，动摇了我方【${nextTarget.name}】的忠诚，忠诚下降 ${loyaltyDrop}。`,
              type: 'warning',
            });
            return;
          }
        }

        logs.push({
          text: `【${faction.name}】试图离间我方将领，但暂未得手。`,
          type: 'system',
        });
        return;
      }

      if (
        ceasefireTurns <= 0 &&
        isMilitarilyStronger &&
        relation > GAME_BALANCE.diplomacy.hostileThreshold &&
        chance(GAME_BALANCE.ai.diplomacy.pressureChance * diplomacyProfile.pressureChanceMultiplier * goalDiplomacyModifiers.pressureChanceMultiplier)
      ) {
        const relationDrop = Math.max(1, Math.floor(randInt(
          GAME_BALANCE.ai.diplomacy.pressureRelationDropMin,
          GAME_BALANCE.ai.diplomacy.pressureRelationDropMax
        ) * diplomacyProfile.pressureDropMultiplier * goalDiplomacyModifiers.pressureDropMultiplier));
        const nextRelation = Math.max(0, relation - relationDrop);
        nextFactions[faction.id] = {
          ...nextFactions[faction.id],
          relation: nextRelation,
        };
        logs.push({
          text: `【${faction.name}】在边境陈兵施压，双方关系下降 ${relationDrop}。`,
          type: 'warning',
        });
        return;
      }

      if (
        relation >= GAME_BALANCE.ai.diplomacy.giftMinRelation &&
        relation < GAME_BALANCE.diplomacy.tradeThreshold &&
        chance(GAME_BALANCE.ai.diplomacy.giftChance * diplomacyProfile.giftChanceMultiplier * goalDiplomacyModifiers.giftChanceMultiplier)
      ) {
        const relationBoost = Math.max(
          GAME_BALANCE.ai.diplomacy.giftMinBoost,
          Math.floor(
            getGiftRelationBoost(factionStats.pol) *
            GAME_BALANCE.ai.diplomacy.giftBoostFactor *
            diplomacyProfile.giftBoostMultiplier *
            goalDiplomacyModifiers.giftBoostMultiplier
          )
        );
        const nextRelation = Math.min(100, relation + relationBoost);
        let updatedFaction = {
          ...nextFactions[faction.id],
          relation: nextRelation,
        };

        if (nextRelation >= GAME_BALANCE.diplomacy.tradeThreshold) {
          updatedFaction = establishCeasefire(updatedFaction);
        }

        nextFactions[faction.id] = updatedFaction;
        logs.push({
          text: `【${faction.name}】遣使修好，双方关系提升 ${relationBoost}。`,
          type: 'success',
        });

        if (relation < GAME_BALANCE.diplomacy.tradeThreshold && nextRelation >= GAME_BALANCE.diplomacy.tradeThreshold) {
          logs.push({
            text: `【${faction.name}】与我方恢复通商友邦关系，并约定停战 ${GAME_BALANCE.diplomacy.ceasefireTurns} 个月。`,
            type: 'system',
          });
        }
      }
    });

  return {
    factions: nextFactions,
    logs,
  };
}