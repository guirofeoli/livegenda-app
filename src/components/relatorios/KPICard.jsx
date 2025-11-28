import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function KPICard({ title, value, sparklineData, type = "clients", trend, trendValue }) {
  const miniBarData = [
    { value: 450 },
    { value: 680 },
    { value: 520 },
    { value: 780 },
    { value: 900 },
  ];

  return (
    <div className="bg-white rounded-xl border border-purple-100 p-4 md:p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl md:text-4xl font-bold text-gray-900">{value}</p>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-xs font-semibold">{trendValue}</span>
          </div>
        )}
      </div>

      {type !== "revenue" && (
        <div className="h-16">
          {sparklineData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={miniBarData}>
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}