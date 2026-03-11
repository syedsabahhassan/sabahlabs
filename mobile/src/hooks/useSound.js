/**
 * useSound hook — stub (sounds are placeholders)
 *
 * HOW TO ADD REAL SOUNDS IN FUTURE:
 *   1. Install expo-audio: npx expo install expo-audio
 *   2. Add audio files to mobile/assets/sounds/
 *   3. Implement with useAudioPlayer from expo-audio
 */
import { useCallback } from 'react';

export default function useSound() {
  // No-op: all sounds are placeholder until real audio assets are added.
  // Replace with real expo-audio implementation when assets are ready.
  const play = useCallback((_key) => {}, []);
  return { play };
}
