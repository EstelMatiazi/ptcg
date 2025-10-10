import {
  Card,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  ShuffleDeckPrompt,
  State,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
  ShowCardsPrompt,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;

  if (player.discard.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }
  let chosenSupporter: Card[] = [];
  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      player.discard,
      { superType: SuperType.TRAINER, trainerType: TrainerType.SUPPORTER },
      { min: 1, max: 1, allowCancel: false }
    ),
    selected => {
      chosenSupporter = selected || [];
      next();
    }
  );

  chosenSupporter = chosenSupporter.filter(card => {
    return !(card instanceof TrainerCard && card.name === 'Cynthia & Caitlin');
  });

  if (chosenSupporter.length > 0) {
    player.discard.moveCardsTo(chosenSupporter, player.hand);

    yield store.prompt(
      state,
      new ShowCardsPrompt(
        player.id,
        GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,
        chosenSupporter
      ),
      () => next()
    );
  }

  if (player.hand.cards.length > 0) {
    let discarded: Card[] = [];
    yield store.prompt(
      state,
      new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_DISCARD,
        player.hand,
        {},
        { min: 0, max: 1, allowCancel: true }
      ),
      selected => {
        discarded = selected || [];
        next();
      }
    );

    if (discarded.length > 0) {
      player.hand.moveCardsTo(discarded, player.discard);

      const drawCount = Math.min(3, player.deck.cards.length);
      if (drawCount > 0) {
        player.deck.moveTo(player.hand, drawCount);
      }
    }
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class CynthiaAndCaitlin extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'CEC';
  public name: string = 'Cynthia & Caitlin';
  public fullName: string = 'Cynthia & Caitlin CEC';
  public text: string =
    'Put a Supporter card from your discard pile into your hand. You can\'t choose Cynthia & Caitlin or a card you discarded with the effect of this card.\n\n' +
    'When you play this card, you may discard another card from your hand. If you do, draw 3 cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
