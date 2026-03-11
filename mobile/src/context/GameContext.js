import React, { createContext, useContext } from 'react';
import useGameSocket from '../hooks/useGameSocket';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const game = useGameSocket();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
