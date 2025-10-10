import {
  AttackEffect,
  CardType,
  Effect,
  EndTurnEffect,
  GamePhase,
  KnockOutEffect,
  PokemonCard,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class Druddigon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardTypes: CardType[] = [CardType.DRAGON];
  public hp = 120;
  public retreat = [CardType.COLORLESS];
  public set = 'BRS';
  public name = 'Druddigon';
  public fullName = 'Druddigon BRS';

  public attacks = [
    {
      name: 'Revenge',
      cost: [CardType.FIRE,CardType.WATER],
      damage: '40+',
      text:
        'If any of your Pokémon were Knocked Out by damage from an attack from your opponent\'s Pokémon during their last turn, this attack does 120 more damage.',
    },
    {
      name: 'Dragon Claw',
      cost: [CardType.FIRE,CardType.WATER, CardType.COLORLESS],
      damage: '120',
      text: ''
    }
  ];

  public readonly REVENGE_MARKER = 'REVENGE_MARKER';
  
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
  
      if (player.marker.hasMarker(this.REVENGE_MARKER)) {
        effect.damage += 120;
      }
  
      return state;
    }
  
    if (effect instanceof KnockOutEffect) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
  
      // Do not activate between turns, or when it's not opponents turn.
      if (state.phase !== GamePhase.ATTACK || state.players[state.activePlayer] !== opponent) {
        return state;
      }
  
      const cardList = StateUtils.findCardList(state, this);
      const owner = StateUtils.findOwner(state, cardList);
      if (owner === player) {
        effect.player.marker.addMarker(this.REVENGE_MARKER, this);
      }
      return state;
    }
  
    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.REVENGE_MARKER);
    }
  
    return state;
  }

}
