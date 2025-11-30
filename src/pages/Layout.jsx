import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { livegenda } from "@/api/livegendaClient";
import {
  Users,
  Calendar,
  CalendarPlus,
  BarChart3,
  Settings,
  Menu,
  User as UserIcon,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Wrench,
  LayoutDashboard,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    funcionarioOnly: true,
  },
  {
    title: "Agendamentos",
    url: createPageUrl("Agendamentos"),
    icon: Calendar,
  },
  {
    title: "Novo Agendamento",
    url: createPageUrl("NovoAgendamento"),
    icon: CalendarPlus,
  },
  {
    title: "Clientes",
    url: createPageUrl("Clientes"),
    icon: UserCircle,
  },
  {
    title: "Funcionários",
    url: createPageUrl("Funcionarios"),
    icon: Users,
  },
  {
    title: "Serviços",
    url: createPageUrl("Servicos"),
    icon: Wrench,
  },
  {
    title: "Relatórios",
    url: createPageUrl("Relatorios"),
    icon: BarChart3,
  },
];

const categoriasEmpresa = {
  'salao_beleza': 'Salão de Beleza',
  'barbearia': 'Barbearia',
  'clinica_estetica': 'Clínica de Estética',
  'spa': 'SPA',
  'studio_unhas': 'Studio de Unhas',
  'sobrancelhas': 'Design de Sobrancelhas',
  'makeup': 'Maquiagem',
  'massagem': 'Massagem',
  'outro': 'Estabelecimento'
};

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [empresa, setEmpresa] = useState(null);

  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
    
    if (user.tipo === 'funcionario' && user.funcionario_id) {
      const funcionarios = JSON.parse(localStorage.getItem('funcionarios') || '[]');
      const funcionario = funcionarios.find(f => f.id === user.funcionario_id);
      if (funcionario) {
        user.nome = funcionario.nome_completo?.split(' ')[0];
      }
    } else if (user.tipo === 'gestor' || !user.tipo) {
      user.nome = user.email?.split('@')[0] || 'Gestor';
      // Garantir que tipo seja 'gestor' se não for funcionario
      if (!user.tipo) {
        user.tipo = 'gestor';
      }
    }
    
    setCurrentUser(user);
    
    if (user.empresa_id) {
      const empresas = JSON.parse(localStorage.getItem('empresas') || '[]');
      const empresaEncontrada = empresas.find(e => e.id === user.empresa_id);
      setEmpresa(empresaEncontrada);
      
      if ((user.tipo === 'gestor' || !user.tipo) && !empresaEncontrada && location.pathname !== '/onboarding') {
        navigate('/onboarding');
      }
    } else if ((user.tipo === 'gestor' || !user.tipo) && location.pathname !== '/onboarding') {
      navigate('/onboarding');
    }
  }, [location.pathname, navigate]);

  const getMenuItems = () => {
    if (!currentUser || !currentUser.tipo) return navigationItems.filter(item => !item.funcionarioOnly);
    
    if (currentUser.tipo === 'funcionario') {
      return navigationItems.filter(item => 
        ['Dashboard', 'Agendamentos', 'Novo Agendamento', 'Clientes'].includes(item.title)
      );
    }
    
    return navigationItems.filter(item => !item.funcionarioOnly);
  };

  const menuItems = getMenuItems();
  
  // Mostrar Configurações se NÃO for funcionário (gestor ou sem tipo definido)
  const showConfiguracoes = currentUser?.tipo !== 'funcionario';

  const getCategoriaLabel = () => {
    if (!empresa?.categoria) return 'Estabelecimento';
    return categoriasEmpresa[empresa.categoria] || empresa.categoria;
  };

  const handleLogout = async () => {
    try {
      await livegenda.auth.logout();
      window.location.href = '/';
    } catch (error) {
      window.location.href = '/';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-purple-50/30 via-white to-purple-50/20">

        <div 
          className="border-r border-purple-100/50 transition-all duration-300 flex-shrink-0"
            style={{
            '--sidebar-width': isCollapsed ? '4rem' : '15rem',
            '--sidebar-width-icon': isCollapsed ? '3rem' : '4rem',
          }}
        >
          <Sidebar
            collapsible="icon"
            data-collapsed={isCollapsed}
            className="transition-all duration-300"
          >
            <SidebarHeader
              className={`border-b border-purple-100/50 transition-all duration-300 ${
                isCollapsed ? "md:p-2" : "p-6"
              }`}
            >
              <div
                className={`flex items-center ${
                  isCollapsed ? "md:justify-center" : "gap-3"
                }`}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <span className="text-white font-bold text-xl">L</span>
                </div>
                <div className={`${isCollapsed ? "md:hidden" : ""}`}>
                  <h2 className="font-bold text-gray-900 text-lg">Livegenda</h2>
                  <p className="text-xs text-purple-600">Agendamento Inteligente</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-3">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 rounded-xl mb-1 ${
                            location.pathname === item.url
                              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:text-white"
                              : ""
                          } ${isCollapsed ? "md:justify-center md:px-1" : ""}`}
                        >
                          <Link
                            to={item.url}
                            onClick={() => {
                              if (window.innerWidth < 768) {
                                const sidebarTrigger = document.querySelector('[data-sidebar="trigger"]');
                                if (sidebarTrigger) sidebarTrigger.click();
                              }
                            }}
                            className={`flex items-center py-3 ${
                              isCollapsed
                                ? "md:justify-center md:px-1"
                                : "gap-3 px-4"
                            }`}
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span
                              className={`font-medium ${
                                isCollapsed ? "md:hidden" : ""
                              }`}
                            >
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-purple-100/50 p-3">
              {showConfiguracoes && (
                <SidebarMenu className="mb-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={`hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 rounded-xl ${
                        location.pathname === createPageUrl("Configuracoes")
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:text-white"
                          : ""
                      } ${isCollapsed ? "md:justify-center md:px-1" : ""}`}
                    >
                      <Link
                        to={createPageUrl("Configuracoes")}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            const sidebarTrigger = document.querySelector('[data-sidebar="trigger"]');
                            if (sidebarTrigger) sidebarTrigger.click();
                          }
                        }}
                        className={`flex items-center py-3 ${
                          isCollapsed ? "md:justify-center md:px-1" : "gap-3 px-4"
                        }`}
                        data-testid="link-configuracoes-sidebar"
                      >
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        <span
                          className={`font-medium ${
                            isCollapsed ? "md:hidden" : ""
                          }`}
                        >
                          Configurações
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              )}

              <div className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={`w-full hover:bg-purple-50 rounded-lg transition-all ${
                    isCollapsed ? "justify-center px-1" : "justify-start px-4"
                  }`}
                  data-testid="button-collapse-sidebar"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  ) : (
                    <>
                      <ChevronLeft className="w-4 h-4 text-gray-600 mr-2" />
                      <span className="text-sm text-gray-600">Recolher</span>
                    </>
                  )}
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
        </div>

        <main className="flex-1 flex flex-col transition-all duration-300">
          <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100/50 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-purple-50 p-2 rounded-lg transition-colors duration-200 md:hidden">
                  <Menu className="w-5 h-5 text-gray-600" />
                </SidebarTrigger>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="font-bold text-gray-900 text-lg leading-tight" data-testid="text-empresa-nome">
                      {empresa?.nome || 'Meu Estabelecimento'}
                    </h1>
                    <p className="text-xs text-purple-600" data-testid="text-empresa-categoria">
                      {getCategoriaLabel()}
                    </p>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-purple-50"
                    data-testid="button-user-menu"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium text-gray-900">
                        {currentUser?.nome || currentUser?.email?.split('@')[0] || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentUser?.tipo === 'funcionario' ? 'Funcionário' : 'Gestor'}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("MeuPerfil")} data-testid="link-meu-perfil">Meu Perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("TrocarSenha")} data-testid="link-trocar-senha">Trocar Senha</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer" data-testid="button-logout">
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}

