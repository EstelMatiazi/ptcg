import {
  Effect,
  GameError,
  GameMessage,
  PlayerType,
  SlotType,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
  ChoosePokemonPrompt,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  const opponentHasBench = opponent.bench.some(b => b.pokemons.cards.length > 0);
  const playerHasBench = player.bench.some(b => b.pokemons.cards.length > 0);

  if (!opponentHasBench) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  yield store.prompt(
    state,
    new ChoosePokemonPrompt(
      player.id,
      GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      PlayerType.TOP_PLAYER,
      [SlotType.BENCH],
      { allowCancel: false }
    ),
    selected => {
      if (selected && selected.length > 0) {
        const target = selected[0];
        opponent.switchPokemon(target);
      }
      next();
    }
  );

  if (playerHasBench) {
    yield store.prompt(
      state,
      new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { allowCancel: false }
      ),
      result => {
        if (result && result.length > 0) {
          const cardList = result[0];
          player.switchPokemon(cardList);
        }
        next();
      }
    );
  }

  return state;
}

export class Guzma extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'BUS';
  public name: string = 'Guzma';
  public fullName: string = 'Guzma BUS';
  public text: string =
    'Switch 1 of your opponent\'s Benched Pokémon with their Active Pokémon. ' +
    'If you do, switch your Active Pokémon with 1 of your Benched Pokémon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
