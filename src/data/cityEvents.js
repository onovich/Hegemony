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
  changan: [
    {
      id: 'changan_grand_guard',
      type: 'success',
      text: '【{{city}}】军府整修宫禁，城防增加 {{defense}}，守军士气提升 {{morale}}。',
      effects: {
        defense: [3, 6],
        morale: [3, 6],
      },
    },
  ],
  chenliu: [
    {
      id: 'chenliu_recruitment_drive',
      type: 'success',
      text: '【{{city}}】募兵榜文传遍州郡，获得 {{food}} 粮草，守军士气提升 {{morale}}。',
      effects: {
        food: [350, 700],
        morale: [3, 6],
      },
    },
  ],
  ye: [
    {
      id: 'ye_hebei_granaries',
      type: 'success',
      text: '【{{city}}】河北仓廪充足，获得 {{food}} 粮草，商业增加 {{commerce}}。',
      effects: {
        food: [600, 1100],
        commerce: [2, 5],
      },
    },
  ],
  shouchun: [
    {
      id: 'shouchun_luxury_court',
      type: 'warning',
      text: '【{{city}}】朝廷奢靡耗费府库，损失 {{gold}} 金，但市井喧闹带动商业增加 {{commerce}}。',
      effects: {
        gold: [-180, -100],
        commerce: [2, 4],
      },
    },
  ],
  beiping: [
    {
      id: 'beiping_white_horse',
      type: 'success',
      text: '【{{city}}】边骑巡弋塞外，守军士气提升 {{morale}}，兵力整训增加 {{troops}}。',
      effects: {
        morale: [4, 7],
        troops: [180, 320],
      },
    },
  ],
  pingyuan: [
    {
      id: 'pingyuan_benevolent_relief',
      type: 'success',
      text: '【{{city}}】施粥济民，百姓归附，获得 {{reputation}} 点名望，士气提升 {{morale}}。',
      effects: {
        reputation: [1, 3],
        morale: [3, 6],
      },
    },
  ],
  xiangyang: [
    {
      id: 'xiangyang_scholars',
      type: 'success',
      text: '【{{city}}】荆襄士人纷纷来投，获得 {{gold}} 金，商业增加 {{commerce}}。',
      effects: {
        gold: [150, 260],
        commerce: [2, 5],
      },
    },
  ],
  jiangxia: [
    {
      id: 'jiangxia_river_patrol',
      type: 'success',
      text: '【{{city}}】水寨巡防严整，城防增加 {{defense}}，获得 {{food}} 粮草。',
      effects: {
        defense: [2, 5],
        food: [260, 520],
      },
    },
  ],
  wujun: [
    {
      id: 'wujun_river_merchants',
      type: 'success',
      text: '【{{city}}】江东商旅齐聚，获得 {{gold}} 金，商业增加 {{commerce}}。',
      effects: {
        gold: [180, 320],
        commerce: [3, 6],
      },
    },
  ],
  hanzhong: [
    {
      id: 'hanzhong_mountain_pass',
      type: 'success',
      text: '【{{city}}】山道关卡加固，城防增加 {{defense}}，士气提升 {{morale}}。',
      effects: {
        defense: [3, 6],
        morale: [2, 5],
      },
    },
  ],
  wuwei: [
    {
      id: 'wuwei_horse_fairs',
      type: 'success',
      text: '【{{city}}】西凉马市兴旺，获得 {{gold}} 金，兵力整训增加 {{troops}}。',
      effects: {
        gold: [120, 220],
        troops: [160, 300],
      },
    },
  ],
};