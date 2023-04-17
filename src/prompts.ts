import fs from 'fs/promises';
import path from 'path';
import { ISetting } from './settings';

export interface IPrompt {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

export interface IPromptMap {
  chat: IPrompt[];
}

export default class Prompts {
  private prompts: IPromptMap | null;
  private settings: ISetting;

  constructor(settings: ISetting) {
    this.prompts = null;
    this.settings = settings;
  }

  injectPlaceholders() {
    const maxResponseLength = this.settings.maxResponseLength.toString();
    if (this.prompts) {
      for (const prompt of this.prompts.chat) {
        const original = prompt.content;
        prompt.content = original.replace('{maxResponseLength}', maxResponseLength);
      }
    }
  }

  async load(file?: string) {
    if (!file) {
      file = path.join(__dirname, '..', 'data', 'prompts.json');
    }

    const raw = await fs.readFile(file, { encoding: 'utf-8' });
    this.prompts = JSON.parse(raw);
    this.injectPlaceholders();
  }

  createChatPrompt(user: string, message: string): IPrompt[] | null {
    if (!this.prompts) {
      return null;
    }

    if (message.length > this.settings.maxPromptLength) {
      return null;
    }

    for (const word of message.split(' ')) {
      if (this.settings.blacklist.includes(word.toLowerCase())) {
        return null;
      }
    }

    const prompts = [...this.prompts.chat];
    prompts.push({
      role: 'user',
      content: `${user}: ${message}`,
    });
    return prompts;
  }
}
