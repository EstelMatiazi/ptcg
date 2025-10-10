import {
  CardList,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  Effect,
  GameError,
  GameMessage,
  PlayerType,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  SlotType,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
  EnergyCard
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  let chosenEnergies: EnergyCard[] = [];

  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      player.deck,
      { superType: SuperType.ENERGY },
      { min: 0, max: 2, allowCancel: true }
    ),
    selected => {
      if (selected) {
        const uniqueTypes: string[] = [];
        chosenEnergies = selected.filter(card => {
          if (!(card instanceof EnergyCard)) {
            return false;
          }
          const provides = card.provides && card.provides.length > 0 ? card.provides[0] : null;
          if (!provides) {
            return false;
          }
          if (uniqueTypes.indexOf(provides.toString()) !== -1) {
            return false;
          }
          uniqueTypes.push(provides.toString());
          return true;
        }) as EnergyCard[];
      }
      next();
    }
  );

  if (chosenEnergies.length === 0) {
    return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
      player.deck.applyOrder(order);
    });
  }

  yield store.prompt(
    state,
    new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, chosenEnergies),
    () => next()
  );

  const tempList = new CardList();
  tempList.cards = chosenEnergies.slice();

  let toHand: EnergyCard[] = [];
  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      tempList,
      {},
      { min: 1, max: 1, allowCancel: false }
    ),
    selected => {
      toHand = selected as EnergyCard[] || [];
      next();
    }
  );

  player.deck.moveCardsTo(toHand, player.hand);

  const remaining = chosenEnergies.filter(c => toHand.indexOf(c) === -1);
  if (remaining.length > 0) {
    const energyToAttach = remaining[0];

    yield store.prompt(
      state,
      new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { allowCancel: false, min: 1, max: 1 }
      ),
      targets => {
        if (targets && targets.length > 0) {
          const target = targets[0] as any;
          player.deck.moveCardsTo([energyToAttach], target.cards);
        }
        next();
      }
    );
  }
  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class Crispin extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'SCR';
  public name: string = 'Crispin';
  public fullName: string = 'Crispin SCR';
  public text: string =
    'Search your deck for up to 2 Basic Energy cards of different types, reveal them, and put 1 of them into your hand.'+
        ' Attach the other to 1 of your Pokémon. Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
