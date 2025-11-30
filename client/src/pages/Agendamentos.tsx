import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";

export default function Agendamentos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie seus agendamentos</p>
        </div>
        <Button data-testid="button-novo-agendamento">
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            Calendário de agendamentos em desenvolvimento
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
