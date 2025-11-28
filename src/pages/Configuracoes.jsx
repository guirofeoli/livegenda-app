import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import InformacoesNegocio from "../components/configuracoes/InformacoesNegocio";
import PagamentoPlano from "../components/configuracoes/PagamentoPlano";

export default function Configuracoes() {
  const queryClient = useQueryClient();

  const { data: configuracao, isLoading } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: () => base44.entities.ConfiguracaoNegocio.get(),
    initialData: null,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ConfiguracaoNegocio.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
    },
    onError: () => {
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ConfiguracaoNegocio.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
    },
    onError: () => {
    },
  });

  const handleSave = (data) => {
    if (configuracao) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 md:mb-6"
      >
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Configurações
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Gerencie as informações do seu negócio e plano de assinatura.
        </p>
      </motion.div>

      <div className="space-y-4 md:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <InformacoesNegocio 
            configuracao={configuracao} 
            onSave={handleSave}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PagamentoPlano 
            configuracao={configuracao}
            onSave={handleSave}
          />
        </motion.div>
      </div>
    </div>
  );
}