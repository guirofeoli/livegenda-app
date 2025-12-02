# Diretrizes de Design - Livegenda

## Abordagem de Design

**Sistema Selecionado**: Shadcn/ui (já implementado)
**Justificativa**: Aplicação de produtividade focada em gestão de agendamentos, clientes e funcionários. Requer interface limpa, consistente e eficiente para uso diário.

**Princípios Fundamentais**:
- Clareza sobre criatividade - informação sempre visível e acessível
- Eficiência no workflow - minimizar cliques e navegação
- Hierarquia visual forte para diferenciar ações primárias/secundárias
- Densidade de informação balanceada - não muito esparso, não muito congestionado

## Tipografia

**Família**: 
- Interface: Inter ou System UI (-apple-system, BlinkMacSystemFont)
- Dados/Números: Tabular numerals para alinhamento

**Escala**:
- Títulos de página: text-2xl (24px) - font-semibold
- Títulos de seção: text-lg (18px) - font-medium
- Corpo/Labels: text-sm (14px) - font-normal
- Dados secundários: text-xs (12px) - font-normal
- Botões: text-sm - font-medium

## Sistema de Espaçamento

**Unidades Tailwind**: 2, 4, 6, 8, 12, 16
- Padding interno de cards: p-6
- Gap entre elementos: gap-4
- Margens entre seções: mb-8
- Espaçamento de formulários: space-y-4

## Layout Structure

**Container Principal**:
- Sidebar fixa à esquerda (256px) com navegação principal
- Área de conteúdo com max-w-7xl, padding horizontal px-8
- Header fixo com altura h-16, contendo: título da página, ações rápidas, avatar do usuário

**Grid System**:
- Dashboards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 para cards de métricas
- Listagens: Tabelas full-width com scroll horizontal em mobile
- Formulários: grid-cols-1 md:grid-cols-2 para campos relacionados

## Componentes Core

**Navigation (Sidebar)**:
- Items com icon + label, altura h-10
- Indicador de página ativa com subtle background
- Agrupamento por categoria (com separadores)
- Footer com configurações e perfil

**Cards**:
- Border radius: rounded-lg
- Padding: p-6
- Shadow: subtle, sem elevação excessiva
- Header: título + ação opcional (alinhados justify-between)

**Tables**:
- Header sticky com background
- Rows com hover state
- Paginação no footer
- Ações inline (editar, deletar) alinhadas à direita
- Checkbox para seleção múltipla quando necessário

**Forms**:
- Labels acima dos campos (não placeholder como label)
- Altura de inputs: h-10
- Botão primário sempre no canto inferior direito
- Botão secundário (cancelar) à esquerda do primário
- Validação inline com mensagens de erro abaixo do campo

**Modals/Dialogs**:
- Max-width: max-w-md para confirmações, max-w-2xl para formulários
- Header com título + botão fechar
- Footer com ações alinhadas à direita
- Overlay com backdrop-blur

**Botões**:
- Primário: para ação principal (criar, salvar)
- Secondary: para ações alternativas (cancelar)
- Destructive: para ações de remoção
- Ghost: para ações terciárias em tabelas
- Icon buttons: apenas ícone, tamanho 40x40px

**Status Badges**:
- rounded-full px-3 py-1 text-xs
- Estados: Confirmado, Pendente, Cancelado, Concluído
- Posicionamento inline com dados

**Date Pickers**:
- Calendário dropdown com react-day-picker
- Range selection para filtros de relatórios
- Quick presets (Hoje, Esta semana, Este mês)

## Páginas Específicas

**Dashboard**:
- Grid de 4 cards de métricas no topo (receita, agendamentos, clientes, taxa ocupação)
- Gráfico de linha para tendência de agendamentos
- Lista de próximos agendamentos (5 items)
- Ações rápidas em cards destacados

**Agendamentos (Calendar View)**:
- Visualização em grid semanal
- Time slots no eixo Y, dias da semana no eixo X
- Cards de agendamento com: hora, cliente, serviço, funcionário
- Filtros no topo: funcionário, serviço, status
- Botão flutuante para novo agendamento

**Listagens (Clientes, Funcionários, Serviços)**:
- Search bar no topo à esquerda
- Filtros adicionais em dropdown
- Botão de ação primária (Adicionar) no topo à direita
- Tabela com: checkbox, dados principais, ações
- Paginação no footer

**Formulários (Novo Agendamento, Editar Cliente)**:
- Formulário em card centralizado
- Campos organizados logicamente em seções
- Auto-complete para seleção de cliente/funcionário
- Date picker + time picker separados para agendamento
- Cálculo automático de duração/preço visível

**Relatórios**:
- Filtros em sidebar colapsável à esquerda
- Cards de resumo no topo
- Gráficos responsivos (bar, line, pie) usando recharts
- Tabela de detalhes expandível
- Botão de exportar (PDF/Excel) no header

## Responsividade

**Breakpoints**:
- Mobile (base): Sidebar se torna drawer, tabelas com scroll horizontal
- Tablet (md): 768px - Layout em 2 colunas onde apropriado
- Desktop (lg): 1024px - Layout completo com sidebar fixa

**Mobile Específico**:
- Bottom navigation bar para ações principais
- FAB (Floating Action Button) para ação primária
- Swipe gestures em cards de agendamento
- Stack de formulários em single column

## Imagens

**Não utilizar imagens decorativas** - aplicação focada em produtividade e dados. Avatares de usuários/clientes usam iniciais em círculos quando foto não disponível.

**Ícones**: Lucide React, tamanho padrão 20px (w-5 h-5), 16px para contextos compactos.

## Interações

**Animações**: Mínimas e propositais
- Transitions suaves em hover: duration-150
- Modal/Dialog: fade + scale de entrada
- Toast notifications: slide from top
- Loading states: skeleton screens, não spinners genéricos

**Feedback**:
- Toast para confirmações de ação (salvo, deletado)
- Inline validation em tempo real
- Loading states em botões (disabled + spinner)
- Empty states com ilustração SVG + CTA