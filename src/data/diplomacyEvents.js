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

export const DIPLOMACY_FOLLOW_UP_EVENT_POOLS = {
  peaceAccepted: [
    {
      scope: 'faction',
      type: 'success',
      text: '与【{{faction}}】议和既成，朝野称颂主公审时度势，名望提升 {{reputation}}，双方关系回暖 {{relation}}。',
      effects: {
        reputation: [1, 3],
        relation: [2, 5],
      },
    },
    {
      scope: 'city',
      type: 'system',
      text: '边境与【{{faction}}】暂息兵戈，【{{city}}】得以休养生息，士气提升 {{morale}}，粮秣回收 {{food}}。',
      effects: {
        morale: [3, 6],
        food: [120, 220],
      },
    },
  ],
  peaceRejected: [
    {
      scope: 'faction',
      type: 'warning',
      text: '【{{faction}}】公然拒绝我方求和，诸侯皆知我方示弱，名望下降 {{reputation}}，关系下降 {{relation}}。',
      effects: {
        reputation: [-2, -1],
        relation: [-4, -2],
      },
    },
    {
      scope: 'city',
      type: 'warning',
      text: '求和遭拒后边郡【{{city}}】紧急加固守备，损失 {{gold}} 金，但士气提升 {{morale}}。',
      effects: {
        gold: [-140, -70],
        morale: [1, 3],
      },
    },
  ],
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
  persuadeSucceeded: [
    {
      scope: 'faction',
      type: 'success',
      text: '【{{faction}}】因旧部倒戈而军心不稳，我方声望提升 {{reputation}}，双方关系变化 {{relation}}。',
      effects: {
        reputation: [1, 3],
        relation: [-4, -1],
      },
    },
    {
      scope: 'city',
      type: 'success',
      text: '受【{{faction}}】将领来投鼓舞，【{{city}}】士气提升 {{morale}}，军备整顿带来 {{gold}} 金节余。',
      effects: {
        morale: [3, 6],
        gold: [70, 140],
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
  alienateSucceeded: [
    {
      scope: 'faction',
      type: 'warning',
      text: '【{{faction}}】内部猜忌渐起，双方关系下降 {{relation}}，我方声望提升 {{reputation}}。',
      effects: {
        relation: [-4, -1],
        reputation: [1, 2],
      },
    },
    {
      scope: 'city',
      type: 'system',
      text: '因【{{faction}}】军中流言未息，【{{city}}】边贸稍缓，却也获得了 {{gold}} 金情报回流，士气提升 {{morale}}。',
      effects: {
        gold: [60, 130],
        morale: [2, 5],
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
  aiPeaceAccepted: [
    {
      scope: 'city',
      type: 'system',
      text: '【{{faction}}】求和既成，边郡【{{city}}】得以稍歇，士气提升 {{morale}}，回收粮秣 {{food}}。',
      effects: {
        morale: [2, 5],
        food: [90, 180],
      },
    },
    {
      scope: 'faction',
      type: 'system',
      text: '【{{faction}}】因主动罢兵而示弱，双方关系回暖 {{relation}}，但我方名望也提升 {{reputation}}。',
      effects: {
        relation: [1, 4],
        reputation: [1, 2],
      },
    },
  ],
  aiPeaceRejected: [
    {
      scope: 'faction',
      type: 'warning',
      text: '【{{faction}}】议和受挫后转而整军经武，双方关系下降 {{relation}}，边地流言使我方名望下降 {{reputation}}。',
      effects: {
        relation: [-4, -2],
        reputation: [-2, -1],
      },
    },
    {
      scope: 'city',
      type: 'warning',
      text: '【{{faction}}】求和未果后仍在边境陈兵，【{{city}}】被迫增设警戒，财政损失 {{gold}} 金，士气下降 {{morale}}。',
      effects: {
        gold: [-120, -60],
        morale: [-4, -2],
      },
    },
  ],
  aiGiftSent: [
    {
      scope: 'faction',
      type: 'system',
      text: '【{{faction}}】遣使修好后往来渐密，双方关系回暖 {{relation}}，朝野观感亦有改善，名望提升 {{reputation}}。',
      effects: {
        relation: [1, 4],
        reputation: [1, 2],
      },
    },
    {
      scope: 'city',
      type: 'success',
      text: '受【{{faction}}】缓和姿态带动，【{{city}}】商旅稍复，获得 {{gold}} 金，士气提升 {{morale}}。',
      effects: {
        gold: [70, 140],
        morale: [2, 5],
      },
    },
  ],
  aiPressureEscalated: [
    {
      scope: 'city',
      type: 'warning',
      text: '【{{faction}}】施压余波未止，【{{city}}】被迫增调守军，损失 {{gold}} 金，士气下降 {{morale}}。',
      effects: {
        gold: [-130, -70],
        morale: [-5, -2],
      },
    },
    {
      scope: 'faction',
      type: 'warning',
      text: '【{{faction}}】借施压造势，令边地议论纷纷，我方名望下降 {{reputation}}，关系再降 {{relation}}。',
      effects: {
        reputation: [-2, -1],
        relation: [-4, -2],
      },
    },
  ],
  aiAlienateSucceeded: [
    {
      scope: 'faction',
      type: 'warning',
      text: '【{{faction}}】离间得手的余波仍在，朝中猜疑加剧，名望下降 {{reputation}}，关系下降 {{relation}}。',
      effects: {
        reputation: [-2, -1],
        relation: [-4, -2],
      },
    },
    {
      scope: 'city',
      type: 'warning',
      text: '受【{{faction}}】离间流言扩散影响，【{{city}}】军心不宁，士气下降 {{morale}}，财政损失 {{gold}} 金。',
      effects: {
        morale: [-4, -2],
        gold: [-110, -60],
      },
    },
  ],
  aiAlienateFailed: [
    {
      scope: 'faction',
      type: 'system',
      text: '【{{faction}}】离间未果反露行迹，我方名望提升 {{reputation}}，双方关系下降 {{relation}}。',
      effects: {
        reputation: [1, 2],
        relation: [-3, -1],
      },
    },
    {
      scope: 'city',
      type: 'system',
      text: '【{{faction}}】细作暴露后，【{{city}}】军民稍安，士气提升 {{morale}}。',
      effects: {
        morale: [2, 4],
      },
    },
  ],
};