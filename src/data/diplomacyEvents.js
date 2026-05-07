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

export const PLAYER_DIPLOMACY_FOLLOW_UP_EVENT_POOLS = {
  aidRequested: [
    {
      scope: 'faction',
      type: 'warning',
      text: '【{{faction}}】的使者提醒我方此前求援颇多，朝野对此多有微词，名望下降 {{reputation}}，关系下降 {{relation}}。',
      effects: {
        reputation: [-2, -1],
        relation: [-5, -2],
      },
    },
    {
      scope: 'city',
      type: 'system',
      text: '为回报【{{faction}}】此前的接济，朝廷调拨 {{food}} 粮维系商路，致【{{city}}】仓储承压，但双方关系回暖 {{relation}}。',
      effects: {
        food: [-220, -120],
        relation: [1, 3],
      },
    },
  ],
  persuadeFailed: [
    {
      scope: 'faction',
      type: 'warning',
      text: '【{{faction}}】查出我方密使行迹后大肆宣扬，令我方名望下降 {{reputation}}，双方关系下降 {{relation}}。',
      effects: {
        reputation: [-2, -1],
        relation: [-6, -3],
      },
    },
    {
      scope: 'city',
      type: 'warning',
      text: '受【{{faction}}】清查反制影响，【{{city}}】商旅受阻，财政损失 {{gold}} 金，士气下降 {{morale}}。',
      effects: {
        gold: [-130, -70],
        morale: [-4, -2],
      },
    },
  ],
  ceasefireBroken: [
    {
      scope: 'faction',
      type: 'warning',
      text: '我方背弃与【{{faction}}】的停战之约，引得诸侯侧目，名望下降 {{reputation}}，关系再降 {{relation}}。',
      effects: {
        reputation: [-3, -1],
        relation: [-5, -2],
      },
    },
    {
      scope: 'city',
      type: 'warning',
      text: '因朝廷突然撕毁与【{{faction}}】的停战，边郡【{{city}}】仓促整军备战，损失 {{gold}} 金，士气下降 {{morale}}。',
      effects: {
        gold: [-140, -80],
        morale: [-5, -2],
      },
    },
  ],
};