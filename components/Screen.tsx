import React, { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

/** Native safe areas, and a bounded responsive canvas on larger screens. */
export function Screen({ children, green = false, topPadding }: { children: ReactNode; green?: boolean; topPadding?: number }) {
  const insets = useSafeAreaInsets();
  return <View style={[s.outer, green && s.green]}>
    <ScrollView style={s.scroll} contentContainerStyle={s.grow} showsVerticalScrollIndicator={false}>
      <View style={[s.canvas, {
        paddingTop: topPadding === undefined ? (Platform.OS === 'web' ? 62 : insets.top) + 20 : insets.top + topPadding,
        paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 23,
      }]}>{children}</View>
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.background },
  green: { backgroundColor: colors.primary },
  scroll: { flex: 1 },
  grow: { flexGrow: 1, alignItems: 'center' },
  canvas: { width: '100%', maxWidth: 480, flexGrow: 1, paddingHorizontal: 20 },
});
