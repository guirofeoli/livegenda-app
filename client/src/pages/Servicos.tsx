import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Scissors } from "lucide-react";

export default function Servicos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos</p>
        </div>
        <Button data-testid="button-novo-servico">
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Lista de Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Nenhum serviço cadastrado ainda
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
