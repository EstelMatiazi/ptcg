import { PokemonCard } from '@ptcg/common';
import { Stage, CardType, CardTag } from '@ptcg/common';
import { StoreLike, State, CoinFlipPrompt } from '@ptcg/common';
import { AttackEffect } from '@ptcg/common';
import { DealDamageEffect } from '@ptcg/common';
import { Effect } from '@ptcg/common';
import { GameMessage } from '@ptcg/common';


export class ReshiramEx extends PokemonCard {

  public tags = [ CardTag.POKEMON_EX ];

  public stage: Stage = Stage.BASIC;

  public cardType: CardType = CardType.FIRE;

  public hp: number = 180;

  public weakness = [{ type: CardType.WATER }];

  public retreat = [ CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS ];

  public attacks = [
    {
      name: 'Glinting Claw',
      cost: [ CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS ],
      damage: 50,
      text: 'Flip a coin. If heads, this attack does 30 more damage.'
    }, {
      name: 'Brave Fire',
      cost: [ CardType.FIRE, CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS ],
      damage: 150,
      text: 'Flip a coin. If tails, this Pokemon does 50 damage to itself.'
    },
  ];

  public set: string = 'BW3';

  public name: string = 'Reshiram EX';

  public fullName: string = 'Reshiram EX NXD';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;

      return store.prompt(state, [
        new CoinFlipPrompt(player.id, GameMessage.COIN_FLIP)
      ], result => {
        if (result === true) {
          effect.damage += 30;
        }
      });
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;

      return store.prompt(state, [
        new CoinFlipPrompt(player.id, GameMessage.COIN_FLIP)
      ], result => {
        if (result === false) {
          const dealDamage = new DealDamageEffect(effect, 50);
          dealDamage.target = player.active;
          return store.reduceEffect(state, dealDamage);
        }
      });
    }

    return state;
  }

}
