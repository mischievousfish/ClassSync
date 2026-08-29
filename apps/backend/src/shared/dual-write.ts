export interface DualWriteAdapter<Legacy, Current> {
  toLegacy(value: Current): Legacy;
  toCurrent(value: Legacy): Current;
}

export async function dualWrite<Legacy, Current>(input: Current, adapter: DualWriteAdapter<Legacy, Current>, writeLegacy: (value: Legacy) => Promise<void>, writeCurrent: (value: Current) => Promise<void>): Promise<void> {
  await Promise.all([writeLegacy(adapter.toLegacy(input)), writeCurrent(input)]);
}

export function readWithFallback<Legacy, Current>(legacy: Legacy | undefined, current: Current | undefined, adapter: DualWriteAdapter<Legacy, Current>): Current | undefined {
  return current ?? (legacy === undefined ? undefined : adapter.toCurrent(legacy));
}