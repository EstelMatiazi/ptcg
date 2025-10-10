import {
  CardType,
  GameError,
  GameMessage,
  PokemonCard,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  TrainerType,
  Effect,
  CardList,
  ChooseCardsPrompt,
  EndTurnEffect,
  PowerEffect,
  SuperType,
  Card,
  ShowCardsPrompt,
  ShuffleDeckPrompt
} from '@ptcg/common';

function* attractCustomers(this: any, next: Function, store: StoreLike, state: State, effect: PowerEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  if (player.active.getPokemonCard() !== this) {
    throw new GameError(GameMessage.CANNOT_USE_POWER);
  }

  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_USE_POWER);
  }

  const deckTop = new CardList();
  player.deck.moveTo(deckTop, Math.min(6, player.deck.cards.length));

  let cards: Card[] = [];
  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      deckTop,
      { superType: SuperType.TRAINER, trainerType: TrainerType.SUPPORTER },
      { min: 1, max: 1, allowCancel: true }
    ),
    selected => {
      cards = selected || [];
      next();
    }
  );
  deckTop.moveCardsTo(cards, player.hand);
  deckTop.moveTo(player.deck);
  if (cards.length > 0) {
    yield store.prompt(
      state,
      new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, cards),
      () => next()
    );
  }
  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class Tatsugiri extends PokemonCard {
  public readonly ATTRACT_CUSTOMERS_MARKER = 'ATTRACT_CUSTOMERS'; 
  public stage: Stage = Stage.BASIC;
  public cardTypes: CardType[] = [CardType.DRAGON];
  public hp = 70;
  public retreat = [CardType.COLORLESS];
  public set = 'TWM';
  public name = 'Tatsugiri';
  public fullName = 'Tatsugiri TWM';

  public powers = [
    {
      name: 'Attract Customers',
      powerType: PowerType.ABILITY,
      text:
        'Once during your turn, if this Pokémon is in the Active Spot, you may look at the top 6 cards of your deck, reveal a Supporter card you find there, and put it into your hand. Shuffle the other cards back into your deck.'
    },
  ];

  public attacks = [
    {
      name: 'Surf',
      cost: [CardType.FIRE, CardType.WATER],
      damage: '50',
      text: '',
    }
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      if (player.active.getPokemonCard() !== this) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      if (player.marker.hasMarker(this.ATTRACT_CUSTOMERS_MARKER)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      player.marker.addMarker(this.ATTRACT_CUSTOMERS_MARKER,this);
      const generator = attractCustomers(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    if (effect instanceof EndTurnEffect) {
      const player = effect.player;
      player.marker.removeMarker(this.ATTRACT_CUSTOMERS_MARKER);
      return state;
    }
    return state;
  }
}
