import {
  AttackEffect,
  CardType,
  GameError,
  GameMessage,
  PokemonCard,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
  Effect
} from '@ptcg/common';

export class Fraxure extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public cardType: CardType[] = [CardType.DRAGON];
  public hp = 100;
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  public set = 'SFA';
  public name = 'Fraxure';
  public fullName = 'Fraxure SFA';

  public powers = [
    {
      name: 'Unnerve',
      powerType: PowerType.ABILITY,
      text:
        'Whenever your opponent plays an Item or Supporter card from their hand, prevent all effects of that card done to this Pokémon.'
    },
  ];

  public attacks = [
    {
      name: 'Dragon Pulse',
      cost: [CardType.FIGHTING, CardType.METAL],
      damage: '80',
      text: 'Discard the top card of your deck.',
    }
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // unnerve
    if (effect instanceof TrainerEffect) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const trainer = effect.trainerCard as TrainerCard;

      if (
        player === opponent &&
        (trainer.trainerType === TrainerType.ITEM ||
         trainer.trainerType === TrainerType.SUPPORTER)
      ) {
        const target = (effect as any).target || (effect as any).pokemonCard;
        if (target === this) {
          throw new GameError(GameMessage.BLOCKED_BY_ABILITY);
        }
      }
    }
    // dragon pulse
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      player.deck.moveTo(player.discard, 1);
      return state;
    }

    return state;
  }
}
