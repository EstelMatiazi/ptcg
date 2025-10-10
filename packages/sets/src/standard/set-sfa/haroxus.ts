import {
  AttackEffect,
  CardType,
  Effect,
  EnergyCard,
  EnergyType,
  KnockOutEffect,
  PokemonCard,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
} from '@ptcg/common';

export class Haroxus extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public cardTypes: CardType[] = [CardType.DRAGON];
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
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const opponentActive = opponent.active as any;
      if (!opponentActive) {
        return state;
      }
      const hasSpecialEnergy = opponentActive.cards.some((card: any) => {
        return (
          card.superType === SuperType.ENERGY &&
          card instanceof EnergyCard &&
          card.energyType !== EnergyType.BASIC
        );
      });
      if (hasSpecialEnergy) {
        const knockout = new KnockOutEffect(player, opponentActive);
        state = store.reduceEffect(state, knockout);
      }
      return state;
    }
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      player.deck.moveTo(player.discard, 3);
      return state;
    }
    return state;
  }
}
