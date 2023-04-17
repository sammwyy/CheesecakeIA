import fs from 'fs/promises';
import path from 'path';

export interface ISetting {
  blacklist: string[];
  channel: string;
  maxPromptLength: number;
  maxResponseLength: number;
  minBits: number;
  model: string;
  version: string;
}

export async function loadSettings(file?: string): Promise<ISetting> {
  if (!file) {
    file = path.join(__dirname, '..', 'data', 'settings.json');
  }

  const raw = await fs.readFile(file, { encoding: 'utf-8' });
  const settings = JSON.parse(raw) as ISetting;

  const parentFile = path.basename(file);
  const packageRaw = await fs.readFile(path.join(parentFile, '..', 'package.json'), { encoding: 'utf-8' });
  const packageJson = JSON.parse(packageRaw);

  settings.version = packageJson.version;
  return settings;
}
