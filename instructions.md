# How to Play Stomp

Stomp is a card game played with **face cards** (typically a standard deck using only the face cards, or a subset of the deck). The game is played in **rounds** and **tricks**. Players bet on how many tricks they will win each round; matching your bet earns points, and missing it costs points.

---

## What You Need

- **Cards**: A deck of face cards (or a standard deck—see your group’s preference).
- **Players**: 2–20 players.
- **This app**: Use the Stomp Dashboard to track scores, bets, and trick winners.

---

## Rounds and Tricks

- The game has **10 rounds** (or a number you set in the app).
- Each round has a **fixed number of tricks**:
  - **Round 1**: 10 tricks  
  - **Round 2**: 9 tricks  
  - **Round 3**: 8 tricks  
  - … down to **Round 10**: 1 trick  

So: *Round N* has **(11 − N)** tricks (e.g. Round 4 has 7 tricks).

---

## Point Values per Round

Each round has a **point value per trick**:

- **Round 1**: 10 points per trick  
- **Round 2**: 20 points per trick  
- **Round 3**: 30 points per trick  
- …  
- **Round 10**: 100 points per trick  

So: *Round N* tricks are worth **N × 10** points each.

---

## How a Round Is Played

1. **Deal**  
   Shuffle and deal so each player gets the same number of cards as there are tricks in that round (e.g. Round 1 → 10 cards each if 2 players and 10 tricks).

2. **Bet (before any tricks are played)**  
   Each player secretly (or openly, as you prefer) **bets how many tricks they will win** this round.  
   - Bets can be **0** up to the number of tricks in the round.  
   - Enter each player’s bet in the Stomp Dashboard before the round is played.

3. **Play tricks**  
   - For each trick, each player plays one card.  
   - **Highest card wins the trick** (follow your group’s rules for suit and trump if you use them).  
   - The winner of each trick is recorded in the app (e.g. “Who won this trick?”).  
   - Continue until all tricks in the round are played.

4. **Score the round**  
   For each player:
   - **If bet = tricks won** → they score: **(trick value) × (tricks won)**.  
   - **If bet ≠ tricks won** → they lose: **|bet − tricks won| × (trick value)** (as negative points).

   Examples (Round 1, 10 points per trick):
   - Bet 3, won 3 → **+30**.  
   - Bet 3, won 1 → **−20** (off by 2 × 10).  
   - Bet 0, won 0 → **0**.

5. **Next round**  
   Repeat for the next round (fewer tricks, higher point value per trick) until all rounds are finished. Highest total score wins.

---

## Scoring Rules (Summary)

| Situation              | Score for the round                          |
|-----------------------|----------------------------------------------|
| Bet = tricks won      | + (trick value × tricks won)                 |
| Bet ≠ tricks won      | − (|bet − tricks won| × trick value)        |
| Bet 0, won 0          | 0 points                                    |

**Ties**: If two or more players have the same total score, they tie for that rank (e.g. two players at 60 are tied for first; the next score is third place).

---

## Using the Stomp Dashboard

- **Game Setup**: Enter number of players and names, then start the game.  
- **Each round**:  
  1. Enter everyone’s **bets**, then submit.  
  2. As you play, record **who won each trick**.  
- The app checks that the **total tricks won** in the round equals the **number of tricks** in that round.  
- Use **Scoreboard** and **Round Summary** to see rankings and round-by-round results.  
- Use **Undo** if you enter a trick or round incorrectly.

For full app setup and run instructions, see the main [README](README.md).
