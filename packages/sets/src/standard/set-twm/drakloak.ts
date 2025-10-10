import {
  CardList,
  CardType,
  ChooseCardsPrompt,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  PlayPokemonEffect,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class Drakloak extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public cardTypes: CardType[] = [CardType.DRAGON];

  public hp: number = 90;

  public powers = [
    {
      name: 'Recon Directive',
      powerType: PowerType.ABILITY,
      useWhenInPlay: true,
      text:
          'Once during your turn, you may look at the top 2 cards of your deck and put 1 of them into your hand. Put the other card on the bottom of your deck.'
    },
  ];

  public attacks = [
    {
      name: 'Dragon Headbutt',
      cost: [CardType.FIRE, CardType.PSYCHIC],
      damage: '70',
      text: ''
    }
  ];
  public readonly RECON_DIRECTIVE_MARKER = 'RECON_DIRECTIVE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PlayPokemonEffect && effect.pokemonCard === this) {
      const player = effect.player;
      player.marker.removeMarker(this.RECON_DIRECTIVE_MARKER, this);
      return state;
    }
  
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
  
      if (player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
  
      if (player.marker.hasMarker(this.RECON_DIRECTIVE_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
  
      const deckTop = new CardList();
      player.deck.moveTo(deckTop, 3);
  
      return store.prompt(
        state,
        new ChooseCardsPrompt(
          player.id,
          GameMessage.CHOOSE_CARD_TO_HAND,
          deckTop,
          {},
          { min: 1, max: 1, allowCancel: false }
        ),
        selected => {
          player.marker.addMarker(this.RECON_DIRECTIVE_MARKER, this);
          deckTop.moveCardsTo(selected, player.hand);
          deckTop.moveTo(player.deck);
        }
      );
    }
  
    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.RECON_DIRECTIVE_MARKER, this);
    }
  
    return state;
  }

  public retreat = [CardType.COLORLESS];

  public set: string = 'TWM';

  public name: string = 'Drakloak';

  public fullName: string = 'Drakloak TWM';

}