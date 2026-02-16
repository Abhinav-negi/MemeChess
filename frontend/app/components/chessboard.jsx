import React, { useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessGame() {
  // const chessGameRef = useRef(new Chess());
  // const chessGame = chessGameRef.current;
const [chessGame, setChessGame] = useState(() => {
  const savedFen = localStorage.getItem("chess-game");
  return new Chess(savedFen || undefined);
});


const [chessPosition, setChessPosition] = useState(() => chessGame.fen());

  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});

  /* -------------------------------------------------------
     GAME EVENT HANDLER (capture, promotion, check, etc.)
  ------------------------------------------------------- */
  function handleGameEvents(move) {
    if (move.captured) {
      console.log("Captured piece:", move.captured);
      // capture animation here
    }

    if (move.flags.includes("p")) {
      console.log("Pawn promoted!");
      // promotion animation here
    }

    if (chessGame.inCheck()) {
      console.log("Check!");
    }

    if (chessGame.isCheckmate()) {
      console.log("Checkmate!");
    }

    if (chessGame.isDraw()) {
      console.log("Draw!");
    }
  }


  /* -------------------------------------------------------
     MOVE HIGHLIGHTING
  ------------------------------------------------------- */
  function getMoveOptions(square) {
    const moves = chessGame.moves({ square, verbose: true });

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares = {};

    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          chessGame.get(move.to) &&
          chessGame.get(move.to)?.color !== chessGame.get(square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.25) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.25) 35%, transparent 35%)",
        borderRadius: "50%",
      };
    });

    newSquares[square] = {
      background: "rgba(255,255,0,0.4)",
    };

    setOptionSquares(newSquares);
    return true;
  }

function highlightCheckOrMate() {
  if (!chessGame.inCheck()) {
    setOptionSquares({});
    return;
  }

  const board = chessGame.board();
  let checkedKingSquare = "";
  let winningKingSquare = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      if (square && square.type === "k") {
        const file = "abcdefgh"[colIndex];
        const rank = 8 - rowIndex;
        const squareName = file + rank;

        // King who is in check (current turn)
        if (square.color === chessGame.turn()) {
          checkedKingSquare = squareName;
        } 
        // Opponent king (possible winner)
        else {
          winningKingSquare = squareName;
        }
      }
    });
  });

  // If checkmate
  if (chessGame.isCheckmate()) {
    setOptionSquares({
      [checkedKingSquare]: {
        background: "rgba(255, 0, 0, 0.7)", // losing king
      },
      [winningKingSquare]: {
        background: "rgba(0, 200, 0, 0.7)", // winning king
      },
    });
  } 
  // Just normal check
  else {
    setOptionSquares({
      [checkedKingSquare]: {
        background: "rgba(255, 0, 0, 0.7)",
      },
    });
  }
}



  /* -------------------------------------------------------
     CLICK-TO-MOVE HANDLING
  ------------------------------------------------------- */
  function onSquareClick({ square, piece }) {
    if (!moveFrom && piece) {
      const hasMoves = getMoveOptions(square);
      if (hasMoves) setMoveFrom(square);
      return;
    }

    const moves = chessGame.moves({ square: moveFrom, verbose: true });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);

    if (!foundMove) {
      const hasMoves = getMoveOptions(square);
      setMoveFrom(hasMoves ? square : "");
      return;
    }

    try {
      const move = chessGame.move({
        from: moveFrom,
        to: square,
        promotion: "q",
      });

      if (move) handleGameEvents(move);

      setChessPosition(chessGame.fen());
      localStorage.setItem("chess-game", chessGame.fen());

      // setTimeout(makeRandomMove, 300);
      highlightCheckOrMate();
    } catch (err) {
      const hasMoves = getMoveOptions(square);
      setMoveFrom(hasMoves ? square : "");
      return;
    }

    setMoveFrom("");
    setOptionSquares({});
  }

  /* -------------------------------------------------------
     DRAG-AND-DROP HANDLING
  ------------------------------------------------------- */
  function onPieceDrop({ sourceSquare, targetSquare }) {
    if (!targetSquare) return false;

    try {
      const move = chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) return false;

      handleGameEvents(move);
      setChessPosition(chessGame.fen());
      localStorage.setItem("chess-game", chessGame.fen());


      setMoveFrom("");
      setOptionSquares({});

      // setTimeout(makeRandomMove, 500);
      highlightCheckOrMate();

      return true;
    } catch {
      return false;
    }
  }

  /* -------------------------------------------------------
     CHESSBOARD CONFIG
  ------------------------------------------------------- */
  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    position: chessPosition,
    squareStyles: optionSquares,
    id: "click-or-drag-to-move",
  };

  return (<div className="w-120">

      <Chessboard options={chessboardOptions} />
            <div className="mt-4 text-lg">
        {chessGame.isCheckmate() && "Checkmate!"}
        {chessGame.isDraw() && "Draw!"}
        {!chessGame.isGameOver() &&
          (chessGame.turn() === "w" ? "White to move" : "Black to move")}
          {chessGame.isGameOver() && (
  <button
    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
    onClick={() => {
      const newGame = new Chess();
      setChessGame(newGame);
      setChessPosition(newGame.fen());
      setOptionSquares({});
      localStorage.removeItem("chess-game");
      // highlightCheck();
    }}
  >
    New Game
  </button>
)}

      </div>
  </div> )
}
