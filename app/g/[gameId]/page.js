import OnlineGame from './OnlineGame';

export const metadata = {
  title: 'Online game',
  description: 'You’ve been challenged to a game of MemeChess.',
};

export default async function GamePage({ params }) {
  const { gameId } = await params;
  return <OnlineGame gameId={gameId} />;
}
