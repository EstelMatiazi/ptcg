import {
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
  PlayerType,
  SlotType
} from '@ptcg/common';

export class Drampa extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DRAGON];

  public hp: number = 120;

  public attacks = [
    {
      name: 'Corkscrew Punch',
      cost: [CardType.COLORLESS],
      damage: '30',
      text: ''
    },
    {
      name: 'Berserk',
      cost: [CardType.WATER, CardType.FIGHTING],
      damage: '70+',
      text: 'If your Benched Pokémon have any damage counters on them, this attack does 90 more damage.'
    },
  ];

  public retreat = [CardType.COLORLESS,CardType.COLORLESS];

  public set: string = 'EVS';

  public name: string = 'Drampa';

  public fullName: string = 'Drampa EVS';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      let extraDamage = 0;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (list, card, target) => {
        if (target.slot === SlotType.BENCH && list.damage > 0) {
          extraDamage = 90;
        }
      });
      effect.damage += 70 + extraDamage;
      return state;
    }
    return state;
  }
}
