import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../../core/state/useAppStore';
import { colors, commonStyles } from '../theme';

export function ModeSwitcher() {
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  return <View style={styles.container}><Pressable onPress={() => setMode('STUDENT')} style={[commonStyles.pill, mode === 'STUDENT' && styles.active]}><Text style={[styles.label, mode === 'STUDENT' && styles.activeLabel]}>Học sinh</Text></Pressable><Pressable onPress={() => setMode('TEACHER')} style={[commonStyles.pill, mode === 'TEACHER' && styles.active]}><Text style={[styles.label, mode === 'TEACHER' && styles.activeLabel]}>Giáo viên</Text></Pressable></View>;
}

const styles = StyleSheet.create({ container: { flexDirection: 'row', backgroundColor: '#E8E8DE', borderRadius: 99, padding: 3 }, active: { backgroundColor: colors.ink }, label: { color: colors.muted, fontSize: 12, fontWeight: '800' }, activeLabel: { color: colors.lime } });
