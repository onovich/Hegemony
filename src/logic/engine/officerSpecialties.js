import { OFFICER_SPECIALTIES } from '../../data/officerSpecialties.js';
import { getDirectedFactionStats } from './gameBalance.js';

const ZERO_STATS = { cmd: 0, int: 0, pol: 0, cha: 0 };

function getSpecialtyBonus(officer, assignment) {
  if (!officer?.specialtyId) {
    return ZERO_STATS;
  }

  return OFFICER_SPECIALTIES[officer.specialtyId]?.bonuses?.[assignment] ?? ZERO_STATS;
}

function applyBonus(officer, bonus) {
  return {
    ...officer,
    cmd: officer.cmd + (bonus.cmd ?? 0),
    int: officer.int + (bonus.int ?? 0),
    pol: officer.pol + (bonus.pol ?? 0),
    cha: officer.cha + (bonus.cha ?? 0),
  };
}

export function getOfficerSpecialty(officer) {
  if (!officer?.specialtyId) {
    return null;
  }

  return OFFICER_SPECIALTIES[officer.specialtyId] ?? null;
}

export function getDirectedStatsWithSpecialty(officers, leadOfficerId = null, assignment = 'governor') {
  const leadOfficer = officers.find(officer => officer.id === leadOfficerId) ?? null;
  const specialty = getOfficerSpecialty(leadOfficer);
  const bonus = getSpecialtyBonus(leadOfficer, assignment);
  const adjustedOfficers = leadOfficer
    ? officers.map(officer => officer.id === leadOfficer.id ? applyBonus(officer, bonus) : officer)
    : officers;

  return {
    stats: getDirectedFactionStats(adjustedOfficers, leadOfficerId),
    activeSpecialty: specialty,
    specialtyBonus: bonus,
  };
}