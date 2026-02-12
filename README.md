# Stomp Dashboard

A real-time web app for tracking scores in the **Stomp** card game. Built with Node.js, Express, Socket.IO, and vanilla JavaScript.

---

## Quick Start

1. **Prerequisites**: [Node.js](https://nodejs.org/) (v14 or higher; npm is included).
2. **Clone and install**:
   ```bash
   git clone https://github.com/your-username/stomp-dashboard.git
   cd stomp-dashboard
   npm install
   ```
3. **Run the app**:
   ```bash
   npm start
   ```
4. **Open in browser**: [http://localhost:3000](http://localhost:3000)

---

## Dependencies

- **express** – web server  
- **socket.io** – real-time updates across clients  
- **cors** – cross-origin requests (e.g. if frontend is on another port)

**Dev (optional)**:

- **nodemon** – auto-restart server during development (`npm run dev`)

All are listed in `package.json`; `npm install` installs them.

---

## Project Structure

```
stomp-dashboard/
├── README.md           # This file – setup and overview
├── instructions.md     # How to play the Stomp card game
├── package.json        # Scripts and dependencies
├── server.js           # Express + Socket.IO server
├── public/
│   ├── index.html      # Single-page app shell and navigation
│   ├── script.js       # Client logic and UI updates
│   └── styles.css      # Styles and layout
└── .gitignore
```

---

## Scripts

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm start`    | Run the server (production)          |
| `npm run dev`  | Run with nodemon (auto-restart)      |

---

## How to Play Stomp

For full rules and how to use the dashboard during play, see **[instructions.md](instructions.md)**.

**In short**: Stomp is played in rounds. Each round has a set number of tricks; players bet how many tricks they will win. Matching your bet gives points; missing it costs points. The app tracks players, bets, trick winners, and scores.

---

## App Features

- **Game setup**: 2–20 players, configurable rounds and point values  
- **Round flow**: Enter bets, then record who won each trick; the app validates totals  
- **Live scoreboard**: Rankings, top/bottom N, points needed for top/bottom  
- **Round & final leaderboards**: Shown after each round and at game end  
- **Undo**: Revert last trick or last full round  
- **Analytics**: Score progression chart, win probability, game history  

---

## Configuration

- **Port**: Set `PORT` in `server.js` or use env, e.g. `PORT=3001 npm start` (default: 3000).  
- **Rounds / points**: Adjustable in Game Setup in the UI (total rounds, base points, increment).

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Port in use | Use another port: `PORT=3001 npm start` or change default in `server.js` |
| Socket errors | Ensure the server is running and you’re opening the app at the URL it prints |
| Chart not loading | Check network; the app loads Chart.js from a CDN |
| Wrong trick total | Per round, total tricks won must equal the number of tricks in that round; fix with Undo if needed |

---

## License

MIT. See [instructions.md](instructions.md) for how to play Stomp.
