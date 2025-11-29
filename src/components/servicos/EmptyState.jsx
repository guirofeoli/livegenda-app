import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Scissors, Plus } from "lucide-react";

export default function EmptyState({ onAddNew }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl border-2 border-dashed border-purple-200 p-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30"
      >
        <Scissors className="w-10 h-10 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Nenhum serviço cadastrado ainda
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Comece cadastrando os serviços que seu estabelecimento oferece para gerenciar melhor seus agendamentos.
        </p>

        <Button
          onClick={onAddNew}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
          data-testid="button-add-servico-empty"
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Primeiro Serviço
        </Button>
      </motion.div>
    </motion.div>
  );
}
