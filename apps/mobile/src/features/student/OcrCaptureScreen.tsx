import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, ImagePlus, ScanLine } from 'lucide-react-native';
import { colors, commonStyles } from '../../shared/theme';
import { saveCachedSchedule } from '../../core/storage/schedule-cache';

type ParsedAssignment = { subject: string; assignmentTitle: string; extractedDescription: string; detectedDueDate: string | null; actionItems: string[] };

export default function OcrCaptureScreen() {
  const [imageUri, setImageUri] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<ParsedAssignment>();

  async function chooseImage(source: 'camera' | 'gallery') {
    const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const picker = source === 'camera' ? await ImagePicker.launchCameraAsync({ base64: true, quality: .8 }) : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: .8 });
    if (picker.canceled || !picker.assets[0]) return;
    const asset = picker.assets[0]; setImageUri(asset.uri); setLoading(true); setSaved(false);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'}/ocr/parse-assignment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` }) });
      if (!response.ok) throw new Error('OCR request failed');
      setResult(await response.json() as ParsedAssignment);
    } catch { setResult({ subject: 'Chưa xác định', assignmentTitle: 'Bài tập mới', extractedDescription: 'Không thể kết nối. Bạn có thể nhập thủ công.', detectedDueDate: null, actionItems: [] }); } finally { setLoading(false); }
  }

  async function saveDeadline() {
    if (!result) return;
    await saveCachedSchedule({ id: `ocr-${Date.now()}`, userId: 'current-user', classId: 'personal', title: result.assignmentTitle, description: result.extractedDescription, dueDate: result.detectedDueDate ?? new Date().toISOString(), updatedAt: new Date().toISOString(), pendingSync: true });
    setSaved(true);
  }

  return <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.content}><Text style={commonStyles.eyebrow}>Smart OCR</Text><Text style={[commonStyles.title, { marginTop: 7 }]}>Quét bài tập</Text><Text style={[commonStyles.muted, { marginTop: 8 }]}>Chụp ảnh, kiểm tra thông tin, rồi lưu deadline vào lịch.</Text>{!imageUri && <View style={styles.empty}><ScanLine color={colors.coral} size={34} /><Text style={styles.emptyTitle}>AI sẽ đọc bài tập của bạn</Text><Text style={commonStyles.muted}>Ảnh rõ nét giúp kết quả chính xác hơn.</Text><View style={styles.actions}><Pressable onPress={() => chooseImage('camera')} style={styles.primary}><Camera color={colors.lime} size={18} /><Text style={styles.primaryText}>Mở camera</Text></Pressable><Pressable onPress={() => chooseImage('gallery')} style={styles.secondary}><ImagePlus color={colors.ink} size={18} /><Text style={styles.secondaryText}>Chọn ảnh</Text></Pressable></View></View>}{imageUri && <View style={styles.preview}><Image source={{ uri: imageUri }} style={styles.image} />{loading && <View style={styles.loading}><ActivityIndicator color={colors.lime} /><Text style={styles.loadingText}>AI đang đọc bài tập...</Text></View>}</View>}{result && !loading && <View style={styles.form}><Text style={styles.confirmTitle}>Kiểm tra thông tin</Text><Text style={styles.label}>Tiêu đề</Text><TextInput value={result.assignmentTitle} onChangeText={(value) => setResult({ ...result, assignmentTitle: value })} style={styles.input} /><Text style={styles.label}>Môn học</Text><TextInput value={result.subject} onChangeText={(value) => setResult({ ...result, subject: value })} style={styles.input} /><Text style={styles.label}>Chi tiết</Text><TextInput multiline value={result.extractedDescription} onChangeText={(value) => setResult({ ...result, extractedDescription: value })} style={[styles.input, styles.multiline]} /><Text style={styles.label}>Deadline</Text><TextInput placeholder="YYYY-MM-DD HH:mm" value={result.detectedDueDate ?? ''} onChangeText={(value) => setResult({ ...result, detectedDueDate: value || null })} style={styles.input} /><Pressable onPress={saveDeadline} style={styles.save}>{saved ? <Check color={colors.ink} size={18} /> : null}<Text style={styles.saveText}>{saved ? 'Đã lưu vào lịch' : 'Lưu deadline'}</Text></Pressable></View>}</ScrollView>;
}
const styles = StyleSheet.create({ empty: { alignItems: 'center', backgroundColor: colors.sky, borderRadius: 20, marginTop: 28, paddingHorizontal: 18, paddingVertical: 48 }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 16 }, actions: { flexDirection: 'row', gap: 9, marginTop: 26 }, primary: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: 99, flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 12 }, primaryText: { color: colors.lime, fontSize: 12, fontWeight: '800', marginLeft: 7 }, secondary: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: 99, flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 12 }, secondaryText: { color: colors.ink, fontSize: 12, fontWeight: '800', marginLeft: 7 }, preview: { borderRadius: 20, marginTop: 24, overflow: 'hidden' }, image: { backgroundColor: colors.line, height: 230, width: '100%' }, loading: { alignItems: 'center', backgroundColor: colors.ink, bottom: 0, flexDirection: 'row', left: 0, padding: 14, position: 'absolute', right: 0 }, loadingText: { color: colors.lime, fontSize: 12, fontWeight: '800', marginLeft: 9 }, form: { backgroundColor: colors.white, borderRadius: 20, marginTop: 15, padding: 18 }, confirmTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', marginBottom: 18 }, label: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: .6, marginBottom: 6, marginTop: 12, textTransform: 'uppercase' }, input: { borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 14, paddingHorizontal: 12, paddingVertical: 11 }, multiline: { minHeight: 72, textAlignVertical: 'top' }, save: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 99, flexDirection: 'row', justifyContent: 'center', marginTop: 22, padding: 14 }, saveText: { color: colors.ink, fontSize: 13, fontWeight: '800', marginLeft: 7 } });
