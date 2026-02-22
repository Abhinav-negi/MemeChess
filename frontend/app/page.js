'use client';
import Chessgame from "./components/chessboard";
import GameContainer from "./components/GameContainer";
import TestSocket from "./lib/test";

export default function Home() {
  return (
    <div className="flex min-h-screen  items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* <Chessgame/> */}
      {/* <Chessgame/> */}
      <GameContainer/>
      <TestSocket/>
    </div>
  );
}
