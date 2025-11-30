import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Scissors, LayoutDashboard, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const menuItems = [
  { path: "/agendamentos", label: "Agendamentos", icon: Calendar },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/servicos", label: "Serviços", icon: Scissors },
  { path: "/funcionarios", label: "Funcionários", icon: Users },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("livegenda_user");
    localStorage.removeItem("livegenda_empresa");
    window.location.href = "/login";
  };

  const empresa = JSON.parse(localStorage.getItem("livegenda_empresa") || "{}");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-primary">Livegenda</h1>
            <p className="text-sm text-muted-foreground truncate">{empresa.nome || "Meu Negócio"}</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                    data-testid={`nav-${item.path.slice(1)}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 border-b bg-card flex items-center px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="ml-3 font-semibold">Livegenda</h1>
        </header>
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
