export const AI_STAGE_EVENT_POOLS = {
  military: [
    {
      id: 'military_muster',
      scope: 'city',
      target: 'highestTroops',
      type: 'warning',
      text: '【{{faction}}】在【{{city}}】大举点兵，新增 {{troops}} 兵力，士气提升 {{morale}}。',
      effects: {
        troops: [180, 360],
        morale: [3, 6],
      },
    },
    {
      id: 'military_fortify',
      scope: 'city',
      target: 'lowestDefense',
      type: 'warning',
      text: '【{{faction}}】督造军垒于【{{city}}】，城防增加 {{defense}}，守军士气提升 {{morale}}。',
      effects: {
        defense: [3, 6],
        morale: [2, 5],
      },
    },
  ],
  development: [
    {
      id: 'development_reclaim',
      scope: 'city',
      target: 'weakestEconomy',
      type: 'system',
      text: '【{{faction}}】于【{{city}}】安抚百姓、复垦田亩，农业增加 {{agriculture}}，士气提升 {{morale}}。',
      effects: {
        agriculture: [3, 6],
        morale: [2, 5],
      },
    },
    {
      id: 'development_market',
      scope: 'city',
      target: 'highestCommerce',
      type: 'system',
      text: '【{{faction}}】整修市肆于【{{city}}】，商业增加 {{commerce}}，城中士气提升 {{morale}}。',
      effects: {
        commerce: [3, 6],
        morale: [2, 4],
      },
    },
  ],
  diplomacy: [
    {
      id: 'diplomacy_envoys',
      scope: 'faction',
      type: 'system',
      text: '【{{faction}}】广派使节、宣示善意，双方关系提升 {{relation}}。',
      effects: {
        relation: [3, 6],
      },
    },
    {
      id: 'diplomacy_guesthall',
      scope: 'city',
      target: 'capitalOrBestCommerce',
      type: 'system',
      text: '【{{faction}}】在【{{city}}】整饬宾馆迎接宾使，商业增加 {{commerce}}，双方关系提升 {{relation}}。',
      effects: {
        commerce: [2, 5],
        relation: [2, 4],
      },
    },
  ],
};