export const OFFICER_PAIR_CITY_EVENTS = {
  'player_ruler|zhugeliang': [
    {
      tier: 'strongPositive',
      type: 'success',
      text: '【{{city}}】中，【{{first}}】与【{{second}}】连夜推演军政，政令分明，士气提升 {{morale}}，额外获得 {{gold}} 金。',
      effects: {
        morale: [6, 10],
        gold: [120, 220],
        loyalty: [2, 4],
      },
    },
  ],
  'player_ruler|zhaoyun': [
    {
      tier: 'strongPositive',
      type: 'success',
      text: '【{{city}}】中，【{{first}}】与【{{second}}】巡视营城，军民振奋，士气提升 {{morale}}，额外获得 {{gold}} 金。',
      effects: {
        morale: [5, 9],
        gold: [90, 180],
        loyalty: [2, 4],
      },
    },
  ],
  'zhaoyun|zhugeliang': [
    {
      tier: 'positive',
      type: 'success',
      text: '【{{city}}】中，【{{first}}】与【{{second}}】文武呼应，协力整顿军政，士气提升 {{morale}}，额外获得 {{gold}} 金。',
      effects: {
        morale: [4, 7],
        gold: [80, 150],
        loyalty: [1, 3],
      },
    },
  ],
  'caocao|guojia': [
    {
      tier: 'strongPositive',
      type: 'success',
      text: '【{{city}}】中，【{{first}}】与【{{second}}】密议大势，谋定后动，士气提升 {{morale}}，额外获得 {{gold}} 金。',
      effects: {
        morale: [5, 9],
        gold: [100, 200],
        loyalty: [2, 4],
      },
    },
  ],
  'liubei|zhugeliang': [
    {
      tier: 'strongPositive',
      type: 'success',
      text: '【{{city}}】中，【{{first}}】三顾之情未忘，与【{{second}}】同筹远略，士气提升 {{morale}}，额外获得 {{gold}} 金。',
      effects: {
        morale: [6, 10],
        gold: [100, 210],
        loyalty: [2, 4],
      },
    },
  ],
  'sunquan|zhouyu': [
    {
      tier: 'strongPositive',
      type: 'success',
      text: '【{{city}}】中，【{{first}}】信重【{{second}}】，军政调度井然，士气提升 {{morale}}，额外获得 {{gold}} 金。',
      effects: {
        morale: [5, 9],
        gold: [90, 170],
        loyalty: [2, 4],
      },
    },
  ],
  'zhouyu|zhugeliang': [
    {
      tier: 'strongNegative',
      type: 'warning',
      text: '【{{city}}】中，【{{first}}】与【{{second}}】争锋相对，彼此掣肘，士气下降 {{morale}}，额外损失 {{gold}} 金。',
      effects: {
        morale: [6, 10],
        gold: [120, 220],
        loyalty: [2, 4],
      },
    },
  ],
  'diaochan|lvbu': [
    {
      tier: 'strongNegative',
      type: 'warning',
      text: '【{{city}}】中，【{{first}}】与【{{second}}】旧怨复起，私下争执不断，士气下降 {{morale}}，额外损失 {{gold}} 金。',
      effects: {
        morale: [5, 9],
        gold: [90, 180],
        loyalty: [2, 4],
      },
    },
  ],
  'guanyu|caocao': [
    {
      tier: 'negative',
      type: 'warning',
      text: '【{{city}}】中，【{{first}}】与【{{second}}】旧事难释，处事多有掣肘，士气下降 {{morale}}，额外损失 {{gold}} 金。',
      effects: {
        morale: [4, 7],
        gold: [70, 140],
        loyalty: [1, 3],
      },
    },
  ],
};