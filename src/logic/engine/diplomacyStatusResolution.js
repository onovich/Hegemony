import { GAME_BALANCE } from '../../data/gameConfig.js';

export function establishCeasefire(faction, turns = GAME_BALANCE.diplomacy.ceasefireTurns) {
  return {
    ...faction,
    ceasefireTurns: Math.max(faction.ceasefireTurns ?? 0, turns),
  };
}

export function tickDiplomacyStatuses(nextFactions) {
  const logs = [];

  Object.values(nextFactions)
    .filter(faction => faction.id !== 'player' && (faction.ceasefireTurns ?? 0) > 0)
    .forEach((faction) => {
      const nextTurns = Math.max(0, (faction.ceasefireTurns ?? 0) - 1);
      nextFactions[faction.id] = {
        ...nextFactions[faction.id],
        ceasefireTurns: nextTurns,
      };

      if (nextTurns === 0) {
        logs.push({
          text: `与【${faction.name}】的停战约定已经到期。`,
          type: 'system',
        });
      }
    });

  return { logs };
}