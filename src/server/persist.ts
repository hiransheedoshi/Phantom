import fs from 'fs';
import path from 'path';

export function dataFilePath(): string {
  return process.env.DATA_FILE || path.resolve(process.cwd(), 'data', 'phantom-state.json');
}

export function loadPersistedState<T>(): T | null {
  const file = dataFilePath();
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch (err) {
    console.warn('Could not load persisted lab state:', (err as Error).message);
    return null;
  }
}

export function savePersistedState(state: unknown): void {
  const file = dataFilePath();
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state));
  } catch (err) {
    console.warn('Could not persist lab state:', (err as Error).message);
  }
}
