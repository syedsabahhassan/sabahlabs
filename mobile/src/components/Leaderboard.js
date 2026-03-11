import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors } from '../constants/theme';

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ entries = [], highlightName = null, maxRows = 8 }) {
  const visible = entries.slice(0, maxRows);

  if (!visible.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No scores yet</Text>
      </View>
    );
  }

  const renderItem = ({ item: entry, index: i }) => {
    const isHighlighted = highlightName && entry.name === highlightName;
    const isTop = i < 3;

    return (
      <View
        style={[
          styles.row,
          i === 0 && styles.top1,
          i === 1 && styles.top2,
          i === 2 && styles.top3,
          isHighlighted && styles.highlighted,
        ]}
      >
        <Text style={styles.rank}>{isTop ? RANK_EMOJI[i] : `#${i + 1}`}</Text>
        <View style={styles.nameWrapper}>
          <Text style={styles.name} numberOfLines={1}>{entry.name}</Text>
          {entry.teamName && (
            <Text style={styles.teamBadge}>{entry.teamName}</Text>
          )}
          {entry.streak >= 2 && (
            <Text style={styles.streakBadge}>🔥 ×{entry.streak}</Text>
          )}
        </View>
        <Text style={styles.score}>{(entry.score || 0).toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={visible}
      renderItem={renderItem}
      keyExtractor={(item) => item.socketId || item.name}
      contentContainerStyle={styles.list}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  list:        { gap: 8 },
  empty:       { padding: 24, alignItems: 'center' },
  emptyText:   { color: colors.textDim, fontWeight: '700' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, backgroundColor: colors.surface2, borderRadius: 14,
  },
  top1: { backgroundColor: '#7c3400', borderWidth: 2, borderColor: '#fbbf24' },
  top2: { backgroundColor: '#374151', borderWidth: 2, borderColor: '#9ca3af' },
  top3: { backgroundColor: '#5c1a00', borderWidth: 2, borderColor: '#fb923c' },
  highlighted: { borderWidth: 2, borderColor: colors.purpleLight },
  rank:        { width: 34, textAlign: 'center', fontSize: 20, fontWeight: '900', color: colors.white },
  nameWrapper: { flex: 1, gap: 2 },
  name:        { fontWeight: '800', color: colors.white, fontSize: 15 },
  teamBadge:   { fontSize: 11, color: colors.textDim, fontWeight: '700' },
  streakBadge: { fontSize: 11, color: colors.warning,  fontWeight: '700' },
  score:       { fontWeight: '900', fontSize: 15, color: colors.purpleLight },
});
