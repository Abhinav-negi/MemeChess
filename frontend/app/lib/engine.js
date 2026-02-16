/**
 * Stockfish Chess Engine Wrapper
 * Handles UCI protocol communication with Stockfish WebAssembly
 */

export default class Engine {
  constructor() {
    // ✅ Create worker instance
    this.worker = new Worker('/stockfish.wasm.js');
    this.isReady = false;
    this.messageCallbacks = [];
    
    // ✅ Setup message listener
    this.worker.addEventListener('message', (event) => {
      const parsed = this.parseMessage(event.data);
      
      // Call all registered callbacks
      this.messageCallbacks.forEach(callback => {
        callback(parsed);
      });
    });
    
    // ✅ Initialize engine
    this.init();
  }

  /**
   * Parse Stockfish UCI message into structured data
   */
  parseMessage(rawMessage) {
    const message = typeof rawMessage === 'string' ? rawMessage : String(rawMessage);
    
    return {
      // Raw UCI message
      raw: message,
      
      // Best move found (e.g., "e2e4")
      bestMove: message.match(/bestmove\s+(\S+)/)?.[1] || null,
      
      // Ponder move (opponent's expected response)
      ponder: message.match(/ponder\s+(\S+)/)?.[1] || null,
      
      // Position evaluation in centipawns
      positionEvaluation: message.match(/\bcp\s+(-?\d+)/)?.[1] || null,
      
      // Mate in X moves
      possibleMate: message.match(/\bmate\s+(-?\d+)/)?.[1] || null,
      
      // Principal variation (best line)
      pv: message.match(/\bpv\s+(.+?)(?:\s+string|$)/)?.[1] || null,
      
      // Search depth
      depth: parseInt(message.match(/\bdepth\s+(\d+)/)?.[1]) || null,
      
      // Nodes searched
      nodes: parseInt(message.match(/\bnodes\s+(\d+)/)?.[1]) || null,
      
      // Nodes per second
      nps: parseInt(message.match(/\bnps\s+(\d+)/)?.[1]) || null,
      
      // Time spent (milliseconds)
      time: parseInt(message.match(/\btime\s+(\d+)/)?.[1]) || null,
      
      // Selective depth
      seldepth: parseInt(message.match(/\bseldepth\s+(\d+)/)?.[1]) || null,
    };
  }

  /**
   * Initialize the engine
   */
  init() {
    this.postMessage('uci');
    this.postMessage('isready');
    
    // Wait for readyok
    this.onMessage(({ raw }) => {
      if (raw === 'readyok') {
        this.isReady = true;
      }
    });
  }

  /**
   * Register a message callback
   */
  onMessage(callback) {
    this.messageCallbacks.push(callback);
  }

  /**
   * Remove a message callback
   */
  offMessage(callback) {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  /**
   * Wait until engine is ready
   */
  async waitForReady() {
    if (this.isReady) return;
    
    return new Promise((resolve) => {
      const checkReady = ({ raw }) => {
        if (raw === 'readyok') {
          this.offMessage(checkReady);
          resolve();
        }
      };
      this.onMessage(checkReady);
    });
  }

  /**
   * Send a UCI command to the engine
   */
  postMessage(command) {
    this.worker.postMessage(command);
  }

  /**
   * Evaluate a position
   * @param {string} fen - FEN string of the position
   * @param {number} depth - Search depth (1-24)
   */
  evaluatePosition(fen, depth = 15) {
    // Clamp depth
    if (depth > 24) depth = 24;
    if (depth < 1) depth = 1;
    
    this.postMessage(`position fen ${fen}`);
    this.postMessage(`go depth ${depth}`);
  }

  /**
   * Evaluate with time limit instead of depth
   * @param {string} fen - FEN string
   * @param {number} timeMs - Time in milliseconds
   */
  evaluatePositionTimed(fen, timeMs = 1000) {
    this.postMessage(`position fen ${fen}`);
    this.postMessage(`go movetime ${timeMs}`);
  }

  /**
   * Stop current calculation
   */
  stop() {
    this.postMessage('stop');
  }

  /**
   * Terminate the engine
   */
  terminate() {
    this.isReady = false;
    this.postMessage('quit');
    this.worker.terminate();
  }
}