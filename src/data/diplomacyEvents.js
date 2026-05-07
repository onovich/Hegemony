export const DIPLOMACY_STATE_EVENT_POOLS = {
  trade: [
    {
      scope: 'faction',
      type: 'success',
      text: '【{{faction}}】的商旅车队如约而至，为朝廷带来 {{gold}} 金，并让双方关系回暖 {{relation}}。',
      effects: {
        gold: [90, 180],
        relation: [2, 5],
      },
    },
    {
      scope: 'city',
      type: 'success',
      text: '受【{{faction}}】海陆商路带动，【{{city}}】市舶繁盛，获得 {{food}} 粮、士气提升 {{morale}}。',
      effects: {
        food: [140, 260],
        morale: [3, 6],
      },
    },
    {
      scope: 'faction',
      type: 'system',
      text: '与【{{faction}}】的使节往来广受赞誉，朝野声望提升 {{reputation}}，关系提升 {{relation}}。',
      effects: {
        reputation: [1, 3],
        relation: [1, 4],
      },
    },
  ],
  hostile: [
    {
      scope: 'city',
      type: 'warning',
      text: '【{{faction}}】边骑袭扰【{{city}}】，掠走 {{food}} 粮，守军士气下降 {{morale}}。',
      effects: {
        food: [-220, -120],
        morale: [-7, -4],
      },
    },
    {
      scope: 'city',
      type: 'warning',
      text: '因【{{faction}}】持续陈兵，【{{city}}】被迫抽调民夫修葺壁垒，财政损失 {{gold}} 金，但城防提升 {{defense}}。',
      effects: {
        gold: [-120, -60],
        defense: [2, 5],
      },
    },
    {
      scope: 'faction',
      type: 'warning',
      text: '【{{faction}}】的檄文四出，令地方人心浮动，名望下降 {{reputation}}，双方关系再降 {{relation}}。',
      effects: {
        reputation: [-2, -1],
        relation: [-5, -2],
      },
    },
  ],
};