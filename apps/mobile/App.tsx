import React, { useEffect, useRef } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, Home, Sparkles, UserRound } from 'lucide-react-native';
import StudentDashboardScreen from './src/features/student/StudentDashboardScreen';
import OcrCaptureScreen from './src/features/student/OcrCaptureScreen';
import TeacherDashboardScreen from './src/features/teacher/TeacherDashboardScreen';
import AiGeneratorScreen from './src/features/teacher/AiGeneratorScreen';
import { useAppStore } from './src/core/state/useAppStore';
import { colors } from './src/shared/theme';
import { createFirebaseNotificationHandler } from './src/core/notifications/firebase-client';

export type RootStackParamList = { Main: undefined; OCR: undefined; AI: undefined };
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  const mode = useAppStore((state) => state.mode);
  return <Tabs.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.coral, tabBarInactiveTintColor: colors.muted, tabBarStyle: styles.tabBar, tabBarLabelStyle: styles.tabLabel }}>
    <Tabs.Screen name="Home" component={mode === 'STUDENT' ? StudentDashboardScreen : TeacherDashboardScreen} options={{ title: mode === 'STUDENT' ? 'Lịch của tôi' : 'Lớp của tôi', tabBarIcon: ({ color }) => <Home size={19} color={color} /> }} />
    <Tabs.Screen name="Profile" component={ProfilePlaceholder} options={{ title: 'Hồ sơ', tabBarIcon: ({ color }) => <UserRound size={19} color={color} /> }} />
  </Tabs.Navigator>;
}

function ProfilePlaceholder() {
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  return <View style={styles.profile}><Text style={styles.eyebrow}>Tài khoản</Text><Text style={styles.profileTitle}>Chào bạn, An.</Text><Text style={styles.profileText}>Chọn chế độ làm việc phù hợp với ngày hôm nay.</Text><Pressable onPress={() => setMode(mode === 'STUDENT' ? 'TEACHER' : 'STUDENT')} style={styles.modeButton}><Text style={styles.modeButtonText}>Chuyển sang {mode === 'STUDENT' ? 'Teacher' : 'Student'} Mode</Text></Pressable></View>;
}

export default function App() {
  const navigationRef = useRef<any>(null);
  useEffect(() => {
    const handler = createFirebaseNotificationHandler((route) => navigationRef.current?.navigate('Main', { screen: 'Home', params: { assignmentId: route.assignmentId, classId: route.classId } }));
    void handler.initialize();
    return () => handler.dispose();
  }, []);
  return <NavigationContainer ref={navigationRef} theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.paper, card: colors.paper, text: colors.ink, primary: colors.coral } }}><StatusBar style="dark" /><Stack.Navigator screenOptions={{ headerTintColor: colors.ink, headerTitleStyle: { fontWeight: '800' }, headerShadowVisible: false, headerStyle: { backgroundColor: colors.paper } }}><Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} /><Stack.Screen name="OCR" component={OcrCaptureScreen} options={{ title: 'Quét bài tập' }} /><Stack.Screen name="AI" component={AiGeneratorScreen} options={{ title: 'Trợ lý AI' }} /></Stack.Navigator></NavigationContainer>;
}

const styles = StyleSheet.create({ tabBar: { backgroundColor: colors.paper, borderTopColor: '#DCE0D8', height: 66, paddingBottom: 8, paddingTop: 7 }, tabLabel: { fontSize: 10, fontWeight: '800' }, profile: { backgroundColor: colors.paper, flex: 1, padding: 22 }, eyebrow: { color: colors.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }, profileTitle: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: 8 }, profileText: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10, maxWidth: 300 }, modeButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: 99, marginTop: 26, padding: 15 }, modeButtonText: { color: colors.lime, fontSize: 13, fontWeight: '800' } });
