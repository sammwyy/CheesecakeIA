import EventEmitter from 'events';
import tmi, { ChatUserstate, Userstate } from 'tmi.js';

export class Twitch extends EventEmitter {
  private channel: string;
  private accessToken: string;

  constructor(channel: string, accessToken?: string) {
    super();

    if (!accessToken) {
      throw new Error('No TWITCH_ACCESS_TOKEN defined in environment variables.');
    }

    this.channel = channel;
    this.accessToken = accessToken;
  }

  async connectChat() {
    const chat = new tmi.Client({
      channels: [this.channel],
      identity: {
        username: this.channel,
        password: `oauth:${this.accessToken}`,
      },
      connection: {
        reconnect: true,
        secure: true,
        timeout: 10000,
      },
    });

    chat.on('message', (channel: string, userstate: ChatUserstate, message: string, self: boolean) => {
      const { username, color, emotes, mod, id, subscriber } = userstate;

      if (self || username?.toLowerCase() != 'sammwy') {
        return;
      }

      const reply = (response: string) => {
        chat.say(channel, `${username}, ${response}`);
      };

      this.emit('chat', { message, username, color, emotes, mod, id, subscriber, reply });
    });

    await chat.connect();
  }
}
