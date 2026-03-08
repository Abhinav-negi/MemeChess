/**
 * Stockfish Chess Engine Wrapper
 * Handles UCI protocol communication with Stockfish WebAssembly
 */
export default class Engine {
  constructor() {
    this.worker = new Worker('/stockfish.wasm.js');
    this.isReady = false;
    this.stockfishLoaded = false;
    this.messageCallbacks = [];
    this.currentElo = null;
    this.currentMultiPV = 1;  // ✅ Track MultiPV setting
    
    this.worker.addEventListener('message', (event) => {
      const parsed = this.parseMessage(event.data);
      this.messageCallbacks.forEach(callback => {
        callback(parsed);
      });
    });
    
    this.init();
  }

  parseMessage(rawMessage) {
    const message = typeof rawMessage === 'string' ? rawMessage : String(rawMessage);
    
    return {
      raw: message,
      bestMove: message.match(/bestmove\s+(\S+)/)?.[1] || null,
      ponder: message.match(/ponder\s+(\S+)/)?.[1] || null,
      positionEvaluation: message.match(/\bcp\s+(-?\d+)/)?.[1] || null,
      possibleMate: message.match(/\bmate\s+(-?\d+)/)?.[1] || null,
      pv: message.match(/\bpv\s+(.+?)(?:\s+string|$)/)?.[1] || null,
      depth: parseInt(message.match(/\bdepth\s+(\d+)/)?.[1]) || null,
      multipv: parseInt(message.match(/\bmultipv\s+(\d+)/)?.[1]) || null,  // ✅ Parse MultiPV
      nodes: parseInt(message.match(/\bnodes\s+(\d+)/)?.[1]) || null,
      nps: parseInt(message.match(/\bnps\s+(\d+)/)?.[1]) || null,
      time: parseInt(message.match(/\btime\s+(\d+)/)?.[1]) || null,
      seldepth: parseInt(message.match(/\bseldepth\s+(\d+)/)?.[1]) || null,
    };
  }

  init() {
    this.postMessage('uci');
    this.postMessage('isready');
    
    this.onMessage(({ raw }) => {
      if (raw === 'uciok') {
        this.stockfishLoaded = true;
        console.log('✅ Stockfish UCI OK');
      }
      if (raw === 'readyok') {
        this.isReady = true;
        console.log('✅ Stockfish ready');
      }
    });
  }

  onMessage(callback) {
    this.messageCallbacks.push(callback);
  }

  offMessage(callback) {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  postMessage(command) {
    this.worker.postMessage(command);
  }

  /**
   * ✅ Set ELO difficulty AND MultiPV
   */
  setElo(eloRating, multiPV = 1) {
    if (eloRating === null || eloRating >= 2700) {
      this.postMessage('setoption name UCI_LimitStrength value false');
      console.log('♟️ Stockfish: Full strength');
    } else {
      this.postMessage('setoption name UCI_LimitStrength value true');
      this.postMessage(`setoption name UCI_Elo value ${eloRating}`);
      console.log(`♟️ Stockfish ELO: ${eloRating}`);
    }
    
    // ✅ Set MultiPV (number of best moves to calculate)
    this.currentMultiPV = multiPV;
    this.postMessage(`setoption name MultiPV value ${multiPV}`);
    console.log(`♟️ Stockfish MultiPV: ${multiPV}`);
    
    this.currentElo = eloRating;
  }

  evaluatePositionTimed(fen, timeMs = 1000) {
    this.postMessage(`position fen ${fen}`);
    this.postMessage(`go movetime ${timeMs}`);
  }

  /**
   * ✅ Find best move - but pick the Nth best based on MultiPV
   */
  findBestMove(fen, callback, thinkTime = 1000, pickMove = 1) {
    const moves = [];  // Store all PV lines
    
    const handleMove = (data) => {
      // Collect all MultiPV lines
      if (data.multipv && data.pv) {
        moves[data.multipv - 1] = {
          move: data.pv.split(' ')[0],
          multipv: data.multipv,
          score: data.positionEvaluation
        };
      }
      
      // When we get bestmove, pick the Nth option
      if (data.bestMove) {
        this.offMessage(handleMove);
        
        // ✅ Pick the Nth best move (1 = best, 2 = 2nd best, etc.)
        const selectedIndex = Math.min(pickMove - 1, moves.length - 1);
        const selectedMove = moves[selectedIndex]?.move || data.bestMove;
        
        console.log(`🎯 Bot options:`, moves.map(m => m.move));
        console.log(`🎯 Bot picks #${pickMove}: ${selectedMove}`);
        
        callback(selectedMove);
      }
    };

    this.onMessage(handleMove);
    this.postMessage(`position fen ${fen}`);
    this.postMessage(`go movetime ${thinkTime}`);
  }

  stop() {
    this.postMessage('stop');
  }

  terminate() {
    this.isReady = false;
    this.stockfishLoaded = false;
    this.postMessage('quit');
    this.worker.terminate();
  }

  quit() {
    this.terminate();
  }
}