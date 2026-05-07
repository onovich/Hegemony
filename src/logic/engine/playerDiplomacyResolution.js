import { GAME_BALANCE } from '../../data/gameConfig.js';
import { establishCeasefire, escalateHostility } from './diplomacyStatusResolution.js';
import {
  getAidPackage,
  getAlienateLoyaltyDrop,
  getAlienateSuccessChance,
  getGiftRelationBoost,
  getPersuadeSuccessChance,
  getPressureRelationDrop,
} from './gameBalance.js';

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (percent) => Math.random() * 100 < percent;

function clearOfficerAssignmentsFromCities(cities, officerId) {
  let changed = false;

  const nextCities = Object.fromEntries(
    Object.entries(cities).map(([cityId, city]) => {
      const governorId = city.governorId === officerId ? null : city.governorId;
      const commanderId = city.commanderId === officerId ? null : city.commanderId;

      if (governorId !== city.governorId || commanderId !== city.commanderId) {
        changed = true;
      }

      return [
        cityId,
        {
          ...city,
          governorId,
          commanderId,
        },
      ];
    })
  );

  return changed ? nextCities : cities;
}

export function resolvePlayerDiplomacyAction({
  action,
  factionId,
  factions,
  officers,
  cities,
  resources,
  stats,
  activeCityId,
  activeCityName,
}) {
  const targetFaction = factions[factionId];
  const result = {
    resources,
    factions,
    officers,
    cities,
    logs: [],
    refundAp: false,
  };

  const rejectAction = (text, type = 'error') => ({
    ...result,
    logs: [{ text, type }],
    refundAp: true,
  });

  if (!targetFaction) {
    return rejectAction('使者未能找到目标势力。');
  }

  if (action === 'gift') {
    const cost = GAME_BALANCE.diplomacy.giftGoldCost;
    if (resources.gold < cost) {
      return rejectAction(`赠礼需要 ${cost} 金，资金不足！`);
    }

    result.resources = {
      ...resources,
      gold: resources.gold - cost,
    };

    const relationBoost = getGiftRelationBoost(stats.pol);
    const nextRelation = Math.min(100, targetFaction.relation + relationBoost);
    let nextFactionState = {
      ...targetFaction,
      relation: nextRelation,
    };
    const previousCeasefireTurns = targetFaction.ceasefireTurns ?? 0;

    if (nextRelation >= GAME_BALANCE.diplomacy.tradeThreshold) {
      nextFactionState = establishCeasefire(nextFactionState);
    }

    result.factions = {
      ...factions,
      [factionId]: nextFactionState,
    };
    result.logs.push({
      text: `派遣使者向【${targetFaction.name}】献上厚礼，双方友好度提升了 ${relationBoost}。`,
      type: 'normal',
    });

    if (targetFaction.relation < GAME_BALANCE.diplomacy.tradeThreshold && nextRelation >= GAME_BALANCE.diplomacy.tradeThreshold) {
      result.logs.push({
        text: `【${targetFaction.name}】已进入通商友邦状态，并约定停战 ${GAME_BALANCE.diplomacy.ceasefireTurns} 个月。`,
        type: 'success',
      });
    } else if (nextRelation >= GAME_BALANCE.diplomacy.tradeThreshold && previousCeasefireTurns < GAME_BALANCE.diplomacy.ceasefireTurns) {
      result.logs.push({
        text: `与【${targetFaction.name}】的停战约定刷新为 ${GAME_BALANCE.diplomacy.ceasefireTurns} 个月。`,
        type: 'system',
      });
    }

    return result;
  }

  if (action === 'aid') {
    if (targetFaction.hostilityTurns > 0) {
      return rejectAction(`【${targetFaction.name}】正与我方敌意升温，当前不可能回应求援。`);
    }

    if (targetFaction.relation < GAME_BALANCE.diplomacy.tradeThreshold) {
      return rejectAction(`只有通商友邦才会出手相助，当前与【${targetFaction.name}】的关系还不够稳固。`);
    }

    const aidPackage = getAidPackage(stats.pol, stats.cha);
    const nextRelation = Math.max(0, targetFaction.relation - aidPackage.relationCost);

    result.resources = {
      ...resources,
      gold: resources.gold + aidPackage.gold,
      food: resources.food + aidPackage.food,
    };
    result.factions = {
      ...factions,
      [factionId]: {
        ...targetFaction,
        relation: nextRelation,
      },
    };
    result.logs.push({
      text: `你向【${targetFaction.name}】陈情求援，对方拨来 ${aidPackage.gold} 金、${aidPackage.food} 粮以资军政。`,
      type: 'success',
    });
    result.logs.push({
      text: `这次求援消耗了双方 ${aidPackage.relationCost} 点交情。`,
      type: 'system',
    });

    if (targetFaction.relation >= GAME_BALANCE.diplomacy.tradeThreshold && nextRelation < GAME_BALANCE.diplomacy.tradeThreshold) {
      result.logs.push({
        text: `【${targetFaction.name}】认为我方索求过繁，双方暂时退出通商友邦状态。`,
        type: 'warning',
      });
    }

    return result;
  }

  if (action === 'pressure') {
    const cost = GAME_BALANCE.diplomacy.pressureGoldCost;
    if (resources.gold < cost) {
      return rejectAction(`施压需要 ${cost} 金用于军使、边备与调度，资金不足！`);
    }

    const relationDrop = getPressureRelationDrop(stats.cmd, stats.cha);
    const nextRelation = Math.max(0, targetFaction.relation - relationDrop);
    const brokeCeasefire = (targetFaction.ceasefireTurns ?? 0) > 0;

    result.resources = {
      ...resources,
      gold: resources.gold - cost,
      reputation: brokeCeasefire
        ? Math.max(0, resources.reputation - GAME_BALANCE.diplomacy.ceasefireBreakReputationPenalty)
        : resources.reputation,
    };
    result.factions = {
      ...factions,
      [factionId]: escalateHostility({
        ...targetFaction,
        relation: nextRelation,
      }),
    };
    result.logs.push({
      text: `你向【${targetFaction.name}】发出严词军书并整备边军，双方关系下降了 ${relationDrop}。`,
      type: 'warning',
    });

    if (brokeCeasefire) {
      result.logs.push({
        text: `你主动撕毁了与【${targetFaction.name}】的停战约定，名望下降 ${GAME_BALANCE.diplomacy.ceasefireBreakReputationPenalty}。`,
        type: 'error',
      });
    }

    return result;
  }

  if (action === 'persuade') {
    const cost = GAME_BALANCE.diplomacy.persuadeGoldCost;
    if (resources.gold < cost) {
      return rejectAction(`劝降需要 ${cost} 金用于密使、馈赠与安置，资金不足！`);
    }

    const targetOfficer = [...officers]
      .filter(officer => officer.faction === factionId && officer.state === 'active' && officer.id !== targetFaction.ruler)
      .sort((left, right) => (left.loyalty - right.loyalty) || (left.int - right.int))[0];

    if (!targetOfficer) {
      return rejectAction(`密探回报：【${targetFaction.name}】当前没有可被单独策反的现役将领。`);
    }

    result.resources = {
      ...resources,
      gold: resources.gold - cost,
    };
    result.factions = {
      ...factions,
      [factionId]: escalateHostility(targetFaction, GAME_BALANCE.diplomacy.covertHostilityTurns),
    };

    const successChance = getPersuadeSuccessChance({
      playerCha: stats.cha,
      playerInt: stats.int,
      targetInt: targetOfficer.int,
      targetLoyalty: targetOfficer.loyalty,
      hostilityBonus: (targetFaction.hostilityTurns ?? 0) > 0 || targetFaction.relation <= GAME_BALANCE.diplomacy.hostileThreshold
        ? GAME_BALANCE.diplomacy.persuadeHostilityBonus
        : 0,
    });

    if (chance(successChance)) {
      result.cities = clearOfficerAssignmentsFromCities(cities, targetOfficer.id);
      result.officers = officers.map(officer => officer.id === targetOfficer.id
        ? {
          ...officer,
          faction: 'player',
          cityId: activeCityId,
          state: 'active',
          loyalty: GAME_BALANCE.diplomacy.persuadeJoinLoyalty,
        }
        : officer);
      result.logs.push({
        text: `密使成功说动【${targetFaction.name}】武将【${targetOfficer.name}】倒戈来投，现已前往【${activeCityName}】听命。`,
        type: 'success',
      });
    } else {
      result.logs.push({
        text: `劝降未成！【${targetOfficer.name}】暂未动摇，只是让【${targetFaction.name}】对我方更加戒备。`,
        type: 'warning',
      });
    }

    return result;
  }

  if (action === 'alienate') {
    const cost = GAME_BALANCE.diplomacy.alienateGoldCost;
    if (resources.gold < cost) {
      return rejectAction(`散布流言需要 ${cost} 金作为活动经费，资金不足！`);
    }

    result.resources = {
      ...resources,
      gold: resources.gold - cost,
    };
    result.factions = {
      ...factions,
      [factionId]: escalateHostility(targetFaction, GAME_BALANCE.diplomacy.covertHostilityTurns),
    };

    const enemyOfficers = officers.filter(officer => officer.faction === factionId);
    if (enemyOfficers.length > 0) {
      const targetOfficer = enemyOfficers[randInt(0, enemyOfficers.length - 1)];

      if (chance(getAlienateSuccessChance(stats.int, targetOfficer.int))) {
        const loyaltyDrop = getAlienateLoyaltyDrop();
        result.officers = officers.map(officer => officer.id === targetOfficer.id
          ? { ...officer, loyalty: Math.max(0, officer.loyalty - loyaltyDrop) }
          : officer);
        result.logs.push({
          text: `离间计成功！散布流言使【${targetFaction.name}】的武将【${targetOfficer.name}】心生疑隙，忠诚下降！`,
          type: 'success',
        });
      } else {
        result.logs.push({
          text: `离间计失败！【${targetFaction.name}】识破了我们的流言蜚语。`,
          type: 'normal',
        });
      }
    } else {
      result.logs.push({
        text: `细作回报：【${targetFaction.name}】麾下暂无知名武将可供离间。`,
        type: 'normal',
      });
    }

    return result;
  }

  return rejectAction('当前外交动作无法执行。');
}