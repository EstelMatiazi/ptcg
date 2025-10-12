import {
  Effect,
  GameError,
  GameMessage,
  Player,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType
} from '@ptcg/common';

function moveHandToBottomOfDeck(player: Player): boolean {
  const handCards = player.hand.cards.slice();
  if (handCards.length === 0) {
    return false;
  }

  player.hand.moveTo(player.deck);
  player.deck.cards = player.deck.cards.concat(handCards);
  return true;
}

function* playCard(
  next: Function,
  store: StoreLike,
  state: State,
  effect: TrainerEffect
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  const playerMoved = moveHandToBottomOfDeck(player);
  const opponentMoved = moveHandToBottomOfDeck(opponent);

  if (!playerMoved && !opponentMoved) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  player.deck.moveTo(player.hand, 5);
  opponent.deck.moveTo(opponent.hand, 4);

  return state;
}

export class Marnie extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'SSH';
  public name: string = 'Marnie';
  public fullName: string = 'Marnie SSH';
  public text: string =
    'Each player shuffles their hand and puts it on the bottom of their deck. ' +
    'If either player put any cards on the bottom of their deck in this way, you draw 5 cards, and your opponent draws 4 cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
