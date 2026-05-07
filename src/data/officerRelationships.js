export const OFFICER_RELATION_PROFILES = {
  player_ruler: {
    alignment: 'order',
    bonds: ['zhaoyun', 'zhugeliang'],
    rivals: ['lvbu'],
  },
  caocao: {
    alignment: 'ambition',
    bonds: ['xiahoudun', 'guojia'],
    rivals: ['liubei', 'guanyu'],
  },
  xiahoudun: {
    alignment: 'honor',
    bonds: ['caocao'],
    rivals: [],
  },
  liubei: {
    alignment: 'benevolence',
    bonds: ['guanyu', 'zhaoyun', 'zhugeliang'],
    rivals: ['caocao'],
  },
  guanyu: {
    alignment: 'honor',
    bonds: ['liubei'],
    rivals: ['caocao'],
  },
  sunquan: {
    alignment: 'order',
    bonds: ['zhouyu'],
    rivals: [],
  },
  zhouyu: {
    alignment: 'genius',
    bonds: ['sunquan'],
    rivals: ['zhugeliang'],
  },
  zhaoyun: {
    alignment: 'honor',
    bonds: ['liubei', 'player_ruler'],
    rivals: [],
  },
  zhugeliang: {
    alignment: 'genius',
    bonds: ['liubei', 'player_ruler'],
    rivals: ['zhouyu'],
  },
  diaochan: {
    alignment: 'intrigue',
    bonds: [],
    rivals: ['lvbu'],
  },
  guojia: {
    alignment: 'genius',
    bonds: ['caocao'],
    rivals: [],
  },
  lvbu: {
    alignment: 'ferocity',
    bonds: [],
    rivals: ['player_ruler', 'caocao', 'liubei'],
  },
};

export const ALIGNMENT_RELATION_SCORES = {
  order: { order: 6, honor: 5, benevolence: 4, ambition: 2, genius: 2, intrigue: -2, ferocity: -5 },
  honor: { order: 5, honor: 6, benevolence: 4, ambition: -1, genius: 1, intrigue: -3, ferocity: -2 },
  benevolence: { order: 4, honor: 4, benevolence: 6, ambition: -3, genius: 2, intrigue: -4, ferocity: -6 },
  ambition: { order: 2, honor: -1, benevolence: -3, ambition: 6, genius: 4, intrigue: 2, ferocity: 1 },
  genius: { order: 2, honor: 1, benevolence: 2, ambition: 4, genius: 6, intrigue: 3, ferocity: -1 },
  intrigue: { order: -2, honor: -3, benevolence: -4, ambition: 2, genius: 3, intrigue: 6, ferocity: 1 },
  ferocity: { order: -5, honor: -2, benevolence: -6, ambition: 1, genius: -1, intrigue: 1, ferocity: 6 },
};