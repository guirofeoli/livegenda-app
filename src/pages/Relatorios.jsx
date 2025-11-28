import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import KPICard from "../components/relatorios/KPICard";
import TopProfissionalCard from "../components/relatorios/TopProfissionalCard";

// Mock data
const receitaPorDiaData = [
  { dia: "Seg", receita: 850 },
  { dia: "Ter", receita: 1200 },
  { dia: "Qua", receita: 980 },
  { dia: "Qui", receita: 1450 },
  { dia: "Sex", receita: 1800 },
  { dia: "Sáb", receita: 2100 },
  { dia: "Dom", receita: 650 },
];

const agendamentosPorHorarioData = [
  { horario: "09:00", agendamentos: 12 },
  { horario: "10:00", agendamentos: 18 },
  { horario: "11:00", agendamentos: 15 },
  { horario: "14:00", agendamentos: 22 },
  { horario: "15:00", agendamentos: 25 },
  { horario: "16:00", agendamentos: 20 },
  { horario: "17:00", agendamentos: 16 },
];

const distribuicaoClientesData = [
  { name: "Novos Clientes", value: 35, color: "#FFB86C" },
  { name: "Clientes Recorrentes", value: 65, color: "#C7A4FF" },
];

const receitaPorFuncionarioData = [
  { nome: "Mariana Costa", receita: 3200 },
  { nome: "Julia Ferreira", receita: 2850 },
  { nome: "Amanda Rodrigues", receita: 2400 },
  { nome: "Ana Paula Silva", receita: 1950 },
  { nome: "Carlos Eduardo", receita: 1600 },
];

const top5ServicosData = [
  { servico: "Corte de Cabelo", receita: 7280, cor: "#FF6B9D" },
  { servico: "Coloração", receita: 5880, cor: "#C7A4FF" },
  { servico: "Manicure", receita: 5160, cor: "#6EC2FF" },
  { servico: "Design de Sobrancelhas", receita: 4010, cor: "#FFB86C" },
  { servico: "Escova", receita: 3230, cor: "#57C188" },
];

const receitaPorServicoPizzaData = [
  { name: "Corte de Cabelo", value: 7280, color: "#FF6B9D" },
  { name: "Coloração", value: 5880, color: "#C7A4FF" },
  { name: "Manicure", value: 5160, color: "#6EC2FF" },
  { name: "Design de Sobrancelhas", value: 4010, color: "#FFB86C" },
  { name: "Escova", value: 3230, color: "#57C188" },
];

const sparklineData = [
  { value: 30 },
  { value: 45 },
  { value: 38 },
  { value: 52 },
  { value: 48 },
];

export default function Relatorios() {
  const [periodo, setPeriodo] = useState("30dias");
  const [servicoFiltro, setServicoFiltro] = useState("todos");

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Relatórios
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Acompanhe o desempenho do seu negócio.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={servicoFiltro} onValueChange={setServicoFiltro}>
                <SelectTrigger className="w-full sm:w-64 border-purple-200 focus:border-purple-500 focus:ring-purple-500">
                  <SelectValue placeholder="Filtrar por serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os serviços</SelectItem>
                  <SelectItem value="corte">Corte de Cabelo</SelectItem>
                  <SelectItem value="coloracao">Coloração</SelectItem>
                  <SelectItem value="manicure">Manicure</SelectItem>
                  <SelectItem value="sobrancelha">Design de Sobrancelhas</SelectItem>
                  <SelectItem value="escova">Escova</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-full sm:w-64 border-purple-200 focus:border-purple-500 focus:ring-purple-500">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="mes">Mês atual</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6"
      >
        <KPICard
          title="Clientes Atendidos"
          value="48"
          sparklineData={sparklineData}
          trend="up"
          trendValue="+12%"
        />
        
        <KPICard
          title="Receita Total"
          value="R$ 9.030"
          type="revenue"
          trend="up"
          trendValue="+8%"
        />
        
        <TopProfissionalCard
          nome="Mariana Costa"
          receita="R$ 3.200"
          foto={null}
        />
      </motion.div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Agendamentos por Horário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-purple-100 p-4 md:p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Horários com Mais Agendamentos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agendamentosPorHorarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="horario" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="agendamentos" fill="#6EC2FF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Receita por Dia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-purple-100 p-4 md:p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Receita por Dia da Semana
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={receitaPorDiaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value) => `R$ ${value}`}
              />
              <Bar dataKey="receita" fill="#57C188" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top 5 Serviços - Barras Horizontais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-purple-100 p-4 md:p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 Serviços - Receita Total
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top5ServicosData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis dataKey="servico" type="category" width={140} stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value) => `R$ ${value}`}
              />
              <Bar dataKey="receita" radius={[0, 8, 8, 0]}>
                {top5ServicosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Distribuição de Receita por Serviço - Pizza */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-purple-100 p-4 md:p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuição de Receita por Serviço
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={receitaPorServicoPizzaData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {receitaPorServicoPizzaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R$ ${value}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {receitaPorServicoPizzaData.map((servico, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: servico.color }}></div>
                <span className="text-xs text-gray-600">{servico.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Distribuição de Clientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-purple-100 p-4 md:p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuição dos Clientes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribuicaoClientesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distribuicaoClientesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FFB86C]"></div>
              <span className="text-sm text-gray-600">Novos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#C7A4FF]"></div>
              <span className="text-sm text-gray-600">Recorrentes</span>
            </div>
          </div>
        </motion.div>

        {/* Receita por Funcionário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl border border-purple-100 p-4 md:p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Receita por Profissional
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={receitaPorFuncionarioData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis dataKey="nome" type="category" width={120} stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value) => `R$ ${value}`}
              />
              <Bar dataKey="receita" radius={[0, 8, 8, 0]}>
                {receitaPorFuncionarioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? "#8B5CF6" : "#D4C5F9"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Card Funcionário Destaque */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-6 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            🏆 Profissional Destaque do Período
          </h3>
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-semibold">+24% vs período anterior</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              MC
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">Mariana Costa</h4>
              <p className="text-sm text-gray-600">Profissional</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <p className="text-sm text-gray-600 mb-1">Receita Total</p>
            <p className="text-3xl font-bold text-purple-600">R$ 3.200</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <p className="text-sm text-gray-600 mb-2">Serviços Mais Realizados</p>
            <ul className="space-y-1">
              <li className="text-sm text-gray-700">• Corte de Cabelo (18x)</li>
              <li className="text-sm text-gray-700">• Manicure (15x)</li>
              <li className="text-sm text-gray-700">• Design de Sobrancelhas (12x)</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}