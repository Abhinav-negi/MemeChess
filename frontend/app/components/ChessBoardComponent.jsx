'use client';

import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessBoardComponent({ 
  game, 
  position, 
  updateGame, 
  boardOrientation = 'white',
  playerColor = 'white'  // ✅ ADD THIS
}) {

  const [boardSize, setBoardSize] = useState(600);
  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});
  const checkHighlight = getCheckOrMateHighlight(game);
  const combinedSquareStyles = {
    ...optionSquares,
    ...checkHighlight,
  };

  useEffect(() => {
    function updateSize() {
      const size = Math.min(window.innerWidth, window.innerHeight);
      setBoardSize(size - 120);
    }

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // ✅ CHECK IF PLAYER CAN MOVE PIECE
  function isPlayerPiece(square) {
    const piece = game.get(square);
    if (!piece) return false;
    
    const pieceColor = piece.color === 'w' ? 'white' : 'black';
    return pieceColor === playerColor;
  }

  function getMoveOptions(square) {
    // ✅ Only allow moves for player's pieces
    if (!isPlayerPiece(square)) {
      setOptionSquares({});
      return false;
    }

    const moves = game.moves({ square, verbose: true });

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares = {};

    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to) &&
          game.get(move.to)?.color !== game.get(square)?.color
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

  function getCheckOrMateHighlight(currentGame) {
    if (!currentGame.isCheck()) return {};

    const board = currentGame.board();
    let checkedKingSquare = "";
    let winningKingSquare = "";

    board.forEach((row, rowIndex) => {
      row.forEach((square, colIndex) => {
        if (square && square.type === "k") {
          const file = "abcdefgh"[colIndex];
          const rank = 8 - rowIndex;
          const squareName = file + rank;

          if (square.color === currentGame.turn()) {
            checkedKingSquare = squareName;
          } else {
            winningKingSquare = squareName;
          }
        }
      });
    });

    if (currentGame.isCheckmate()) {
      return {
        [checkedKingSquare]: { background: "rgba(255, 0, 0, 0.7)" },
        [winningKingSquare]: { background: "rgba(0, 200, 0, 0.7)" },
      };
    }

    return {
      [checkedKingSquare]: { background: "rgba(255, 0, 0, 0.7)" },
    };
  }

  function onSquareClick({ square, piece }) {
    if (!moveFrom && piece) {
      const hasMoves = getMoveOptions(square);
      if (hasMoves) setMoveFrom(square);
      return;
    }

    const moves = game.moves({ square: moveFrom, verbose: true });
    const foundMove = moves.find(
      (m) => m.from === moveFrom && m.to === square
    );

    if (!foundMove) {
      const hasMoves = getMoveOptions(square);
      setMoveFrom(hasMoves ? square : "");
      return;
    }

    const gameCopy = new Chess(game.fen());

    const move = gameCopy.move({
      from: moveFrom,
      to: square,
      promotion: "q",
    });

    if (!move) return;

    updateGame(gameCopy);
    getCheckOrMateHighlight(gameCopy);

    setMoveFrom("");
    setOptionSquares({});
  }

  function onPieceDrop({ sourceSquare, targetSquare }) {
    if (!targetSquare) return false;

    // ✅ Only allow dragging player's pieces
    if (!isPlayerPiece(sourceSquare)) {
      return false;
    }

    const gameCopy = new Chess(game.fen());

    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!move) return false;

    updateGame(gameCopy);
    getCheckOrMateHighlight(gameCopy);

    setMoveFrom("");
    setOptionSquares({});

    return true;
  }

  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    position: position,
    boardOrientation: boardOrientation,
    squareStyles: combinedSquareStyles,
    id: "click-or-drag-to-move",
  };

  return (
    <Chessboard options={chessboardOptions} />
  );
}