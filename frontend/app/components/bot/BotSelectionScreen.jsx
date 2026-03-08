"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const BOTS = [
  {
    id: "beginner",
    name: "Chill Guy",
    elo: 300,
    emoji: "😎",
    img: "/assets/bot/bot1.png",
    color: "from-green-500 to-emerald-600",
    description: "IDGF",
    thinkTime: 500,
  },
  {
    id: "easy",
    name: "Penguin",
    elo: 800,
    emoji: "🐧",
    img: "/assets/bot/bot2.png",
    color: "from-blue-500 to-cyan-600",
    description: "He is back from Mountains",
    thinkTime: 1000,
  },
  {
    id: "medium",
    name: "Puppy",
    elo: 1300,
    emoji: "🐶",
    img: "/assets/bot/bot3.png",
    color: "from-yellow-500 to-orange-600",
    description: "YKIYK",
    thinkTime: 2000,
  },
  {
    id: "hard",
    name: "GothamChess",
    elo: 1800,
    emoji: "♟️",
    img: "/assets/bot/bot4.png",
    color: "from-purple-500 to-pink-600",
    description: "Guy from You Tube",
    thinkTime: 3000,
  },
  {
    id: "master",
    name: "Mikhail Tal",
    elo: 2700,
    emoji: "👑",
    img: "/assets/bot/bot5.jpg",
    color: "from-red-500 to-rose-600",
    description: "The Magician of Riga",
    thinkTime: 5000,
  },
];

export default function BotSelectionScreen({ onBack }) {
  const router = useRouter();
  const [selectedBot, setSelectedBot] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const handleSelectBot = (bot) => {
    setSelectedBot(bot);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    // Navigate with color parameter
    router.push(`/bot/${selectedBot.id}?color=${color}`);
  };

  if (selectedBot && !selectedColor) {
    return (
      <div className="w-full max-w-md px-4">
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-700">
          <button
            onClick={() => setSelectedBot(null)}
            className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-2"
          >
            <span>←</span> Back
          </button>

          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{selectedBot.emoji}</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {selectedBot.name}
            </h2>
            <p className="text-gray-400">Choose your color</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleColorSelect('white')}
              className="flex-1 bg-gradient-to-br from-gray-100 to-gray-300 p-8 rounded-2xl hover:scale-105 transition-all shadow-lg"
            >
              <div className="text-6xl mb-2">⚪</div>
              <div className="text-gray-800 font-bold">Play as White</div>
            </button>

            <button
              onClick={() => handleColorSelect('black')}
              className="flex-1 bg-gradient-to-br from-gray-700 to-gray-900 p-8 rounded-2xl hover:scale-105 transition-all shadow-lg"
            >
              <div className="text-6xl mb-2">⚫</div>
              <div className="text-white font-bold">Play as Black</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl px-4">
      <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-700">
        {/* Back button */}
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">
            Choose Your Opponent
          </h2>
          <p className="text-gray-400">
            Select a bot difficulty to play against
          </p>
        </div>

        {/* Bot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BOTS.map((bot) => (
            <button
              key={bot.id}
              onClick={() => handleSelectBot(bot)}
              className={`group relative bg-gradient-to-br ${bot.color} p-6 rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl`}
            >
              {/* Bot Character */}
              <img
                src={bot.img}
                alt={bot.name}
                className="w-25 h-25 object-cover rounded-full mb-3 mx-auto transform group-hover:scale-110 transition-transform"
              />

              {/* Bot Name */}
              <h3 className="text-xl font-bold text-white mb-1">{bot.name}</h3>

              {/* Elo Rating */}
              <div className="text-white/90 text-sm font-semibold mb-2">
                {bot.elo} ELO
              </div>

              {/* Description */}
              <p className="text-white/70 text-xs mb-3">{bot.description}</p>

              {/* Difficulty Badge */}
              <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold">
                {bot.id === "beginner" && "★☆☆☆☆"}
                {bot.id === "easy" && "★★☆☆☆"}
                {bot.id === "medium" && "★★★☆☆"}
                {bot.id === "hard" && "★★★★☆"}
                {bot.id === "master" && "★★★★★"}
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Info footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>💡 Tip: Magician will take you into a deep dark forest where 2+2=5, and the path leading out is only wide enough for him. So Good luck !</p>
        </div>
      </div>
    </div>
  );
}
