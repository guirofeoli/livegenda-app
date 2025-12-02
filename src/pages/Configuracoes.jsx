import { useState, useEffect } from "react";
import { livegenda } from "@/api/livegendaClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Link2, Building2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

import InformacoesNegocio from "../components/configuracoes/InformacoesNegocio";
import PagamentoPlano from "../components/configuracoes/PagamentoPlano";
import LinkAgendamento from "../components/configuracoes/LinkAgendamento";

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false, testId }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-purple-100 overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader 
            className="cursor-pointer hover:bg-purple-50/50 transition-colors border-b border-purple-50"
            data-testid={testId}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-xl text-gray-900 flex items-center gap-2">
                <Icon className="w-5 h-5 text-purple-600" />
                {title}
              </CardTitle>
              <ChevronDown 
                className={cn(
                  "w-5 h-5 text-gray-500 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-0">
            {children}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [empresaData, setEmpresaData] = useState(null);

  useEffect(() => {
    try {
      const empresaStr = localStorage.getItem('livegenda_empresa');
      if (empresaStr) {
        setEmpresaData(JSON.parse(empresaStr));
      }
    } catch (e) {
      console.error('Erro ao ler empresa:', e);
    }
  }, []);

  const { data: configuracao, isLoading } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: () => livegenda.entities.ConfiguracaoNegocio.get(),
    initialData: null,
  });

  const createMutation = useMutation({
    mutationFn: (data) => livegenda.entities.ConfiguracaoNegocio.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
      toast({
        title: "Configurações salvas!",
        description: "As informações do seu negócio foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => livegenda.entities.ConfiguracaoNegocio.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
      toast({
        title: "Configurações salvas!",
        description: "As informações do seu negócio foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
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
          Gerencie as informações do seu negócio e plano de assinatura. Clique nas seções para expandir.
        </p>
      </motion.div>

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <CollapsibleSection 
            title="Link de Agendamento" 
            icon={Link2}
            testId="section-link-agendamento"
          >
            <LinkAgendamento 
              empresaSlug={empresaData?.slug}
              empresaNome={empresaData?.nome}
              empresaId={empresaData?.id}
              onSlugUpdate={(novoSlug) => {
                setEmpresaData(prev => ({ ...prev, slug: novoSlug }));
              }}
              isCollapsible={true}
            />
          </CollapsibleSection>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CollapsibleSection 
            title="Informações do Negócio" 
            icon={Building2}
            testId="section-informacoes-negocio"
          >
            <InformacoesNegocio 
              configuracao={configuracao}
              empresaId={empresaData?.id}
              onSave={handleSave}
              onLogoUpdated={(updated) => {
                setEmpresaData(prev => {
                  const newData = { ...prev, logo: updated.logo };
                  localStorage.setItem('livegenda_empresa', JSON.stringify(newData));
                  window.dispatchEvent(new CustomEvent('empresaUpdated'));
                  return newData;
                });
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
              isCollapsible={true}
            />
          </CollapsibleSection>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <CollapsibleSection 
            title="Plano e Pagamento" 
            icon={CreditCard}
            testId="section-pagamento-plano"
          >
            <PagamentoPlano 
              configuracao={configuracao}
              onSave={handleSave}
              isCollapsible={true}
            />
          </CollapsibleSection>
        </motion.div>
      </div>
    </div>
  );
}
