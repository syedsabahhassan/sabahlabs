# SabahLabs — Architecture Reference

This document describes the complete technical architecture of the SabahLabs platform: how all components connect, how data flows in real time, and how the system is deployed.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                            CLIENTS                                   │
│                                                                       │
│  ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐  │
│  │  Host Browser   │   │ Player Browser  │   │  iOS Mobile App  │  │
│  │  (Laptop / TV)  │   │ (Phone/Tablet)  │   │  (React Native)  │  │
│  │                 │   │                 │   │                  │  │
│  │ • Questions     │   │ • 4 tiles only  │   │ • 4 tiles only   │  │
│  │ • Answers       │   │ • No question   │   │ • No question    │  │
│  │ • Leaderboard   │   │ • Score result  │   │ • Score result   │  │
│  │ • Timer         │   │ • Leaderboard   │   │ • Leaderboard    │  │
│  └────────┬────────┘   └────────┬────────┘   └────────┬─────────┘  │
└───────────┼─────────────────────┼──────────────────────┼────────────┘
            │                     │                      │
            │         WebSocket (Socket.IO)              │
            │                     │                      │
┌───────────┼─────────────────────┼──────────────────────┼────────────┐
│           ▼         BACKEND (Railway)                  ▼            │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                        server.js                               │  │
│  │                  Express + Socket.IO                           │  │
│  │                                                                │  │
│  │  REST API routes:           Socket.IO event handlers:          │  │
│  │  GET  /api/quizzes          create_room                        │  │
│  │  POST /api/admin/quizzes    join_room                          │  │
│  │  PUT  /api/admin/quizzes/:id start_game                        │  │
│  │  DELETE /api/admin/...      submit_answer                      │  │
│  │  POST /api/admin/upload     next_question                      │  │
│  └───────────────────┬────────────────────────────────────────────┘  │
│                      │                                                │
│          ┌───────────┴──────────┐                                    │
│          │                      │                                    │
│  ┌───────▼──────────┐  ┌───────▼──────────────┐                    │
│  │  gameManager.js  │  │  quizRepository.js   │                    │
│  │                  │  │                      │                    │
│  │  In-memory game  │  │  PostgreSQL CRUD      │                    │
│  │  rooms (Map)     │  │  via pg library       │                    │
│  │  Scoring logic   │  │  listQuizzes()        │                    │
│  │  Timer control   │  │  getQuiz()            │                    │
│  └──────────────────┘  │  createQuiz()         │                    │
│                         │  createQuestion()     │                    │
│  ┌───────────────────┐  │  saveGameSession()    │                    │
│  │   sampleQuiz.js   │  └──────────┬───────────┘                    │
│  │  Fallback data    │             │                                 │
│  │  (no DB needed)   │    ┌────────▼──────────┐                     │
│  └───────────────────┘    │      db.js         │                     │
│                            │  PostgreSQL Pool   │                     │
│                            │  + initSchema()    │                     │
│                            └────────┬───────────┘                    │
│                                     │                                 │
└─────────────────────────────────────┼─────────────────────────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │  Railway PostgreSQL DB   │
                         │                         │
                         │  quizzes                │
                         │  questions              │
                         │  answer_options         │
                         │  game_sessions          │
                         │  player_results         │
                         └─────────────────────────┘
```

---

## Component Breakdown

### Backend (`backend/`)

#### `server.js`
The entry point. Responsibilities:
- Starts Express HTTP server and Socket.IO server on the same port
- Registers all REST API routes for quiz CRUD and image upload
- Registers all Socket.IO event listeners and delegates to `gameManager.js`
- Calls `initSchema()` before listening so tables exist on first boot
- Admin authentication via `x-admin-secret` header on all `/api/admin/*` routes

#### `gameManager.js`
The game engine. All game state lives here in a `Map` keyed by room code. Responsibilities:
- `createRoom(hostSocketId, quiz)` — generates unique PIN, initialises room state
- `joinRoom(roomCode, socketId, playerName)` — adds player to room
- `startGame(roomCode)` — begins question sequence, sets server-side timer
- `submitAnswer(roomCode, socketId, answerIndex)` — records answer with server timestamp
- `endQuestion(roomCode)` — calculates scores, emits results, advances state
- `nextQuestion(roomCode)` — moves to next question or triggers `game_finished`
- Server-side timers (`setInterval`) auto-advance questions when time expires

#### `quizRepository.js`
Database access layer. Pure async functions — no Express or Socket.IO knowledge. All functions check `isConnected` and throw `'Database not connected'` if the DB is unavailable (rather than silently failing). Functions: `listQuizzes`, `getQuiz`, `createQuiz`, `updateQuiz`, `deleteQuiz`, `createQuestion`, `updateQuestion`, `deleteQuestion`, `reorderQuestions`, `saveGameSession`.

#### `db.js`
Creates a `pg.Pool` from `process.env.DATABASE_URL`. If `DATABASE_URL` is absent, `isConnected = false` and the app falls back to `sampleQuiz.js` for reads; writes will error with a clear message. `initSchema()` runs `CREATE TABLE IF NOT EXISTS` for all five tables on startup — idempotent and safe to run repeatedly.

---

### Frontend (`frontend/src/`)

#### `App.jsx` — State Machine
The root component owns the entire application state via `useReducer`. State shape:
```js
{
  view: 'landing' | 'host' | 'player' | 'admin',
  gamePhase: 'idle' | 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'finished',
  roomCode: string | null,
  hostData: { players, currentQuestion, timeRemaining, roundResult, finalLeaderboard },
  playerData: { name, score, lastResult, leaderboard },
  isConnected: boolean,
}
```
All Socket.IO events update state via dispatched actions. No component subscribes to the socket directly except through callbacks passed as props.

#### `socket.js`
A singleton `io()` instance exported once. All components import the same socket reference so only one WebSocket connection is ever open per browser tab.

#### `LandingPage.jsx`
Entry screen. Three buttons: Host a Game, Join a Game, Admin Panel. Shows a live connection indicator (green dot = socket connected).

#### `HostView.jsx`
Multi-screen component for the game host. Renders different sub-components based on `gamePhase`:
- `HostSetup` — select quiz + team mode toggle
- `HostLobby` — PIN display, QR code, player list
- `HostQuestion` — question + answers + live answer progress bar
- `HostReveal` — correct answer highlighted + leaderboard preview
- `HostPodium` — final results

#### `PlayerView.jsx`
Multi-screen for players. Thin UI — no question text, just tiles and feedback.

#### `AdminPanel/`
Password-gated. `index.jsx` handles auth + quiz list + JSON import. `QuizEditor.jsx` handles question-by-question editing with image upload. All fetch calls use `${API_URL}/api/...` so they reach the Railway backend from the Vercel-hosted frontend.

---

### Mobile (`mobile/src/`)

#### `GameContext.js`
React Context wrapping Socket.IO. All screens consume `useGame()` to access `state` and `dispatch`. The socket connects to `EXPO_PUBLIC_SERVER_URL` and listens for the same events as the browser PlayerView.

#### Screen Flow
```
LandingScreen
     │ (Join a Game)
     ▼
JoinScreen  ──── enter PIN + name ──▶  emit join_room
     │ (join_success)
     ▼
WaitingScreen  ──── wait ──▶  on game_started
     │
     ▼
AnswerScreen  ──── tap tile ──▶  emit submit_answer
     │ (question_ended)
     ▼
ResultScreen  ──── on player_question_result
     │
     ▼
LeaderboardScreen  ──── on leaderboard_updated
     │ (repeat for each question)
     ▼
FinalScreen  ──── on game_finished
```

#### `AnswerTile.js`
Uses `useWindowDimensions` to scale tile height for iPad vs iPhone. Fires `expo-haptics` on tap for tactile feedback.

---

## Real-Time Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `create_room` | `{ quizId, teamMode }` | Host creates a game room |
| `join_room` | `{ roomCode, playerName, teamName? }` | Player joins a room |
| `start_game` | `{ roomCode }` | Host starts the game |
| `submit_answer` | `{ roomCode, answerIndex }` | Player submits an answer |
| `next_question` | `{ roomCode }` | Host advances to next question |
| `end_game` | `{ roomCode }` | Host ends game early |
| `request_rejoin` | `{ roomCode, playerName }` | Player reconnects mid-game |

### Server → Client

| Event | Recipients | Payload |
|---|---|---|
| `room_created` | Host only | `{ roomCode, quizTitle, questionCount }` |
| `join_success` | Joining player | `{ playerName, roomCode, players }` |
| `player_joined` | Host + all players | `{ players[] }` |
| `game_started` | All in room | `{ message }` |
| `question_started` | **Host**: full question + answers. **Players**: tile count + timeLimit only | See below |
| `timer_tick` | All in room | `{ timeRemaining }` |
| `answer_count_updated` | Host only | `{ answeredCount, totalPlayers }` |
| `answer_received` | Answering player | `{ answerIndex }` |
| `host_question_ended` | Host only | `{ correctAnswerIndex, roundTopScorer, leaderboard, ... }` |
| `question_ended` | All players | `{ correctAnswerIndex }` |
| `player_question_result` | Individual player | `{ isCorrect, pointsEarned, totalScore, rank }` |
| `leaderboard_updated` | All in room | `{ leaderboard[] }` |
| `game_finished` | All in room | `{ finalLeaderboard[] }` |

### Differential Broadcasting (Security Design)
When a question starts the server sends **two different payloads**:
```js
// To HOST:
socket.to(host).emit('question_started', {
  questionText: "What is ...",
  answers: [{ text: "London" }, ...],   // ← full answer text
  timeLimit, questionIndex, totalQuestions, pointsBase
})

// To PLAYERS:
socket.to(roomCode).emit('question_started', {
  answerCount: 4,      // ← only shape/tile count, NO text
  timeLimit, questionIndex, totalQuestions
})
```
This is intentional — players must read the question from the host's screen, not their own device.

---

## Database Schema

```sql
CREATE TABLE quizzes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image TEXT,
  is_public   BOOLEAN DEFAULT TRUE,
  is_active   BOOLEAN DEFAULT TRUE,   -- soft delete flag
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id     UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  image_url   TEXT,
  time_limit  INTEGER DEFAULT 20,
  points_base INTEGER DEFAULT 500,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE answer_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  is_correct  BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE game_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code    TEXT,
  quiz_id      UUID,
  quiz_title   TEXT,
  host_name    TEXT,
  player_count INTEGER,
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ,
  is_team_mode BOOLEAN DEFAULT FALSE
);

CREATE TABLE player_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_name     TEXT,
  team_name       TEXT,
  final_score     INTEGER,
  rank            INTEGER,
  correct_count   INTEGER,
  total_questions INTEGER,
  max_streak      INTEGER
);
```

---

## Deployment Topology

```
┌──────────────────────────────────────────────────────────┐
│                     RAILWAY PROJECT                       │
│                                                           │
│  ┌─────────────────────┐    ┌──────────────────────────┐ │
│  │   sabahlabs-backend │    │   Postgres (managed)     │ │
│  │                     │◄───│                          │ │
│  │  Node.js / Express  │    │  DATABASE_URL injected   │ │
│  │  Socket.IO          │    │  automatically           │ │
│  │  Port: auto (8080)  │    └──────────────────────────┘ │
│  │                     │                                 │
│  │  Public URL:        │                                 │
│  │  sabahlabs-backend- │                                 │
│  │  production.up.     │                                 │
│  │  railway.app        │                                 │
│  └─────────────────────┘                                 │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                     VERCEL PROJECT                        │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               sabahlabs-frontend                    │ │
│  │                                                     │ │
│  │  Static files (React SPA built with Vite)           │ │
│  │  No server-side rendering                           │ │
│  │                                                     │ │
│  │  Env vars baked in at BUILD TIME:                   │ │
│  │  VITE_SERVER_URL  → Railway backend URL             │ │
│  │  VITE_ADMIN_SECRET → admin password                 │ │
│  │                                                     │ │
│  │  Public URL: sabahlabs-frontend.vercel.app          │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  APPLE APP STORE                          │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               SabahLabs iOS App                     │ │
│  │            com.sabahlabs.app                        │ │
│  │                                                     │ │
│  │  Built with EAS Build (Expo Application Services)   │ │
│  │  Submitted via EAS Submit                           │ │
│  │  Status: In Progress                                │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Security Model

**Admin Authentication** — The admin panel requires a password that is compared client-side against `VITE_ADMIN_SECRET` (env var baked into the Vite build). All admin API calls also send the secret as an `x-admin-secret` header, which the backend validates against `process.env.ADMIN_SECRET`. Both must match.

**Score Integrity** — All scoring happens server-side. The `questionStartTime` is recorded on the server when a question is broadcast. Answer timestamps are measured on the server when the `submit_answer` event arrives. Clients only send the answer index — never a score or time.

**Question Secrecy** — Players never receive question text or answer labels via the socket. The server sends a trimmed payload with only tile count and time limit. This is enforced in `gameManager.js` before any broadcast.

**CORS** — The backend accepts requests from any origin (`origin: '*'`). For a stricter production setup, set `CLIENT_ORIGIN` in Railway env vars and change the cors config to `origin: process.env.CLIENT_ORIGIN`.

---

## Known Limitations & Future Work

| Item | Status | Notes |
|---|---|---|
| Mobile players see tiles only | By design | Host screen is the question display |
| iOS app on App Store | In progress | EAS Build configured |
| Image uploads are ephemeral | Known issue | Railway filesystem resets on redeploy — use an S3/Cloudinary URL instead |
| Single-server game state | Known | All rooms in Node.js memory — a server restart ends active games. Redis would fix this |
| No player accounts | Pending | Players join anonymously with just a name |
| Android app | Not started | React Native code is cross-platform — only needs `eas build --platform android` |
