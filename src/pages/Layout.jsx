
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Users,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  User as UserIcon,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Wrench,
  LayoutDashboard,
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
    icon: Calendar,
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

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [empresa, setEmpresa] = useState(null);

  // Carregar usuário e empresa da sessão
  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
    
    // Se for funcionário, buscar nome do funcionário
    if (user.tipo === 'funcionario' && user.funcionario_id) {
      const funcionarios = JSON.parse(localStorage.getItem('funcionarios') || '[]');
      const funcionario = funcionarios.find(f => f.id === user.funcionario_id);
      if (funcionario) {
        user.nome = funcionario.nome_completo?.split(' ')[0]; // Primeiro nome
      }
    } else if (user.tipo === 'gestor') {
      // Para gestor, usar email antes do @
      user.nome = user.email?.split('@')[0] || 'Gestor';
    }
    
    setCurrentUser(user);
    
    // Carregar empresa do usuário
    if (user.empresa_id) {
      const empresas = JSON.parse(localStorage.getItem('empresas') || '[]');
      const empresaEncontrada = empresas.find(e => e.id === user.empresa_id);
      setEmpresa(empresaEncontrada);
      
      // Se for gestor e não encontrou a empresa, redirecionar para onboarding
      if (user.tipo === 'gestor' && !empresaEncontrada && location.pathname !== '/onboarding') {
        navigate('/onboarding');
      }
    } else if (user.tipo === 'gestor' && location.pathname !== '/onboarding') {
      // Gestor sem empresa_id, redirecionar para onboarding
      navigate('/onboarding');
    }
  }, [location.pathname, navigate]);

  // Filtrar itens do menu baseado no tipo de usuário
  const getMenuItems = () => {
    if (!currentUser || !currentUser.tipo) return navigationItems;
    
    if (currentUser.tipo === 'funcionario') {
      // Funcionário vê: Dashboard, Agendamentos, Novo Agendamento, Clientes
      return navigationItems.filter(item => 
        ['Dashboard', 'Agendamentos', 'Novo Agendamento', 'Clientes'].includes(item.title)
      );
    }
    
    // Gestor vê tudo exceto Dashboard
    return navigationItems.filter(item => !item.funcionarioOnly);
  };

  const menuItems = getMenuItems();
  const showConfiguracoes = currentUser?.tipo === 'gestor';

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      window.location.href = '/';
    } catch (error) {
      window.location.href = '/';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-purple-50/30 via-white to-purple-50/20">

        {/* SIDEBAR COM LARGURA DINÂMICA */}
        <div 
          className="border-r border-purple-100/50 transition-all duration-300 flex-shrink-0"
            style={{
            '--sidebar-width': isCollapsed ? '4rem' : '15rem',
            '--sidebar-width-icon': isCollapsed ? '3rem' : '4rem',
          }}
        >
          <Sidebar className="h-full">
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
                  <span className="text-white font-bold text-xl">{empresa?.nome?.charAt(0) || 'L'}</span>
                </div>
                <div className={`${isCollapsed ? "md:hidden" : ""}`}>
                  <h2 className="font-bold text-gray-900 text-lg truncate">{empresa?.nome || 'Livegenda'}</h2>
                  <p className="text-xs text-purple-600 truncate">{currentUser?.tipo === 'funcionario' ? 'Funcionário' : 'Gestor'}</p>
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
                              // Fechar sidebar mobile ao clicar
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
              <SidebarMenu>
                {showConfiguracoes && (
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
                      className={`flex items-center py-3 ${
                        isCollapsed ? "md:justify-center md:px-1" : "gap-3 px-4"
                      }`}
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
                )}
              </SidebarMenu>

              {/* BOTÃO DE EXPANDIR / COLAPSAR – DESKTOP */}
              <div className="hidden md:block mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={`w-full hover:bg-purple-50 rounded-lg transition-all ${
                    isCollapsed ? "justify-center px-1" : "justify-start px-4"
                  }`}
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

        {/* CONTEÚDO PRINCIPAL — EXPANDE DINAMICAMENTE */}
        <main className="flex-1 flex flex-col transition-all duration-300">
          <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100/50 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-purple-50 p-2 rounded-lg transition-colors duration-200 md:hidden">
                  <Menu className="w-5 h-5 text-gray-600" />
                </SidebarTrigger>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-purple-50"
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
                  {currentUser?.tipo === 'funcionario' ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("MeuPerfil")}>Meu Perfil</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("TrocarSenha")}>Trocar Senha</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                        Sair
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("MeuPerfil")}>Meu Perfil</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Configuracoes")}>Configurações da Empresa</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("TrocarSenha")}>Trocar Senha</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                        Sair
                      </DropdownMenuItem>
                    </>
                  )}
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
