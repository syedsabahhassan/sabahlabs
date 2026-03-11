/**
 * useGameSocket
 * Central socket hook for the mobile player.
 * Mirrors the same event contract as the web frontend.
 */

import { useEffect, useReducer, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3001';

// ─── State ───────────────────────────────────
const initialState = {
  isConnected: false,
  error: null,
  roomCode: null,
  playerName: null,
  teamName: null,
  gamePhase: 'idle',      // idle | lobby | question | reveal | finished
  questionData: null,
  timeRemaining: 0,
  myAnswer: null,
  answerLocked: false,
  roundResult: null,
  currentScore: 0,
  currentStreak: 0,
  leaderboard: [],
  finalLeaderboard: [],
  playerList: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'CONNECTED':    return { ...state, isConnected: true };
    case 'DISCONNECTED': return { ...state, isConnected: false };
    case 'ERROR':        return { ...state, error: action.payload };
    case 'CLEAR_ERROR':  return { ...state, error: null };
    case 'RESET':        return { ...initialState };

    case 'JOIN_SUCCESS':
      return { ...state, roomCode: action.payload.roomCode, playerName: action.payload.playerName, teamName: action.payload.teamName, gamePhase: 'lobby', error: null };

    case 'PLAYER_JOINED':
      return { ...state, playerList: action.payload.playerList };

    case 'GAME_STARTED':
      return { ...state, gamePhase: 'question' };

    case 'QUESTION_STARTED':
      return {
        ...state, gamePhase: 'question',
        questionData: action.payload,
        timeRemaining: action.payload.timeLimit,
        myAnswer: null, answerLocked: false, roundResult: null,
      };

    case 'TIMER_TICK':
      return { ...state, timeRemaining: action.payload.timeRemaining };

    case 'ANSWER_RECEIVED':
      return { ...state, myAnswer: action.payload.answerIndex, answerLocked: true };

    case 'ANSWER_LOCKED':
      return { ...state, answerLocked: true };

    case 'QUESTION_RESULT':
      return {
        ...state,
        gamePhase: 'reveal',
        roundResult: action.payload,
        currentScore: action.payload.totalScore,
        currentStreak: action.payload.newStreak,
        answerLocked: true,
      };

    case 'LEADERBOARD':
      return { ...state, leaderboard: action.payload.leaderboard };

    case 'GAME_FINISHED':
      return { ...state, gamePhase: 'finished', finalLeaderboard: action.payload.leaderboard };

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────
export default function useGameSocket() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
      transports: ['websocket'],
    });

    socket.connect();
    socketRef.current = socket;

    socket.on('connect',    () => dispatch({ type: 'CONNECTED' }));
    socket.on('disconnect', () => dispatch({ type: 'DISCONNECTED' }));

    socket.on('join_success',  (d) => dispatch({ type: 'JOIN_SUCCESS', payload: d }));
    socket.on('join_error',    (d) => dispatch({ type: 'ERROR', payload: d.message }));
    socket.on('game_started',  ()  => dispatch({ type: 'GAME_STARTED' }));

    socket.on('question_started', (d) => {
      if (!d.isHost) dispatch({ type: 'QUESTION_STARTED', payload: d });
    });

    socket.on('timer_tick',        (d) => dispatch({ type: 'TIMER_TICK',    payload: d }));
    socket.on('answer_received',   (d) => dispatch({ type: 'ANSWER_RECEIVED', payload: d }));
    socket.on('answer_locked',     ()  => dispatch({ type: 'ANSWER_LOCKED' }));
    socket.on('player_question_result', (d) => dispatch({ type: 'QUESTION_RESULT', payload: d }));
    socket.on('leaderboard_updated',    (d) => dispatch({ type: 'LEADERBOARD', payload: d }));
    socket.on('game_finished',  (d) => dispatch({ type: 'GAME_FINISHED', payload: d }));

    socket.on('player_joined', (d) => dispatch({ type: 'PLAYER_JOINED', payload: d }));

    socket.on('host_disconnected', () =>
      dispatch({ type: 'ERROR', payload: 'The host disconnected. Game over.' })
    );
    socket.on('error', (d) => dispatch({ type: 'ERROR', payload: d.message }));

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
    };
  }, []);

  const joinRoom = useCallback((roomCode, playerName, teamName) => {
    dispatch({ type: 'CLEAR_ERROR' });
    socketRef.current?.emit('join_room', {
      roomCode: roomCode.toUpperCase().trim(),
      playerName: playerName.trim(),
      teamName,
    });
  }, []);

  const submitAnswer = useCallback((answerIndex) => {
    socketRef.current?.emit('submit_answer', { answerIndex });
  }, []);

  const reset = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current?.connect();
    dispatch({ type: 'RESET' });
  }, []);

  return { state, joinRoom, submitAnswer, reset };
}
