import {
  AttackEffect,
  Card,
  CardType,
  ChooseCardsPrompt,
  Effect,
  GameMessage,
  PokemonCard,
  PokemonSlot,
  ShuffleDeckPrompt,
  Stage,
  State,
  StoreLike,
  SuperType,
} from '@ptcg/common';

function* useCallForFamily(
  next: Function,
  store: StoreLike,
  state: State,
  effect: AttackEffect
): IterableIterator<State> {
  const player = effect.player;
  const slots: PokemonSlot[] = player.bench.filter(b => b.pokemons.cards.length === 0);
  const max = Math.min(slots.length, 2);

  if (player.deck.cards.length === 0) {
    return state;
  }

  let cards: Card[] = [];
  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
      player.deck,
      { superType: SuperType.POKEMON, stage: Stage.BASIC },
      { min: 0, max, allowCancel: true }
    ),
    selected => {
      cards = selected || [];
      next();
    }
  );

  if (cards.length > slots.length) {
    cards.length = slots.length;
  }

  cards.forEach((card, index) => {
    player.deck.moveCardTo(card, slots[index].pokemons);
    slots[index].pokemonPlayedTurn = state.turn;
  });

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class Emolga extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.LIGHTNING];

  public hp: number = 70;

  public weakness = [{ type: CardType.LIGHTNING }];

  public resistance = [{ type: CardType.FIGHTING, value: -20 }];

  public retreat = [];

  public attacks = [
    {
      name: 'Call for Family',
      cost: [CardType.COLORLESS],
      damage: '',
      text: 'Search your deck for 2 Basic Pokémon and put them onto your Bench. Shuffle your deck afterward.',
    },
    {
      name: 'Static Shock',
      cost: [CardType.LIGHTNING],
      damage: '20',
      text: '',
    },
  ];

  public set: string = 'BW';

  public name: string = 'Emolga';

  public fullName: string = 'Emolga DRX';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = useCallForFamily(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
