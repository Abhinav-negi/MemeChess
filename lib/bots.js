// Strength comes from Stockfish's "Skill Level" (0-20) plus a search-depth cap.
// thinkMs is the minimum time before the bot moves, so stronger bots "think" longer.
export const BOTS = [
  { id: 'chill-guy', name: 'Chill Guy', elo: 300, img: '/bots/bot1.webp', description: 'IDGF', stars: 1, skill: 0, depth: 1, thinkMs: 500 },
  { id: 'penguin', name: 'Penguin', elo: 800, img: '/bots/bot2.webp', description: 'He is back from Mountains', stars: 2, skill: 3, depth: 2, thinkMs: 1000 },
  { id: 'puppy', name: 'Puppy', elo: 1300, img: '/bots/bot3.webp', description: 'YKIYK', stars: 3, skill: 8, depth: 6, thinkMs: 2000 },
  { id: 'gothamchess', name: 'GothamChess', elo: 1800, img: '/bots/bot4.webp', description: 'Guy from YouTube', stars: 4, skill: 15, depth: 10, thinkMs: 3000 },
  { id: 'mikhail-tal', name: 'Mikhail Tal', elo: 2700, img: '/bots/bot5.webp', description: 'The Magician of Riga', stars: 5, skill: 20, depth: 16, thinkMs: 5000 },
];

export const BOT_TIP =
  'Tip: Magician will take you into a deep dark forest where 2+2=5, and the path leading out is only wide enough for him. So good luck!';

export const getBot = (id) => BOTS.find((b) => b.id === id) ?? BOTS[0];
