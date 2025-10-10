import {
  Card,
  CardList,
  ChooseCardsPrompt,
  Effect,
  GameMessage,
  State,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class Gladion extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'CIN';
  public name: string = 'Gladion';
  public fullName: string = 'Gladion CIN';
  public text: string =
    'Look at your face-down Prize cards and put 1 of them into your hand. Then, shuffle this Gladion into your remaining '+
    'Prize cards and put them back face down. If you didn\'t play this Gladion from your hand, it does nothing.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (!(effect instanceof TrainerEffect) || effect.trainerCard !== this) {
      return state;
    }

    const player = effect.player;

    if (player.hand.cards.indexOf(this) === -1) {
      return state;
    }

    player.prizes.forEach(prizeSlot => {
      prizeSlot.isPublic = false;
      prizeSlot.isSecret = false;
    });

    const allPrizeCards = new CardList();
    for (let i = 0; i < player.prizes.length; i++) {
      const prizeSlot = player.prizes[i];
      for (let j = 0; j < prizeSlot.cards.length; j++) {
        allPrizeCards.cards.push(prizeSlot.cards[j]);
      }
    }

    return store.prompt(
      state,
      new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_HAND,
        allPrizeCards,
        {},
        { min: 1, max: 1, allowCancel: false }
      ),
      selected => {
        const chosen = selected || [];
        if (chosen.length === 0) {
          return;
        }

        const card = chosen[0];

        for (let i = 0; i < player.prizes.length; i++) {
          const prizeList = player.prizes[i];
          if (prizeList.cards.indexOf(card) !== -1) {
            prizeList.moveCardTo(card, player.hand);
            break;
          }
        }

        const handIndex = player.hand.cards.indexOf(this);
        if (handIndex !== -1) {
          player.hand.cards.splice(handIndex, 1);
        }

        const remainingPrizes: Card[] = [];
        for (let i = 0; i < player.prizes.length; i++) {
          const prizeSlot = player.prizes[i];
          for (let j = 0; j < prizeSlot.cards.length; j++) {
            remainingPrizes.push(prizeSlot.cards[j]);
          }
          prizeSlot.cards.length = 0;
        }

        remainingPrizes.push(this);

        for (let i = remainingPrizes.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = remainingPrizes[i];
          remainingPrizes[i] = remainingPrizes[j];
          remainingPrizes[j] = temp;
        }

        let prizeIndex = 0;
        for (let i = 0; i < player.prizes.length; i++) {
          const prizeSlot = player.prizes[i];
          if (prizeIndex < remainingPrizes.length) {
            prizeSlot.cards.push(remainingPrizes[prizeIndex]);
            prizeIndex++;
          }
        }

        player.prizes.forEach(p => {
          p.isPublic = false;
          p.isSecret = true;
        });
      }
    );
  }
}
