import {
  AttackEffect,
  CardType,
  ChoosePokemonPrompt,
  Effect,
  GameMessage,
  PlayerType,
  PokemonCard,
  PutDamageEffect,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
} from '@ptcg/common';

export class RagingBolt extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardTypes: CardType[] = [CardType.DRAGON];
  public hp = 130;
  public retreat = [CardType.COLORLESS,CardType.COLORLESS,CardType.COLORLESS];
  public set = 'SV7';
  public name = 'Raging Bolt';
  public fullName = 'Raging Bolt SV7';

  public attacks = [
    {
      name: 'Thunderburst Storm',
      cost: [CardType.LIGHTNING,CardType.FIGHTING],
      damage: '',
      text:
        'This attack does 30 damage to 1 of your opponent\'s Pokémon for each Energy attached to this Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
    {
      name: 'Dragon Headbutt',
      cost: [CardType.LIGHTNING,CardType.FIGHTING, CardType.COLORLESS],
      damage: '130',
      text: ''
    }
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const active = player.active as any;

      const energyCount = active.cards.filter((c: { superType: SuperType; }) => c.superType === SuperType.ENERGY).length;
      const totalDamage = 30 * energyCount;

      if (totalDamage <= 0) {
        return state; // no energy attached
      }

      const hasActive = opponent.active !== undefined;
      const hasBench = opponent.bench.some(b => (b as any).cards && (b as any).cards.length > 0);
      if (!hasActive && !hasBench) {
        return state;
      }

      return store.prompt(
        state,
        new ChoosePokemonPrompt(
          player.id,
          GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
          PlayerType.TOP_PLAYER,
          [SlotType.ACTIVE, SlotType.BENCH],
          { allowCancel: false, min: 1, max: 1 }
        ),
        targets => {
          if (!targets || targets.length === 0) {
            return;
          }

          const target = targets[0];
          const damageEffect = new PutDamageEffect(effect, totalDamage);
          damageEffect.target = target;
          store.reduceEffect(state, damageEffect);
        }
      );
    }
    return state;
  }

}
