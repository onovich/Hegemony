import { GAME_BALANCE } from '../../data/gameConfig.js';
import { resolveMonthlyCityEvents } from './cityEvents.js';
import { resolveMonthlyDiplomacyEvents } from './diplomacyEvents.js';
import {
  getBorderPressureMoraleLoss,
  getEmbezzleGoldLoss,
  getHostilityPressureBonus,
  getLoyaltyPenaltyForBankruptcy,
  getMoralePenaltyForStarvation,
  getTradeIncomeBonus,
  getUnrestMoraleLoss,
  shouldOfficerCauseUnrest,
  shouldOfficerDesert,
  shouldOfficerEmbezzle,
} from './gameBalance.js';
import {
  calculateMonthlyRelationshipDrift,
  getOfficerRelationLabel,
  resolveMonthlyOfficerRelationshipEvents,
} from './officerRelationships.js';

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function resolvePlayerMonthlyTurn({
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
}) {
  const myCities = getFactionCitiesFromState('player');
  const myOfficers = getFactionOfficersFromState('player');
  const citySummary = myCities.map(city => `${city.name}[${getCityRoleLabel(city)}](农${city.agriculture}/商${city.commerce}/兵${city.troops})`).join('，');
  const otherFactions = Object.values(factions).filter(faction => faction.id !== 'player');

  let newGold = resources.gold + economy.goldIncome - economy.officerSalary;
  let newFood = resources.food + economy.foodIncome - economy.troopUpkeep;
  const logs = [
    { text: `【次月结算】获得资金 ${economy.goldIncome}，粮草 ${economy.foodIncome}；俸禄支出 ${economy.officerSalary}，军粮消耗 ${economy.troopUpkeep}。`, type: 'normal' },
    { text: `【治下城池】${citySummary}。`, type: 'system' },
  ];

  if (newGold < 0) {
    logs.push({ text: '警告：国库空虚，武将忠诚度下降！', type: 'error' });
    newGold = 0;
    const loyaltyLoss = getLoyaltyPenaltyForBankruptcy();
    nextOfficers.forEach(officer => {
      if (officer.faction === 'player' && officer.id !== 'player_ruler') {
        officer.loyalty = Math.max(0, officer.loyalty - loyaltyLoss);
      }
    });
  }

  if (newFood < 0) {
    logs.push({ text: '警告：粮草断绝，士兵哗变，士气下降！', type: 'error' });
    newFood = 0;
    const moraleDrop = getMoralePenaltyForStarvation();
    myCities.forEach(city => {
      nextCities[city.id] = {
        ...nextCities[city.id],
        troops: Math.floor(nextCities[city.id].troops * (1 - GAME_BALANCE.economy.starvationTroopLossRate)),
        morale: Math.max(0, nextCities[city.id].morale - moraleDrop),
      };
    });
  }

  const loyaltyEventLogs = [];
  const desertingOfficerIds = new Set();
  const moraleLossByCity = {};
  let stolenGold = 0;
  let tradeGold = 0;
  let tradeFood = 0;

  otherFactions.forEach(faction => {
    if (faction.relation >= GAME_BALANCE.diplomacy.tradeThreshold) {
      const tradeBonus = getTradeIncomeBonus();
      tradeGold += tradeBonus.gold;
      tradeFood += tradeBonus.food;
      loyaltyEventLogs.push({
        text: `与【${faction.name}】的通商往来带来了 ${tradeBonus.gold} 金与 ${tradeBonus.food} 粮。`,
        type: 'success',
      });
      return;
    }

    if ((faction.relation <= GAME_BALANCE.diplomacy.hostileThreshold || (faction.hostilityTurns ?? 0) > 0) && myCities.length > 0) {
      const targetCity = myCities[randInt(0, myCities.length - 1)];
      const moraleLoss = getBorderPressureMoraleLoss() + ((faction.hostilityTurns ?? 0) > 0 ? getHostilityPressureBonus() : 0);
      moraleLossByCity[targetCity.id] = (moraleLossByCity[targetCity.id] ?? 0) + moraleLoss;
      loyaltyEventLogs.push({
        text: (faction.hostilityTurns ?? 0) > 0
          ? `【${faction.name}】已至兵戈边缘，对【${targetCity.name}】施加更强边境压力，士气下降 ${moraleLoss}。`
          : `【${faction.name}】在边境施压，导致【${targetCity.name}】士气下降 ${moraleLoss}。`,
        type: 'warning',
      });
    }
  });

  nextOfficers.forEach(officer => {
    if (officer.state !== 'active' || factionRulerIds.has(officer.id)) {
      return;
    }

    const ruler = nextOfficers.find(candidate => candidate.id === factions[officer.faction]?.ruler) ?? null;
    const cityProfile = officer.cityId && officer.faction !== 'free'
      ? getCityProfileFromState(officer.cityId, officer.faction)
      : null;
    const relationshipDrift = calculateMonthlyRelationshipDrift({
      officer,
      ruler,
      governor: cityProfile?.governor ?? null,
      commander: cityProfile?.commander ?? null,
    });

    if (relationshipDrift.delta !== 0) {
      officer.loyalty = Math.max(0, Math.min(100, officer.loyalty + relationshipDrift.delta));

      if (officer.faction === 'player') {
        const rulerRelation = getOfficerRelationLabel(relationshipDrift.rulerScore);
        const leaderRelation = relationshipDrift.leaderScore !== 0
          ? `，与主官关系${getOfficerRelationLabel(relationshipDrift.leaderScore)}`
          : '';
        loyaltyEventLogs.push({
          text: relationshipDrift.delta > 0
            ? `【${officer.name}】因与主公关系${rulerRelation}${leaderRelation}，忠诚提升 ${relationshipDrift.delta}。`
            : `【${officer.name}】因与主公关系${rulerRelation}${leaderRelation}，忠诚下降 ${Math.abs(relationshipDrift.delta)}。`,
          type: relationshipDrift.delta > 0 ? 'system' : 'warning',
        });
      }
    }

    if (shouldOfficerDesert(officer.loyalty)) {
      desertingOfficerIds.add(officer.id);

      if (officer.faction === 'player') {
        loyaltyEventLogs.push({
          text: `【${officer.name}】忠诚崩溃，弃官而去，重新流落民间！`,
          type: 'error',
        });
      } else {
        loyaltyEventLogs.push({
          text: `敌方武将【${officer.name}】忠诚崩溃，脱离了【${factions[officer.faction].name}】。`,
          type: 'success',
        });
      }

      return;
    }

    if (officer.faction !== 'player') {
      return;
    }

    if (shouldOfficerEmbezzle(officer.loyalty)) {
      const goldLoss = getEmbezzleGoldLoss();
      stolenGold += goldLoss;
      loyaltyEventLogs.push({
        text: `【${officer.name}】中饱私囊，侵吞了 ${goldLoss} 金。`,
        type: 'warning',
      });
      return;
    }

    if (shouldOfficerCauseUnrest(officer.loyalty)) {
      const affectedCities = getFactionCitiesFromState('player');
      const targetCity = affectedCities[randInt(0, affectedCities.length - 1)];
      const moraleLoss = getUnrestMoraleLoss();
      moraleLossByCity[targetCity.id] = (moraleLossByCity[targetCity.id] ?? 0) + moraleLoss;
      loyaltyEventLogs.push({
        text: `【${officer.name}】消极怠政，导致【${targetCity.name}】士气下降 ${moraleLoss}。`,
        type: 'warning',
      });
    }
  });

  if (desertingOfficerIds.size > 0) {
    nextOfficers.forEach(officer => {
      if (desertingOfficerIds.has(officer.id)) {
        officer.faction = 'free';
        officer.cityId = null;
        officer.state = 'discovered';
        officer.loyalty = 40;
      }
    });
  }

  if (Object.keys(moraleLossByCity).length > 0) {
    Object.entries(moraleLossByCity).forEach(([cityId, moraleLoss]) => {
      nextCities[cityId] = {
        ...nextCities[cityId],
        morale: Math.max(0, nextCities[cityId].morale - moraleLoss),
      };
    });
  }

  const monthlyCityEvents = resolveMonthlyCityEvents({
    cities: getFactionCitiesFromState('player'),
    getCityProfile: (cityId) => getCityProfileFromState(cityId, 'player'),
  });
  const monthlyDiplomacyEvents = resolveMonthlyDiplomacyEvents({
    factions,
    playerCities: getFactionCitiesFromState('player'),
    nextCities,
  });
  const monthlyOfficerEvents = resolveMonthlyOfficerRelationshipEvents({
    cities: getFactionCitiesFromState('player'),
    officers: nextOfficers,
    factionId: 'player',
  });

  Object.entries(monthlyCityEvents.cityUpdates).forEach(([cityId, updatedCity]) => {
    nextCities[cityId] = updatedCity;
  });

  Object.entries(monthlyDiplomacyEvents.cityUpdates).forEach(([cityId, updatedCity]) => {
    nextCities[cityId] = updatedCity;
  });

  Object.entries(monthlyOfficerEvents.cityUpdates).forEach(([cityId, updatedCity]) => {
    nextCities[cityId] = updatedCity;
  });

  Object.entries(monthlyOfficerEvents.officerLoyaltyChanges).forEach(([officerId, loyaltyDelta]) => {
    const targetOfficer = nextOfficers.find(officer => officer.id === officerId);
    if (!targetOfficer) {
      return;
    }

    targetOfficer.loyalty = Math.max(0, Math.min(100, targetOfficer.loyalty + loyaltyDelta));
  });

  return {
    resources: {
      gold: Math.max(0, newGold - stolenGold + tradeGold + monthlyCityEvents.resourceDelta.gold + monthlyDiplomacyEvents.resourceDelta.gold + monthlyOfficerEvents.resourceDelta.gold),
      food: Math.max(0, newFood + tradeFood + monthlyCityEvents.resourceDelta.food + monthlyDiplomacyEvents.resourceDelta.food),
      reputation: Math.max(0, resources.reputation + monthlyCityEvents.resourceDelta.reputation + monthlyDiplomacyEvents.resourceDelta.reputation + monthlyOfficerEvents.resourceDelta.reputation),
    },
    logs: [
      ...logs,
      ...loyaltyEventLogs,
      ...monthlyCityEvents.logs,
      ...monthlyDiplomacyEvents.logs,
      ...monthlyOfficerEvents.logs,
    ],
  };
}