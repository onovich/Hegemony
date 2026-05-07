export const CITY_ROLE_EVENT_POOLS = {
  capital: [
    {
      id: 'capital_audience',
      type: 'success',
      text: '【{{city}}】朝议安定四方，士族与商旅齐聚，带来 {{gold}} 金与 {{reputation}} 点名望。',
      effects: {
        gold: [140, 240],
        reputation: [1, 3],
      },
    },
    {
      id: 'capital_archives',
      type: 'success',
      text: '【{{city}}】整理府库档案，政令通达，商业增加 {{commerce}}，城中士气提升 {{morale}}。',
      effects: {
        commerce: [2, 5],
        morale: [2, 5],
      },
    },
  ],
  agriculture: [
    {
      id: 'agriculture_harvest',
      type: 'success',
      text: '【{{city}}】风调雨顺，田亩丰熟，获得 {{food}} 粮草，农业增加 {{agriculture}}。',
      effects: {
        food: [700, 1400],
        agriculture: [3, 7],
      },
    },
    {
      id: 'agriculture_irrigation',
      type: 'success',
      text: '【{{city}}】沟渠修整见效，农业增加 {{agriculture}}，士气提升 {{morale}}。',
      effects: {
        agriculture: [2, 5],
        morale: [3, 6],
      },
    },
  ],
  commerce: [
    {
      id: 'commerce_convoy',
      type: 'success',
      text: '【{{city}}】商队满载而归，带来 {{gold}} 金，商业增加 {{commerce}}。',
      effects: {
        gold: [180, 320],
        commerce: [3, 6],
      },
    },
    {
      id: 'commerce_market_fair',
      type: 'success',
      text: '【{{city}}】市集大开，名流云集，获得 {{gold}} 金与 {{reputation}} 点名望。',
      effects: {
        gold: [120, 220],
        reputation: [1, 2],
      },
    },
  ],
  military: [
    {
      id: 'military_drill',
      type: 'success',
      text: '【{{city}}】校场操练有成，守军士气提升 {{morale}}，城防增加 {{defense}}。',
      effects: {
        morale: [4, 8],
        defense: [2, 5],
      },
    },
    {
      id: 'military_supply',
      type: 'success',
      text: '【{{city}}】整编军备与仓储，获得 {{food}} 粮草，守军士气提升 {{morale}}。',
      effects: {
        food: [300, 700],
        morale: [3, 6],
      },
    },
  ],
};

export const CITY_UNIQUE_EVENT_POOLS = {
  luoyang: [
    {
      id: 'luoyang_old_nobles',
      type: 'success',
      text: '【{{city}}】旧都余威仍在，关中豪族进献财货，获得 {{gold}} 金与 {{reputation}} 点名望。',
      effects: {
        gold: [160, 280],
        reputation: [1, 3],
      },
    },
  ],
  xuchang: [
    {
      id: 'xuchang_rear_base',
      type: 'success',
      text: '【{{city}}】军府调度顺畅，城防增加 {{defense}}，守军士气提升 {{morale}}。',
      effects: {
        defense: [3, 6],
        morale: [3, 6],
      },
    },
  ],
  chengdu: [
    {
      id: 'chengdu_granary',
      type: 'success',
      text: '【{{city}}】蜀中仓廪充盈，获得 {{food}} 粮草，农业增加 {{agriculture}}。',
      effects: {
        food: [900, 1600],
        agriculture: [3, 6],
      },
    },
  ],
  jianye: [
    {
      id: 'jianye_river_trade',
      type: 'success',
      text: '【{{city}}】江运繁盛，商税入库，获得 {{gold}} 金，商业增加 {{commerce}}。',
      effects: {
        gold: [180, 300],
        commerce: [3, 6],
      },
    },
  ],
};