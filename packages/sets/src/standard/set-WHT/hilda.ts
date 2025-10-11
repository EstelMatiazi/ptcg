import {
  Card,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
  PokemonCard,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  const revealedCards: Card[] = [];
  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      player.deck,
      { superType: SuperType.POKEMON },
      { min: 0, max: 1, allowCancel: true }
    ),
    selected => {
      let chosen = selected || [];
      chosen = chosen.filter(c => c instanceof PokemonCard && c.stage !== undefined && c.stage !== 0);
      if (chosen.length > 0) {
        player.deck.moveCardsTo(chosen, player.hand);
        for (let i = 0; i < chosen.length; i++) {
          revealedCards.push(chosen[i]);
        }
      }
      next();
    }
  );
  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      player.deck,
      { superType: SuperType.ENERGY, trainerType: TrainerType.ITEM },
      { min: 0, max: 1, allowCancel: true }
    ),
    selected => {
      const chosen = selected || [];
      if (chosen.length > 0) {
        player.deck.moveCardsTo(chosen, player.hand);
        for (let i = 0; i < chosen.length; i++) {
          revealedCards.push(chosen[i]);
        }
      }
      next();
    }
  );

  if (revealedCards.length > 0) {
    yield store.prompt(
      state,
      new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, revealedCards),
      () => next()
    );
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class Hilda extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'WHT';
  public name: string = 'Hilda';
  public fullName: string = 'Hilda WHT';
  public text: string =
    'Search your deck for an Evolution Pokémon and an Energy card, reveal them, and put them into your hand. Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
