import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  await ensureDir();
  const file = path.join(DATA_DIR, `${key}.json`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  await ensureDir();
  const file = path.join(DATA_DIR, `${key}.json`);
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf-8");
}


