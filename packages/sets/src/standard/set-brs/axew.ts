import {
  AttackEffect,
  Card,
  CardType,
  ChooseCardsPrompt,
  CoinFlipPrompt,
  Effect,
  EvolveEffect,
  GameError,
  GameMessage,
  PokemonCard,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType
} from '@ptcg/common';

function* useUltraEvolution(
  next: Function,
  store: StoreLike,
  state: State,
  effect: AttackEffect
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  // Step 1: Flip a coin
  let heads = false;
  yield store.prompt(
    state,
    new CoinFlipPrompt(player.id, GameMessage.COIN_FLIP),
    result => {
      heads = result;
      next();
    }
  );

  if (!heads) {
    return state;
  }

  if (player.deck.cards.length === 0) {
    return state;
  }

  // Step 2: Search for Haxorus in the deck
  let selected: Card[] = [];
  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_EVOLVE,
      player.deck,
      { superType: SuperType.POKEMON, name: 'Haxorus' },
      { min: 1, max: 1, allowCancel: true }
    ),
    result => {
      selected = result || [];
      next();
    }
  );

  if (selected.length === 0) {
    return state;
  }

  const haxorus = selected[0] as PokemonCard;

  yield store.prompt(
    state,
    new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, selected),
    () => next()
  );

  // Step 3: Find this Axew (the active Pokémon)
  const target = player.active;
  const pokemonCard = target.getPokemonCard();

  if (!pokemonCard || pokemonCard.name !== 'Axew') {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  // Step 4: Apply evolution
  const evolveEffect = new EvolveEffect(player, target, haxorus);
  state = store.reduceEffect(state, evolveEffect);

  // Step 5: Shuffle deck
  yield store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });

  return state;
}

export class Axew extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.DRAGON];
  public hp = 60;
  public retreat = [CardType.COLORLESS];
  public set = 'BRS';
  public name = 'Axew';
  public fullName = 'Axew BRS';

  public attacks = [
    {
      name: 'Ultra Evolution',
      cost: [CardType.COLORLESS],
      damage: '',
      text:
        'Flip a coin. If heads, search your deck for a Haxorus and put it onto this Axew to evolve it. Then, shuffle your deck.',
    }
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const generator = useUltraEvolution(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
