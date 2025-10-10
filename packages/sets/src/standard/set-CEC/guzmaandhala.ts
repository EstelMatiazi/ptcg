import {
  Card,
  //CardTag,
  ChooseCardsPrompt,
  Effect,
  EnergyCard,
  EnergyType,
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

  let discardedCount = 0;

  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_DISCARD,
      player.hand,
      {},
      { min: 0, max: 2, allowCancel: true }
    ),
    selected => {
      const discarded = selected || [];
      const filtered = discarded.filter(c => c !== effect.trainerCard);
      discardedCount = filtered.length;
      if (discardedCount > 0) {
        player.hand.moveCardsTo(filtered, player.discard);
      }
      next();
    }
  );

  const searchCategories = [
    { superType: SuperType.TRAINER, trainerType: TrainerType.STADIUM }
  ];

  if (discardedCount === 2) {
    searchCategories.push(
      { superType: SuperType.TRAINER, trainerType: TrainerType.TOOL },
      { superType: SuperType.ENERGY, trainerType: TrainerType.ITEM } //?? hacky as all hell
    );
  }

  const revealedCards: Card[] = [];

  for (let i = 0; i < searchCategories.length; i++) {
    const condition = searchCategories[i];
    yield store.prompt(
      state,
      new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_HAND,
        player.deck,
        condition,
        { min: 0, max: 1, allowCancel: true }
      ),
      selected => {
        let chosen = selected || [];

        if (condition.superType === SuperType.ENERGY && chosen.length > 0) {
          chosen = chosen.filter(c => c instanceof EnergyCard && c.energyType === EnergyType.SPECIAL);
        }

        if (chosen.length > 0) {
          player.deck.moveCardsTo(chosen, player.hand);
          for (let j = 0; j < chosen.length; j++) {
            revealedCards.push(chosen[j]);
          }
        }

        next();
      }
    );
  }

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

export class GuzmaAndHala extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'CEC';
  public name: string = 'Guzma & Hala';
  public fullName: string = 'Guzma & Hala CEC';
  //  public tags: [CardTag.POKEMON_GX];
  public text: string =
    'Search your deck for a Stadium card, reveal it, and put it into your hand. Then, shuffle your deck.\n\n' +
    'When you play this card, you may discard 2 other cards from your hand. ' +
    'If you do, you may also search for a Pokémon Tool card and a Special Energy card in this way.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
