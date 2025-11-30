import React from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Power, User, Phone, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function MobileCard({ funcionario, onEdit, onDelete, onToggleStatus }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3 mb-4">
        {funcionario.foto_url ? (
          <img
            src={funcionario.foto_url}
            alt={funcionario.nome}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-100"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center ring-2 ring-purple-100">
            <User className="w-7 h-7 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg truncate">
            {funcionario.nome}
          </h3>
          {funcionario.email && (
            <p className="text-sm text-gray-500 truncate">{funcionario.email}</p>
          )}
          <div className="flex gap-2 mt-2">
            <Badge
              className={
                funcionario.status === "Ativo"
                  ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200"
              }
            >
              {funcionario.status}
            </Badge>
            <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
              {funcionario.cargo}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-purple-500" />
          <span>{funcionario.telefone}</span>
        </div>
        {funcionario.data_vinculacao && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span>Vinculado em {format(new Date(funcionario.data_vinculacao), "dd/MM/yyyy")}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t border-purple-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(funcionario)}
          className="flex-1 border-purple-200 hover:bg-purple-50 hover:text-purple-700"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleStatus(funcionario)}
          className={
            funcionario.status === "Ativo"
              ? "border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              : "border-green-200 hover:bg-green-50 hover:text-green-700"
          }
        >
          <Power className="w-4 h-4 mr-2" />
          {funcionario.status === "Ativo" ? "Desativar" : "Ativar"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(funcionario)}
          className="border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-purple-100 p-4">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-16" />
      </div>
    </div>
  );
}

export default function FuncionariosTable({
  funcionarios,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  if (isLoading) {
    return (
      <>
        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <MobileCardSkeleton key={i} />
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-purple-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-50/50">
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Vinculação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </>
    );
  }

  if (funcionarios.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100/50 p-8 md:p-12 text-center">
        <p className="text-gray-500">Nenhum funcionário encontrado com os filtros aplicados.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-4">
        {funcionarios.map((funcionario, index) => (
          <MobileCard
            key={funcionario.id}
            funcionario={funcionario}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </div>

      {/* Desktop View - Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="hidden md:block bg-white rounded-2xl shadow-sm border border-purple-100/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
                <TableHead className="font-semibold text-purple-900">Funcionário</TableHead>
                <TableHead className="font-semibold text-purple-900">Telefone</TableHead>
                <TableHead className="font-semibold text-purple-900">Cargo</TableHead>
                <TableHead className="font-semibold text-purple-900">Status</TableHead>
                <TableHead className="font-semibold text-purple-900">Data Vinculação</TableHead>
                <TableHead className="text-right font-semibold text-purple-900">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funcionarios.map((funcionario, index) => (
                <motion.tr
                  key={funcionario.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-purple-50/30 transition-colors border-b border-purple-50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {funcionario.foto_url ? (
                        <img
                          src={funcionario.foto_url}
                          alt={funcionario.nome}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center ring-2 ring-purple-100">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{funcionario.nome}</p>
                        {funcionario.email && (
                          <p className="text-xs text-gray-500">{funcionario.email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700">{funcionario.telefone}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                      {funcionario.cargo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        funcionario.status === "Ativo"
                          ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200"
                      }
                    >
                      {funcionario.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {funcionario.data_vinculacao
                      ? format(new Date(funcionario.data_vinculacao), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(funcionario)}
                              className="hover:bg-purple-50 hover:text-purple-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onToggleStatus(funcionario)}
                              className={
                                funcionario.status === "Ativo"
                                  ? "hover:bg-orange-50 hover:text-orange-700"
                                  : "hover:bg-green-50 hover:text-green-700"
                              }
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {funcionario.status === "Ativo" ? "Desativar" : "Ativar"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(funcionario)}
                              className="hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </>
  );
}