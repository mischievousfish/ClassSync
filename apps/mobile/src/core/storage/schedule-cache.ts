import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduleRecord } from '../sync/types';

const key = 'classsync-schedule-cache';

export async function readCachedSchedule(): Promise<ScheduleRecord[]> {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) as ScheduleRecord[] : [];
}

export async function saveCachedSchedule(record: ScheduleRecord): Promise<void> {
  const records = await readCachedSchedule();
  const current = records.find((item) => item.id === record.id);
  if (current && new Date(current.updatedAt).getTime() > new Date(record.updatedAt).getTime()) return;
  await AsyncStorage.setItem(key, JSON.stringify([...records.filter((item) => item.id !== record.id), record]));
}
