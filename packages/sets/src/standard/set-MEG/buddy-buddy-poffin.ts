import {
  Card,
  CardList,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function* playCard(
  next: Function,
  store: StoreLike,
  state: State,
  self: BuddyBuddyPoffin,
  effect: TrainerEffect
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);
  let cards: Card[] = [];

  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  const availableBench = player.bench.filter(slot => slot.getPokemonCard() === undefined).length;
  if (availableBench === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  const maxToPick = Math.min(2, availableBench);

  effect.preventDefault = true;

  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
      player.deck,
      { superType: SuperType.POKEMON, stage: Stage.BASIC },
      { min: 0, max: maxToPick, allowCancel: true }
    ),
    selected => {
      cards = (selected || []).filter(c => c instanceof PokemonCard && (c as PokemonCard).hp <= 70);
      next();
    }
  );

  if (!cards || cards.length === 0) {
    return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
      player.deck.applyOrder(order);
    });
  }

  yield store.prompt(
    state,
    new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, cards),
    () => next()
  );

  for (const card of cards) {
    const benchSlot = player.bench.find(s => s.getPokemonCard() === undefined);
    if (!benchSlot) {
      break;
    }

    const temp = new CardList();
    player.deck.moveCardsTo([card], temp); // remove from deck into temp

    const slotAsAny = benchSlot as any;
    if (!slotAsAny.cards) {
      if (typeof slotAsAny.add === 'function') {
        slotAsAny.add(temp.cards[0]);
      } else {
        player.hand.moveCardsTo(temp.cards, player.hand);
      }
    } else {
      slotAsAny.cards.push(temp.cards[0]);
    }
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class BuddyBuddyPoffin extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;
  public set: string = 'MEG';
  public name: string = 'Buddy-Buddy Poffin';
  public fullName: string = 'Buddy-Buddy Poffin MEG';
  public text: string =
    'Search your deck for up to 2 Basic Pokémon with 70 HP or less and put them onto your Bench. Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, this, effect);
      return generator.next().value;
    }
    return state;
  }
}
