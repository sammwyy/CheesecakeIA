import Say from 'say';

export default class TTS {
  constructor() {}

  start() {
    return new Promise((resolve) => Say.getInstalledVoices(resolve));
  }

  say(message?: string | null) {
    return new Promise((resolve, reject) => {
      if (message) {
        Say.speak(message, undefined, 1, resolve);
      } else {
        reject(new Error('Message is null.'));
      }
    });
  }
}
