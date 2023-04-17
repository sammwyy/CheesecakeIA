import dotenv from 'dotenv';

import Logger from './logger';
import Prompts from './prompts';
import { ISetting, loadSettings } from './settings';
import { Twitch } from './twitch';
import ChatGPT from './chatgpt';
import TTS from './tts';

function printBanner(settings: ISetting) {
  console.clear();
  console.log(`
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡠⠒⠊⠉⠁⠉⢳⠀⠀⠀⠀
    ⠀⠀⠀⠀⢀⣀⣀⣀⡀⠀⣀⠤⠦⡠⠤⠒⠉⠉⠁⠀⠀⢀⣠⡤⡄⢸
    ⠀⠀⠀⠌⠀⠀⠀⠀⠈⠝⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠒⡇⡌⠀⠀⠀⠀    Cheesecake AI (v${settings.version}) [${process.env.NODE_ENV}]
    ⠀⠀⠀⢠⠀⠂⡤⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⡎⠀⠀⠀⠀⠀    ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    ⠀⠀⠀⠈⡄⠀⢱⡁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠱⢲⠀⠀⠀⠀
    ⠀⠀⠀⠀⠘⢄⠘⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡇⠙⡶⠃⠸⢲       > Blacklisted words: ${settings.blacklist.length}
    ⠀⠀⠀⠀⠀⠠⠓⠀⠀⠀⢠⣸⠋⢱⡀⠀⢀⣺⣇⠆⠀⠀⠀⠀⠀⠀⡎       > Channel: ${settings.channel}
    ⠀⠀⠀⠀⠀⠀⡵⢄⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡰⠁       > Min bits: ${settings.minBits}
    ⠀⠀⠀⠀⠀⠀⠈⠢⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⠚⠀⠀⠀⠀⠀    > Max prompt length: ${settings.maxPromptLength}
    ⠀⠀⠀⢀⠔⠂⢄⠀⠀⠉⠒⡤⠤⣀⣀⡀⠀⠀⠀⡠⠤⠒⠉⠀⠀⠀⠀       > Max response length: ${settings.maxResponseLength}
    ⠀⠀⠀⠸⡀⠀⠀⠱⡤⡀⡎⠉⠀⠈⠉⠀⠀⠀⢀⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⢀⠗⠂⠀⠈⠀⠸⠍⠀⠀⠉⠐⡄⠀⡆⢸⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠈⠒⡄⠀⣀⢴⣀⣆⠀⠀⠀⠀⡸⡀⢸⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠹⠤⠄⠀⡹⠷⠼⠴⠠⠤⠕⠀⠀⠀⠀⠀⠀⠀⠀
    `);
}

async function main() {
  // Load environment variables from .env file.
  dotenv.config();

  // Load settings.
  const settings = await loadSettings();
  printBanner(settings);
  Logger.endMeasure('Settings successfully loaded.');

  // Load prompts.
  const prompts = new Prompts(settings);
  await prompts.load();
  Logger.endMeasure('Prompts successfully loaded.');

  // Load TTS.
  const tts = new TTS();
  await tts.start();
  Logger.endMeasure(`Loaded TTS voices`);

  // Connect to twitch chat.
  const twitch = new Twitch(settings.channel, process.env['TWITCH_ACCESS_TOKEN']);
  await twitch.connectChat();
  Logger.endMeasure('Connected to Twitch chat.');

  // Connect to OpenAI.
  const chatgpt = new ChatGPT(process.env['OPENAI_TOKEN'], settings.model);
  Logger.endMeasure('Connected to OpenAI API.');

  tts.say('hola lol');

  // Listen for twitch chat.
  let bussy = false;

  twitch.on('chat', async ({ username, message, reply }) => {
    if (bussy) {
      return;
    } else {
      Logger.info('Processing incoming message: ' + username + ': ' + message);
      bussy = true;
    }

    Logger.startMeasure();
    const prompt = prompts.createChatPrompt(username, message);
    const response = await chatgpt.ask(prompt);

    if (response) {
      const { content, tokens } = response;
      tts.say(content);
      Logger.endMeasure(
        `Completion:\n       ${username}: ${message}\n       IA: ${content}\n       Token usage: ${tokens}`,
      );
    }

    bussy = false;
  });
}

main().catch((e) => Logger.crit(`Whoaa, app crashed :(\n    `, e));
