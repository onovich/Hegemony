export const OFFICER_SPECIALTIES = {
  'founding-ruler': {
    name: '开基之主',
    shortLabel: '全局统筹',
    description: '出任太守时强化政务与民心，出任主将时提升统军稳定性。',
    bonuses: {
      governor: { pol: 8, cha: 6 },
      commander: { cmd: 5, cha: 4 },
    },
  },
  'imperial-strategist': {
    name: '治世能臣',
    shortLabel: '军政双强',
    description: '兼顾政务与军务，适合都城与中枢城池。',
    bonuses: {
      governor: { pol: 10, int: 4, cha: 4 },
      commander: { cmd: 6, int: 3 },
    },
  },
  'frontline-vanguard': {
    name: '前阵先锋',
    shortLabel: '守战先登',
    description: '出任主将时更能稳定军心，适合军事型城市。',
    bonuses: {
      commander: { cmd: 10, cha: 4 },
    },
  },
  'benevolent-ruler': {
    name: '仁德怀众',
    shortLabel: '安民治城',
    description: '出任太守时更擅长安抚人心并维持经营。',
    bonuses: {
      governor: { pol: 6, cha: 10 },
      commander: { cha: 4 },
    },
  },
  'war-god': {
    name: '军神威震',
    shortLabel: '破阵强攻',
    description: '出任主将时极大增强军务表现。',
    bonuses: {
      commander: { cmd: 12, cha: 3 },
    },
  },
  'river-king': {
    name: '江东调和',
    shortLabel: '守成安边',
    description: '擅长兼顾财政与军心，适合商贸重镇。',
    bonuses: {
      governor: { pol: 7, cha: 7 },
      commander: { cmd: 4, cha: 5 },
    },
  },
  'grand-commander': {
    name: '都督奇谋',
    shortLabel: '统军机略',
    description: '出任主将时兼具统率与谋略，亦可辅佐政务。',
    bonuses: {
      governor: { int: 4, pol: 4 },
      commander: { cmd: 9, int: 5, cha: 3 },
    },
  },
  'dragon-charge': {
    name: '龙胆突阵',
    shortLabel: '机动攻坚',
    description: '擅长快速突击与稳定士气，适合主将位置。',
    bonuses: {
      commander: { cmd: 10, cha: 5 },
    },
  },
  'sleeping-dragon': {
    name: '卧龙经世',
    shortLabel: '内政宗师',
    description: '出任太守时大幅强化治政与谋略。',
    bonuses: {
      governor: { int: 8, pol: 12, cha: 4 },
      commander: { int: 4, cmd: 4 },
    },
  },
  'silver-tongue': {
    name: '倾国说客',
    shortLabel: '魅力游说',
    description: '出任太守时强化魅力与情报统筹，更适合外事与商贸城市。',
    bonuses: {
      governor: { cha: 12, int: 4, pol: 3 },
    },
  },
  'ghost-strategist': {
    name: '鬼谋奇佐',
    shortLabel: '权谋帷幄',
    description: '擅长为城池提供高质量谋略与政务支持。',
    bonuses: {
      governor: { int: 6, pol: 8 },
      commander: { int: 6, cmd: 4 },
    },
  },
  'peerless-warrior': {
    name: '飞将无双',
    shortLabel: '极致猛攻',
    description: '出任主将时拥有最强的纯军事爆发。',
    bonuses: {
      commander: { cmd: 14, cha: 2 },
    },
  },
};