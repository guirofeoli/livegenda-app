import React from "react";
import { Crown } from "lucide-react";

export default function TopProfissionalCard({ nome, receita, foto }) {
  const initials = nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 md:p-6 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-purple-100">Profissional Destaque</p>
        <div className="bg-white/20 rounded-full p-2">
          <Crown className="w-4 h-4 text-yellow-300" />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {foto ? (
          <img src={foto} alt={nome} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
        )}
        <div>
          <p className="font-semibold text-base">{nome}</p>
          <p className="text-xs text-purple-100">Top do Período</p>
        </div>
      </div>

      <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
        <p className="text-xs text-purple-100 mb-1">Receita Gerada</p>
        <p className="text-2xl font-bold">{receita}</p>
      </div>
    </div>
  );
}