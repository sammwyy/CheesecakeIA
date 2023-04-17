class ConsoleLogger {
  private time: number;

  constructor() {
    this.startMeasure();
  }

  print(prefix: string, ...message: any) {
    console.log(`${prefix} ${message.join(' ')}`);
  }

  crit(...message: any) {
    this.print('\u001b[31mCRIT', ...message, '\u001b[0m');
  }

  info(...message: any) {
    this.print('\u001b[36mINFO\u001b[0m', ...message);
  }

  warn(...message: any) {
    this.print('\u001b[33mWARN\u001b[0m', ...message);
  }

  startMeasure() {
    this.time = Date.now();
  }

  endMeasure(...message: any) {
    const elapsed = Date.now() - this.time;
    this.info(...message, `\u001b[33m(took ${elapsed}ms)\u001b[0m`);
    this.startMeasure();
  }
}

const Logger = new ConsoleLogger();
export default Logger;
