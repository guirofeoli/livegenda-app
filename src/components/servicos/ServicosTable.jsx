import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Trash2 } from "lucide-react";

const MobileServicoCard = ({ servico, onEdit, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl border border-purple-100 p-4 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{servico.nome}</h3>
        </div>
      </div>

      {servico.descricao && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{servico.descricao}</p>
      )}

      <div className="flex items-center gap-4 mb-3 text-sm">
        <div>
          <span className="text-gray-500">Duração:</span>
          <span className="ml-1 font-medium text-gray-900">{servico.duracao_minutos} min</span>
        </div>
        <div>
          <span className="text-gray-500">Preço:</span>
          <span className="ml-1 font-medium text-gray-900">R$ {servico.preco?.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(servico)}
          className="flex-1 border-blue-200 hover:bg-blue-50 text-blue-600"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(servico)}
          className="border-red-200 hover:bg-red-50 text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

const MobileServicoCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-purple-100 p-4">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3 mb-3" />
    <div className="flex gap-2">
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 w-9" />
      <Skeleton className="h-9 w-9" />
    </div>
  </div>
);

export default function ServicosTable({
  servicos,
  onEdit,
  onDelete,
  isLoading
}) {
  if (isLoading) {
    return (
      <>
        <div className="md:hidden space-y-3">
          {[1, 2, 3].map((i) => (
            <MobileServicoCardSkeleton key={i} />
          ))}
        </div>
        <div className="hidden md:block bg-white rounded-xl border border-purple-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-purple-50 hover:bg-purple-50">
                <TableHead>Serviço</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  if (servicos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-purple-100 p-12 text-center">
        <p className="text-gray-500">Nenhum serviço encontrado</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {servicos.map((servico) => (
          <MobileServicoCard
            key={servico.id}
            servico={servico}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden md:block bg-white rounded-xl border border-purple-100 overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-purple-50 hover:bg-purple-50">
              <TableHead className="font-semibold text-gray-700">Serviço</TableHead>
              <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
              <TableHead className="font-semibold text-gray-700">Duração</TableHead>
              <TableHead className="font-semibold text-gray-700">Preço</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicos.map((servico, index) => (
              <motion.tr
                key={servico.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors"
              >
                <TableCell className="font-medium text-gray-900">
                  {servico.nome}
                </TableCell>
                <TableCell className="text-gray-600 max-w-xs truncate">
                  {servico.descricao || "-"}
                </TableCell>
                <TableCell className="text-gray-900">
                  {servico.duracao_minutos} min
                </TableCell>
                <TableCell className="text-gray-900 font-medium">
                  R$ {servico.preco?.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(servico)}
                            className="hover:bg-blue-100 text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(servico)}
                            className="hover:bg-red-100 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </>
  );
}