/**
 * Stockfish (WebAssembly, Web Worker) wrapper speaking UCI.
 * One instance per job: analysis and the bot each get their own worker.
 */
export default class Engine {
  constructor() {
    this.worker = new Worker('/engine/stockfish.wasm.js');
    this.isReady = false;
    this.listeners = [];

    this.worker.addEventListener('message', (event) => {
      const parsed = parseMessage(event.data);
      if (parsed.raw === 'readyok') this.isReady = true;
      this.listeners.forEach((cb) => cb(parsed));
    });

    this.send('uci');
    this.send('isready');
  }

  onMessage(cb) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  send(command) {
    this.worker.postMessage(command);
  }

  setOption(name, value) {
    this.send(`setoption name ${name} value ${value}`);
  }

  analyse(fen, timeMs) {
    this.send(`position fen ${fen}`);
    this.send(`go movetime ${timeMs}`);
  }

  searchDepth(fen, depth) {
    this.send(`position fen ${fen}`);
    this.send(`go depth ${depth}`);
  }

  stop() {
    this.send('stop');
  }

  terminate() {
    this.isReady = false;
    this.send('quit');
    this.worker.terminate();
  }
}

export function parseMessage(rawMessage) {
  const raw = String(rawMessage);
  const int = (re) => {
    const m = raw.match(re);
    return m ? parseInt(m[1], 10) : null;
  };
  return {
    raw,
    bestMove: raw.match(/^bestmove\s+(\S+)/)?.[1] ?? null,
    cp: int(/\bscore cp\s+(-?\d+)/),
    mate: int(/\bscore mate\s+(-?\d+)/),
    depth: int(/\bdepth\s+(\d+)/),
  };
}
