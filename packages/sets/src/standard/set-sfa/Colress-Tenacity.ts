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
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  const deck = player.deck;
  const chosenCards: Card[] = [];

  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      deck,
      { superType: SuperType.TRAINER, trainerType: TrainerType.STADIUM },
      { min: 0, max: 1, allowCancel: true }
    ),
    selected => {
      if (selected) {
        chosenCards.push(...selected);
      }
      next();
    }
  );

  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      deck,
      { superType: SuperType.ENERGY},
      { min: 0, max: 1, allowCancel: true }
    ),
    selected => {
      if (selected) {
        chosenCards.push(...selected);
      }
      next();
    }
  );

  if (chosenCards.length > 0) {
    deck.moveCardsTo(chosenCards, player.hand);

    yield store.prompt(
      state,
      new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, chosenCards),
      () => next()
    );
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class ColresssTenacity extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'SFA';

  public name: string = 'Colress Tenacity';

  public fullName: string = 'Colress Tenacity SFA';

  public text: string = 'Search your deck for a Stadium card and an Energy card, reveal them,'+
                        ' and put them into your hand. Then, shuffle your deck. ';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
