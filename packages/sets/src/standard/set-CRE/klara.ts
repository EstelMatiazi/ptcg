import {
  Card,
  ChooseCardsPrompt,
  ConfirmPrompt,
  Effect,
  GameMessage,
  State,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
  EnergyCard,
  EnergyType,
  PokemonCard,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;

  let choosePokemon = false;
  let chooseEnergy = false;

  yield store.prompt(
    state,
    new ConfirmPrompt(player.id, GameMessage.WANT_TO_RECOVER_POKEMON),
    result => {
      choosePokemon = result === true;
      next();
    }
  );

  yield store.prompt(
    state,
    new ConfirmPrompt(player.id, GameMessage.WANT_TO_RECOVER_BASIC_ENERGY),
    result => {
      chooseEnergy = result === true;
      next();
    }
  );

  if (choosePokemon) {
    const pokemonInDiscard = player.discard.cards.filter(c => c instanceof PokemonCard);
    if (pokemonInDiscard.length > 0) {
      yield store.prompt(
        state,
        new ChooseCardsPrompt(
          player.id,
          GameMessage.CHOOSE_CARD_TO_HAND,
          player.discard,
          { superType: SuperType.POKEMON },
          { min: 0, max: 2, allowCancel: true }
        ),
        (chosen: Card[] | undefined) => {
          const cards = chosen || [];
          if (cards.length > 0) {
            player.discard.moveCardsTo(cards, player.hand);
          }
          next();
        }
      );
    }
  }

  if (chooseEnergy) {
    const energyInDiscard = player.discard.cards.filter(
      c => c instanceof EnergyCard && c.energyType === EnergyType.BASIC
    );
    if (energyInDiscard.length > 0) {
      yield store.prompt(
        state,
        new ChooseCardsPrompt(
          player.id,
          GameMessage.CHOOSE_CARD_TO_HAND,
          player.discard,
          { superType: SuperType.ENERGY },
          { min: 0, max: 2, allowCancel: true }
        ),
        (chosen: Card[] | undefined) => {
          const cards = chosen || [];
          if (cards.length > 0) {
            player.discard.moveCardsTo(cards, player.hand);
          }
          next();
        }
      );
    }
  }

  return state;
}

export class Klara extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'CRE';
  public name: string = 'Klara';
  public fullName: string = 'Klara CRE';
  public text: string =
    'Choose 1 or both:\n' +
    '• Put up to 2 Pokémon from your discard pile into your hand.\n' +
    '• Put up to 2 Basic Energy cards from your discard pile into your hand.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
