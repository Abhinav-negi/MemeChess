'use client';

export default function GameInfoPanel({ game, onReset }) {

  return (
    <div className="text-lg text-center">

      {game.isCheckmate() && (
        <div className="text-red-600 font-bold">
          Checkmate!
        </div>
      )}

      {game.isDraw() && (
        <div className="text-yellow-600 font-bold">
          Draw!
        </div>
      )}

      {!game.isGameOver() && (
        <div className="font-semibold">
          {game.turn() === "w" ? "White to move" : "Black to move"}
        </div>
      )}

      {game.isGameOver() && (
        <button
          onClick={onReset}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          New Game
        </button>
      )}

      {!game.isGameOver() && (
        <button
          onClick={onReset}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          New Game
        </button>
      )}

    </div>
  );
}
