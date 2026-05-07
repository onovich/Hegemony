import { GAME_BALANCE } from '../../data/gameConfig.js';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(percent) {
  return Math.random() * 100 < percent;
}

function getCityRoleConfig(city) {
  return GAME_BALANCE.cityRoles[city.role] ?? {
    label: '均衡型',
    goldIncomeMultiplier: 1,
    foodIncomeMultiplier: 1,
    draftMultiplier: 1,
  };
}

function getEffectiveStat(officers, stat) {
  if (!officers.length) {
    return 0;
  }

  const sorted = [...officers].sort((left, right) => right[stat] - left[stat]);
  const leadOfficer = sorted[0];
  const lead = Math.floor((leadOfficer?.[stat] ?? 0) * getOfficerContributionMultiplier(leadOfficer?.loyalty ?? 100));
  const support = sorted.slice(1).reduce(
    (total, officer) => total + officer[stat] * getOfficerContributionMultiplier(officer.loyalty ?? 100),
    0
  );

  return lead + Math.floor(support * GAME_BALANCE.supportStatFactor);
}

export function getOfficerContributionMultiplier(loyalty) {
  if (loyalty >= GAME_BALANCE.loyalty.stableThreshold) {
    return GAME_BALANCE.loyalty.stableMultiplier;
  }

  if (loyalty >= GAME_BALANCE.loyalty.warningThreshold) {
    return GAME_BALANCE.loyalty.warningMultiplier;
  }

  if (loyalty >= GAME_BALANCE.loyalty.desertionThreshold) {
    return GAME_BALANCE.loyalty.unrestMultiplier;
  }

  return GAME_BALANCE.loyalty.desertionMultiplier;
}

export function shouldOfficerCauseUnrest(loyalty) {
  return loyalty <= GAME_BALANCE.loyalty.unrestThreshold && chance(GAME_BALANCE.loyalty.unrestChance);
}

export function shouldOfficerEmbezzle(loyalty) {
  return loyalty <= GAME_BALANCE.loyalty.embezzleThreshold && chance(GAME_BALANCE.loyalty.embezzleChance);
}

export function shouldOfficerDesert(loyalty) {
  if (loyalty > GAME_BALANCE.loyalty.desertionThreshold) {
    return false;
  }

  const bonusChance = GAME_BALANCE.loyalty.desertionThreshold - loyalty;
  return chance(GAME_BALANCE.loyalty.desertionBaseChance + bonusChance);
}

export function getUnrestMoraleLoss() {
  return randInt(
    GAME_BALANCE.loyalty.unrestMoraleLossMin,
    GAME_BALANCE.loyalty.unrestMoraleLossMax
  );
}

export function getEmbezzleGoldLoss() {
  return randInt(
    GAME_BALANCE.loyalty.embezzleGoldLossMin,
    GAME_BALANCE.loyalty.embezzleGoldLossMax
  );
}

export function getEffectiveFactionStats(officers) {
  return {
    cmd: getEffectiveStat(officers, 'cmd'),
    int: getEffectiveStat(officers, 'int'),
    pol: getEffectiveStat(officers, 'pol'),
    cha: getEffectiveStat(officers, 'cha'),
  };
}

export function advanceTurnEconomy({ city, officerCount }) {
  const role = getCityRoleConfig(city);

  return {
    goldIncome: Math.floor(city.commerce * GAME_BALANCE.economy.goldPerCommerce * role.goldIncomeMultiplier),
    foodIncome: Math.floor(city.agriculture * GAME_BALANCE.economy.foodPerAgriculture * role.foodIncomeMultiplier),
    troopUpkeep: Math.floor(city.troops * GAME_BALANCE.economy.troopFoodUpkeep),
    officerSalary: officerCount * GAME_BALANCE.economy.officerSalaryGold,
  };
}

export function advanceFactionEconomy({ cities, officerCount }) {
  const totals = cities.reduce(
    (accumulator, city) => {
      const economy = advanceTurnEconomy({ city, officerCount: 0 });

      return {
        goldIncome: accumulator.goldIncome + economy.goldIncome,
        foodIncome: accumulator.foodIncome + economy.foodIncome,
        troopUpkeep: accumulator.troopUpkeep + economy.troopUpkeep,
      };
    },
    { goldIncome: 0, foodIncome: 0, troopUpkeep: 0 }
  );

  return {
    ...totals,
    officerSalary: officerCount * GAME_BALANCE.economy.officerSalaryGold,
  };
}

export function getLoyaltyPenaltyForBankruptcy() {
  return randInt(
    GAME_BALANCE.economy.bankruptcyLoyaltyLossMin,
    GAME_BALANCE.economy.bankruptcyLoyaltyLossMax
  );
}

export function getMoralePenaltyForStarvation() {
  return randInt(
    GAME_BALANCE.economy.starvationMoraleLossMin,
    GAME_BALANCE.economy.starvationMoraleLossMax
  );
}

export function getExplorationBonus(officers) {
  const stats = getEffectiveFactionStats(officers);
  return Math.floor(stats.cha / GAME_BALANCE.exploration.bonusDivisor);
}

export function calculateDevelopmentGain(type, stats) {
  if (type === 'agriculture') {
    return Math.floor(
      stats.pol * GAME_BALANCE.development.agriculturePolFactor +
        randInt(GAME_BALANCE.development.bonusMin, GAME_BALANCE.development.bonusMax)
    );
  }

  if (type === 'commerce') {
    return Math.floor(
      stats.pol * GAME_BALANCE.development.commercePolFactor +
        randInt(GAME_BALANCE.development.bonusMin, GAME_BALANCE.development.bonusMax)
    );
  }

  return Math.floor(
    stats.cmd * GAME_BALANCE.development.defenseCmdFactor +
      randInt(GAME_BALANCE.development.bonusMin, GAME_BALANCE.development.bonusMax)
  );
}

export function calculateDraftRecruits({ city, effectiveCha, reputation }) {
  const role = getCityRoleConfig(city);

  return Math.floor(
    (
      GAME_BALANCE.military.draftBase +
        effectiveCha * GAME_BALANCE.military.draftChaFactor +
        reputation * GAME_BALANCE.military.draftReputationFactor +
        city.commerce * GAME_BALANCE.military.draftCityCommerceFactor +
        randInt(GAME_BALANCE.military.draftRandMin, GAME_BALANCE.military.draftRandMax)
    ) * role.draftMultiplier
  );
}

export function getCityRoleLabel(city) {
  return getCityRoleConfig(city).label;
}

export function calculateTrainingBoost(effectiveCmd) {
  return Math.floor(
    effectiveCmd * GAME_BALANCE.military.trainCmdFactor +
      randInt(GAME_BALANCE.military.trainRandMin, GAME_BALANCE.military.trainRandMax)
  );
}

export function calculateAttackFoodCost(troops) {
  return Math.floor(troops * GAME_BALANCE.military.attackFoodPerTroop);
}

export function calculateBattlePower({ troops, cmd, morale, defense = 0, isDefender = false }) {
  const commandFactor = 1 + cmd / GAME_BALANCE.military.commandDivisor;
  const moraleFactor = GAME_BALANCE.military.moraleBase + morale / GAME_BALANCE.military.moraleDivisor;
  const defenseFactor = isDefender ? 1 + defense / GAME_BALANCE.military.defenseDivisor : 1;
  const variance = randInt(GAME_BALANCE.military.battleVarianceMin, GAME_BALANCE.military.battleVarianceMax) / 100;

  return troops * commandFactor * moraleFactor * defenseFactor * variance;
}

export function calculateVictoryLosses(enemyTroops) {
  return Math.floor(
    enemyTroops * GAME_BALANCE.military.victoryLossRate +
      randInt(GAME_BALANCE.military.victoryLossMin, GAME_BALANCE.military.victoryLossMax)
  );
}

export function calculateDefeatLosses(myTroops) {
  return Math.floor(
    myTroops * GAME_BALANCE.military.defeatLossRate +
      randInt(GAME_BALANCE.military.defeatLossMin, GAME_BALANCE.military.defeatLossMax)
  );
}

export function getCapturedCityTroops(enemyTroops) {
  return Math.floor(enemyTroops * GAME_BALANCE.military.captureTroopRetentionRate);
}

export function calculateRecruitChance({ rulerCha, officerInt, officerLoyalty }) {
  return Math.max(
    10,
    Math.floor(
      GAME_BALANCE.personnel.recruitBaseChance +
        rulerCha * GAME_BALANCE.personnel.recruitChaFactor -
        officerInt * GAME_BALANCE.personnel.recruitIntFactor -
        officerLoyalty * GAME_BALANCE.personnel.recruitLoyaltyFactor +
        randInt(GAME_BALANCE.personnel.recruitRandMin, GAME_BALANCE.personnel.recruitRandMax)
    )
  );
}

export function calculateRewardBoost() {
  return randInt(GAME_BALANCE.personnel.rewardMin, GAME_BALANCE.personnel.rewardMax);
}

export function getGiftRelationBoost(pol) {
  return Math.floor(
    pol * GAME_BALANCE.diplomacy.giftPolFactor +
      randInt(GAME_BALANCE.diplomacy.giftMin, GAME_BALANCE.diplomacy.giftMax)
  );
}

export function getAlienateSuccessChance(playerInt, targetInt) {
  return playerInt > targetInt
    ? GAME_BALANCE.diplomacy.alienateHighSuccessChance
    : GAME_BALANCE.diplomacy.alienateLowSuccessChance;
}

export function getAlienateLoyaltyDrop() {
  return randInt(
    GAME_BALANCE.diplomacy.alienateLoyaltyMin,
    GAME_BALANCE.diplomacy.alienateLoyaltyMax
  );
}

export function getAiGrowth() {
  return {
    troops: randInt(GAME_BALANCE.ai.monthlyTroopsMin, GAME_BALANCE.ai.monthlyTroopsMax),
    agriculture: randInt(GAME_BALANCE.ai.monthlyAgricultureMin, GAME_BALANCE.ai.monthlyAgricultureMax),
    commerce: randInt(GAME_BALANCE.ai.monthlyCommerceMin, GAME_BALANCE.ai.monthlyCommerceMax),
  };
}