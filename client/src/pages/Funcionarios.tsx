import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export default function Funcionarios() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie sua equipe</p>
        </div>
        <Button data-testid="button-novo-funcionario">
          <Plus className="mr-2 h-4 w-4" />
          Novo Funcionário
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Funcionários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Nenhum funcionário cadastrado ainda
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
