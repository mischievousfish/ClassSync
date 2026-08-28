import { StyleSheet } from 'react-native';

export const colors = {
  ink: '#10272A', paper: '#F4F1E8', lime: '#D8F36D', coral: '#FF8068', sky: '#B9E5DF', muted: '#6B7774', white: '#FFFFFF', line: '#DCE0D8', danger: '#C84F40', yellow: '#E7B84B', green: '#3F966B',
};

export const commonStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, paddingBottom: 36 },
  eyebrow: { color: colors.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 16, shadowColor: colors.ink, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  pill: { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 9 },
});
