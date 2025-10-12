import {
  Card,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  Effect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
  GamePhase,
  KnockOutEffect,
  PlayerType,
  ShuffleDeckPrompt,
  SlotType,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
  EndTurnEffect,
  ShowCardsPrompt
} from '@ptcg/common';

function* playCard(
  next: Function,
  store: StoreLike,
  state: State,
  self: Raihan,
  effect: TrainerEffect
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  if (!player.marker.hasMarker(self.RAIHAN_MARKER)) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  const basicEnergies = player.discard.cards.filter(
    c => c instanceof EnergyCard && c.energyType === EnergyType.BASIC
  );
  if (basicEnergies.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  let chosenEnergy: Card[] = [];
  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_ATTACH,
      player.discard,
      { superType: SuperType.ENERGY },
      { min: 1, max: 1, allowCancel: false }
    ),
    result => {
      chosenEnergy = result || [];
      next();
    }
  );

  const energyCard = chosenEnergy[0] as EnergyCard;

  let chosenTargets: any[] = [];
  yield store.prompt(
    state,
    new ChoosePokemonPrompt(
      player.id,
      GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,
      PlayerType.BOTTOM_PLAYER,
      [SlotType.ACTIVE, SlotType.BENCH],
      { min: 1, max: 1, allowCancel: false }
    ),
    result => {
      chosenTargets = result || [];
      next();
    }
  );

  if (chosenTargets.length === 0) {
    return state;
  }

  const target = chosenTargets[0];

  player.discard.moveCardTo(energyCard, target.cards);
  target.energies.push(energyCard);

  let selectedCard: Card[] = [];
  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      player.deck,
      {},
      { min: 1, max: 1, allowCancel: false }
    ),
    result => {
      selectedCard = result || [];
      next();
    }
  );

  player.deck.moveCardsTo(selectedCard, player.hand);

  if (selectedCard.length > 0) {
    yield store.prompt(
      state,
      new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, selectedCard),
      () => next()
    );
  }

  yield store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });

  return state;
}

export class Raihan extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'EVS';
  public name: string = 'Raihan';
  public fullName: string = 'Raihan EVS';

  public readonly RAIHAN_MARKER = 'RAIHAN_MARKER';

  public text: string =
    'You can play this card only if 1 of your Pokémon was Knocked Out ' +
    'during your opponent\'s last turn. Attach a Basic Energy card from your discard pile ' +
    'to 1 of your Pokémon. If you do, search your deck for a card and put it into your hand. Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Play logic
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, this, effect);
      return generator.next().value;
    }

    if (effect instanceof KnockOutEffect) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const duringTurn = [GamePhase.PLAYER_TURN, GamePhase.ATTACK].includes(state.phase);

      if (!duringTurn || state.players[state.activePlayer] !== opponent) {
        return state;
      }

      const cardList = StateUtils.findCardList(state, this);
      const owner = StateUtils.findOwner(state, cardList);
      if (owner === player) {
        effect.player.marker.addMarker(this.RAIHAN_MARKER, this);
      }
      return state;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.RAIHAN_MARKER);
    }

    return state;
  }
}
