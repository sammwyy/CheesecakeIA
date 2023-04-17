import { Configuration, OpenAIApi } from 'openai';
import { IPrompt } from './prompts';

interface IChatGPTResponse {
  content: string;
  tokens: number;
}

export default class ChatGPT {
  private readonly openai: OpenAIApi;
  private readonly model: string;

  constructor(apiKey: string | undefined, model: string) {
    if (!apiKey) {
      throw new Error('No OPENAI_TOKEN defined in environment variables.');
    }
    const configuration = new Configuration({ apiKey });
    this.openai = new OpenAIApi(configuration);
    this.model = model;
  }

  async ask(prompts: IPrompt[] | null): Promise<IChatGPTResponse | null> {
    if (!prompts) {
      return null;
    }

    const completion = await this.openai.createChatCompletion({
      model: this.model,
      messages: prompts,
    });

    const { choices, usage } = completion.data;
    const lastChoice = choices[choices.length - 1];
    const content = lastChoice.message?.content || '';
    const tokens = usage?.total_tokens || 0;

    return { content, tokens };
  }
}
