import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function Configuracoes() {
  const empresa = JSON.parse(localStorage.getItem("livegenda_empresa") || "{}");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configure seu negócio</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dados do Negócio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm text-muted-foreground">Nome</span>
            <p className="font-medium">{empresa.nome || "-"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Categoria</span>
            <p className="font-medium">{empresa.categoria || "-"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Telefone</span>
            <p className="font-medium">{empresa.telefone || "-"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Email</span>
            <p className="font-medium">{empresa.email || "-"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
