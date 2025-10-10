import {
  CardType,
  GameError,
  GameMessage,
  PokemonCard,
  PowerType,
  Stage,
  State,
  StoreLike,
  Effect,
  EndTurnEffect,
  PowerEffect} from '@ptcg/common';

export class Regidrago extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardTypes: CardType[] = [CardType.DRAGON];
  public hp = 130;
  public retreat = [CardType.COLORLESS,CardType.COLORLESS,CardType.COLORLESS];
  public set = 'ASR';
  public name = 'Regidrago';
  public fullName = 'Regidrago ASR';

  public powers = [
    {
      name: 'Dragon\'s Hoard',
      powerType: PowerType.ABILITY,
      text:
        'Once during your turn, if this Pokémon is in the Active Spot, you may draw cards until you have 4 cards in your hand. You can\'t use more than 1 Dragon\'s Hoard Ability each turn.'
    },
  ];

  public attacks = [
    {
      name: 'Giant Fangs',
      cost: [CardType.GRASS, CardType.FIRE,CardType.COLORLESS],
      damage: '160',
      text: '',
    }
  ];

  public readonly DRAGONS_HOARD_MARKER  = 'DRAGONS_HOARD';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Dragon's hoard
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;

      if (player.active.getPokemonCard() !== this) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      if (player.marker.hasMarker(this.DRAGONS_HOARD_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }

      const count = Math.max(0, 4 - player.hand.cards.length);
      if (count === 0 || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      player.marker.addMarker(this.DRAGONS_HOARD_MARKER, this);
      player.deck.moveTo(player.hand, count);
      return state;
    }

    if (effect instanceof EndTurnEffect) {
      const player = effect.player;
      player.marker.removeMarker(this.DRAGONS_HOARD_MARKER, this);
      return state;
    }
    return state;
  }
}
