import { GAME_BALANCE } from '../../data/gameConfig.js';
import { ALIGNMENT_RELATION_SCORES, OFFICER_RELATION_PROFILES } from '../../data/officerRelationships.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getOfficerProfile(officer) {
  return OFFICER_RELATION_PROFILES[officer?.id] ?? { alignment: 'order', bonds: [], rivals: [] };
}

function getAlignmentScore(sourceAlignment, targetAlignment) {
  return ALIGNMENT_RELATION_SCORES[sourceAlignment]?.[targetAlignment] ?? 0;
}

export function getOfficerRelationScore(sourceOfficer, targetOfficer) {
  if (!sourceOfficer || !targetOfficer || sourceOfficer.id === targetOfficer.id) {
    return 0;
  }

  const sourceProfile = getOfficerProfile(sourceOfficer);
  const targetProfile = getOfficerProfile(targetOfficer);
  let score = getAlignmentScore(sourceProfile.alignment, targetProfile.alignment);

  if (sourceProfile.bonds.includes(targetOfficer.id) || targetProfile.bonds.includes(sourceOfficer.id)) {
    score += 16;
  }

  if (sourceProfile.rivals.includes(targetOfficer.id) || targetProfile.rivals.includes(sourceOfficer.id)) {
    score -= 16;
  }

  return score;
}

export function getOfficerRelationLabel(score) {
  if (score >= GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    return '知己';
  }

  if (score >= GAME_BALANCE.relationships.loyaltyPositiveThreshold) {
    return '亲近';
  }

  if (score <= -GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    return '死敌';
  }

  if (score <= GAME_BALANCE.relationships.loyaltyNegativeThreshold) {
    return '疏离';
  }

  return '中立';
}

export function calculateRecruitRelationshipBonus(ruler, targetOfficer) {
  const relationScore = getOfficerRelationScore(ruler, targetOfficer);
  const bonus = Math.round(relationScore * GAME_BALANCE.relationships.recruitScoreFactor);

  return clamp(bonus, -GAME_BALANCE.relationships.recruitMaxBonus, GAME_BALANCE.relationships.recruitMaxBonus);
}

function getDriftForScore(score, positiveValue, negativeValue, strongPositiveValue, strongNegativeValue) {
  if (score >= GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    return strongPositiveValue;
  }

  if (score >= GAME_BALANCE.relationships.loyaltyPositiveThreshold) {
    return positiveValue;
  }

  if (score <= -GAME_BALANCE.relationships.loyaltyStrongThreshold) {
    return strongNegativeValue;
  }

  if (score <= GAME_BALANCE.relationships.loyaltyNegativeThreshold) {
    return negativeValue;
  }

  return 0;
}

export function calculateMonthlyRelationshipDrift({ officer, ruler, governor, commander }) {
  if (!officer || !ruler || officer.id === ruler.id) {
    return { delta: 0, rulerScore: 0, leaderScore: 0 };
  }

  const rulerScore = getOfficerRelationScore(officer, ruler);
  let delta = getDriftForScore(
    rulerScore,
    GAME_BALANCE.relationships.rulerPositiveDrift,
    GAME_BALANCE.relationships.rulerNegativeDrift,
    GAME_BALANCE.relationships.rulerStrongPositiveDrift,
    GAME_BALANCE.relationships.rulerStrongNegativeDrift,
  );

  const leaders = [governor, commander].filter(Boolean).filter(leader => leader.id !== officer.id);
  const leaderScore = leaders.reduce((bestScore, leader) => {
    const relationScore = getOfficerRelationScore(officer, leader);
    return Math.abs(relationScore) > Math.abs(bestScore) ? relationScore : bestScore;
  }, 0);

  delta += getDriftForScore(
    leaderScore,
    GAME_BALANCE.relationships.leaderPositiveDrift,
    GAME_BALANCE.relationships.leaderNegativeDrift,
    GAME_BALANCE.relationships.leaderPositiveDrift,
    GAME_BALANCE.relationships.leaderNegativeDrift,
  );

  return {
    delta,
    rulerScore,
    leaderScore,
  };
}