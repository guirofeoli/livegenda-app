


export function createPageUrl(pageName: string) {
    // Mapeamento especial para rotas que não seguem o padrão
    const routeMap: Record<string, string> = {
        'NovoAgendamento': '/novo-agendamento',
        'Agendamentos': '/agendamentos',
        'Clientes': '/clientes',
        'Funcionarios': '/funcionarios',
        'Servicos': '/servicos',
        'Relatorios': '/relatorios',
        'Configuracoes': '/configuracoes',
        'Dashboard': '/dashboard',
        'MeuPerfil': '/meu-perfil',
        'TrocarSenha': '/trocar-senha'
    };
    
    return routeMap[pageName] || '/' + pageName.toLowerCase().replace(/ /g, '-');
}