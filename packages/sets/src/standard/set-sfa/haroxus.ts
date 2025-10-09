import {
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class Haroxus extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public cardType: CardType[] = [CardType.DRAGON];
  public hp = 170;
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  public set = 'SFA';
  public name = 'Haroxus';
  public fullName = 'Haroxus SFA';

  public attacks = [
    {
      name: 'Bring Down the Axe',
      cost: [CardType.FIGHTING],
      damage: '',
      text: '"If your opponent\'s Active Pokémon has any Special Energy attached, it is Knocked Out',
    },
    {
      name:'Dragon Pulse',
      cost:[CardType.FIGHTING,CardType.METAL],
      damage: '230',
      text:'Discard the top 3 cards of your deck'
    }
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // TODO: implement insta KO
    //bring down the axe

    // dragon pulse
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      player.deck.moveTo(player.discard, 3);
      return state;
    }

    return state;
  }
}
