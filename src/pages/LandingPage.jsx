import { Link } from "react-router-dom";
import { CheckCircle, MessageCircle, Calendar, Bell, Users, Lock, RefreshCw, Settings, LayoutDashboard, Filter, BarChart3, MessageSquare, Menu, X } from "lucide-react";
import { useState } from "react";

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-1 gap-4 rounded-xl border border-border bg-card p-6 flex-col">
      <Icon className="h-8 w-8 text-purple-500" />
      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-lg font-bold leading-tight">{title}</h3>
        <p className="text-muted-foreground text-sm font-normal leading-normal">{description}</p>
      </div>
    </div>
  );
}

function ExecutiveFeature({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        <Icon className="h-7 w-7 text-purple-500" />
      </div>
      <div>
        <h3 className="font-bold text-foreground text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

function TeamFeature({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-4 rounded-xl p-4">
      <div className="flex-shrink-0 rounded-full bg-purple-500/10 p-2">
        <Icon className="h-5 w-5 text-purple-500" />
      </div>
      <div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PricingCard({ name, description, price, features, popular = false }) {
  return (
    <div className={`p-8 rounded-2xl border-2 ${popular ? 'bg-white border-purple-500 transform scale-105 shadow-2xl' : 'bg-background border-border'}`}>
      {popular && (
        <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
          MAIS POPULAR
        </div>
      )}
      <h3 className={`text-2xl font-bold mb-2 ${popular ? 'text-gray-900' : ''}`}>{name}</h3>
      <p className={`mb-6 ${popular ? 'text-gray-600' : 'text-muted-foreground'}`}>{description}</p>
      <div className="mb-6">
        <span className={`text-4xl font-extrabold ${popular ? 'text-gray-900' : ''}`}>R$ {price}</span>
        <span className={popular ? 'text-gray-600' : 'text-muted-foreground'}>/mês</span>
      </div>
      <ul className={`space-y-3 mb-8 ${popular ? 'text-gray-900' : ''}`}>
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-purple-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/login"
        className={`block w-full py-3 text-center rounded-lg font-bold transition-all ${
          popular
            ? 'bg-purple-500 text-white hover:bg-purple-600'
            : 'bg-muted text-foreground hover:bg-purple-500 hover:text-white'
        }`}
        data-testid="button-pricing-cta"
      >
        Começar Grátis
      </Link>
    </div>
  );
}

function Testimonial({ name, role, image, quote }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-6 border border-border">
      <div className="flex items-center gap-4">
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12"
          style={{ backgroundImage: `url("${image}")` }}
        />
        <div>
          <p className="text-foreground text-base font-medium leading-normal">{name}</p>
          <p className="text-muted-foreground text-sm font-normal leading-normal">{role}</p>
        </div>
      </div>
      <p className="text-foreground text-base font-normal leading-normal">"{quote}"</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto flex items-center p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-7 w-7 text-purple-500" />
            <h2 className="text-foreground text-xl font-bold leading-tight tracking-[-0.015em]">Livegenda</h2>
          </div>
          
          {/* Desktop Menu */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
            <a className="text-muted-foreground hover:text-foreground text-sm font-bold" href="#recursos">Recursos</a>
            <a className="text-muted-foreground hover:text-foreground text-sm font-bold" href="#executivos">Executivos</a>
            <a className="text-muted-foreground hover:text-foreground text-sm font-bold" href="#equipes">Equipes</a>
            <a className="text-muted-foreground hover:text-foreground text-sm font-bold" href="#planos">Planos</a>
            <a className="text-muted-foreground hover:text-foreground text-sm font-bold" href="#depoimentos">Depoimentos</a>
            <Link className="text-muted-foreground hover:text-foreground text-sm font-bold" to="/buscar">Buscar</Link>
          </nav>
          
          <div className="flex items-center justify-end gap-4 ml-auto">
            <button
              className="md:hidden text-foreground p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link className="text-purple-500 text-sm font-bold" to="/login" data-testid="link-login">Login</Link>
            <Link
              to="/login"
              className="hidden sm:flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-purple-500 text-white text-sm font-bold"
              data-testid="button-register"
            >
              <span className="truncate">Experimente Grátis</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="container mx-auto flex flex-col p-4 gap-4">
            <a className="text-foreground hover:text-purple-500 text-base font-bold py-2" href="#recursos" onClick={() => setMobileMenuOpen(false)}>Recursos</a>
            <a className="text-foreground hover:text-purple-500 text-base font-bold py-2" href="#executivos" onClick={() => setMobileMenuOpen(false)}>Executivos</a>
            <a className="text-foreground hover:text-purple-500 text-base font-bold py-2" href="#equipes" onClick={() => setMobileMenuOpen(false)}>Equipes</a>
            <a className="text-foreground hover:text-purple-500 text-base font-bold py-2" href="#planos" onClick={() => setMobileMenuOpen(false)}>Planos</a>
            <a className="text-foreground hover:text-purple-500 text-base font-bold py-2" href="#depoimentos" onClick={() => setMobileMenuOpen(false)}>Depoimentos</a>
            <Link className="text-foreground hover:text-purple-500 text-base font-bold py-2" to="/buscar" onClick={() => setMobileMenuOpen(false)}>Buscar Serviços</Link>
            <div className="border-t border-border pt-4 mt-2">
              <Link
                to="/login"
                className="block w-full py-3 text-center bg-purple-500 text-white rounded-lg font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Experimente Grátis
              </Link>
            </div>
          </nav>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section className="container mx-auto py-16 md:py-24">
          <div className="flex flex-col gap-10 px-4 lg:flex-row lg:items-center">
            <div className="flex flex-col gap-6 text-center lg:text-left lg:flex-1 lg:gap-8">
              <div className="flex flex-col gap-4">
                <h1 className="text-foreground text-4xl font-black leading-tight tracking-[-0.033em] md:text-5xl">
                  Livegenda: Agendamento Inteligente via WhatsApp Business
                </h1>
                <h2 className="text-muted-foreground text-base font-normal leading-normal md:text-lg">
                  Integre com o Google Calendar, envie lembretes automáticos e gerencie sua equipe com facilidade.
                </h2>
              </div>
              <Link
                to="/login"
                className="flex self-center lg:self-start min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-purple-500 text-white text-base font-bold"
                data-testid="button-hero-cta"
              >
                <span className="truncate">Experimente Grátis</span>
              </Link>
            </div>
            <div className="w-full lg:flex-1">
              <div
                className="w-full bg-center bg-no-repeat aspect-square sm:aspect-video bg-cover rounded-xl"
                style={{
                  backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCk3SlRixbqJKrzIHfkYaaO9FZaLRLzbJIqQaqo9LDzD-v7pPYOHx2a88-qeikExPgryM209Ok5SFSVHtX1rdDj36TrYYOFrtXm7OIlJBLCCbKSkjaL9jmeYNurxYhCox_D_tWTcYazd930CPB9kafHiBhClz1m_9585qENLPmT6uSdB2Q4xxYy5xhxZOlf9RIlfvJYVyE8G3D9zMTu4rS_ANGHv8dXVqZ-XaSgr1jqpDhtdsBIRxkRtq1DmnkUqiTRRrVK1RyOPRZ-")'
                }}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="recursos" className="container mx-auto flex flex-col gap-10 px-4 py-16">
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-foreground tracking-tight text-3xl font-bold leading-tight md:text-4xl max-w-3xl mx-auto">
              Tudo que você precisa para otimizar seus agendamentos
            </h2>
            <p className="text-muted-foreground text-base font-normal leading-normal max-w-2xl mx-auto">
              Descubra como nossas funcionalidades podem transformar a gestão do seu negócio.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={MessageCircle}
              title="Agendamento por WhatsApp"
              description="Permita que seus clientes agendem horários diretamente pelo WhatsApp, de forma simples e rápida."
            />
            <FeatureCard
              icon={Calendar}
              title="Sincronização com Google Calendar"
              description="Mantenha sua agenda sempre atualizada com a sincronização automática e em tempo real."
            />
            <FeatureCard
              icon={Bell}
              title="Lembretes Personalizados"
              description="Reduza o não comparecimento com lembretes automáticos e personalizados para seus clientes."
            />
            <FeatureCard
              icon={Users}
              title="Controle de Equipe"
              description="Gerencie a escala de funcionários, canais de atendimento e horários disponíveis com facilidade."
            />
          </div>
        </section>

        {/* Executive Section */}
        <section className="bg-card py-16 md:py-24" id="executivos">
          <div className="container mx-auto px-4 flex flex-col gap-10">
            <div className="flex flex-col gap-4 text-center max-w-3xl mx-auto">
              <h2 className="text-foreground text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl">
                Livegenda para Executivos: Simplificando Sua Agenda
              </h2>
              <p className="text-muted-foreground text-base md:text-lg">
                Sabemos que seu tempo é precioso. O Livegenda oferece ferramentas de alta performance para executivos que precisam de agilidade, discrição e controle total sobre seus compromissos.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ExecutiveFeature
                icon={Lock}
                title="Agendamento Flexível e Discreto via WhatsApp"
                description="Coordene reuniões importantes através de uma interface familiar e segura, sem ruídos."
              />
              <ExecutiveFeature
                icon={RefreshCw}
                title="Sincronização Avançada com Google Calendar"
                description="Integração perfeita com suas agendas pessoais e profissionais, evitando conflitos e duplicidade."
              />
              <ExecutiveFeature
                icon={Settings}
                title="Gerenciamento Delegado para Secretárias"
                description="Permita que sua equipe gerencie sua agenda com permissões de acesso personalizadas e seguras."
              />
              <ExecutiveFeature
                icon={LayoutDashboard}
                title="Visão Consolidada de Compromissos"
                description="Tenha uma visão clara de todos os seus compromissos em um único dashboard inteligente."
              />
              <ExecutiveFeature
                icon={Bell}
                title="Alertas Personalizados para Prioridades"
                description="Configure notificações inteligentes para não perder prazos e reuniões estratégicas."
              />
            </div>
            <div className="mt-8 text-center">
              <a
                className="inline-flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-purple-500 text-white text-base font-bold"
                href="#planos"
              >
                <span className="truncate">Descubra o Plano Executivo</span>
              </a>
            </div>
          </div>
        </section>

        {/* Teams Section */}
        <section id="equipes" className="container mx-auto py-16 md:py-24 px-4">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4 text-center max-w-3xl mx-auto">
              <h2 className="text-foreground text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl">
                Gestão de Equipes Otimizada: Controle de Escala e Agendamento
              </h2>
              <p className="text-muted-foreground text-base md:text-lg">
                Coordene sua equipe com ferramentas poderosas que simplificam a distribuição de tarefas e maximizam a produtividade.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <TeamFeature
                icon={Calendar}
                title="Visão Centralizada da Disponibilidade"
                description="Acesse a agenda de toda a equipe em um só lugar, facilitando o planejamento."
              />
              <TeamFeature
                icon={Users}
                title="Atribuição Inteligente de Agendamentos"
                description="O sistema distribui novos agendamentos com base na disponibilidade e carga de trabalho."
              />
              <TeamFeature
                icon={Filter}
                title="Filtros Avançados"
                description="Filtre por funcionário, serviço ou data para encontrar informações rapidamente."
              />
              <TeamFeature
                icon={BarChart3}
                title="Relatórios de Produtividade"
                description="Acompanhe o desempenho da equipe com relatórios detalhados e insights valiosos."
              />
              <TeamFeature
                icon={MessageSquare}
                title="Comunicação Simplificada"
                description="Mantenha todos na mesma página com canais de comunicação integrados."
              />
            </div>
            <div className="mt-6 text-center">
              <a
                className="inline-flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-purple-500 text-white text-base font-bold"
                href="#planos"
              >
                <span className="truncate">Conheça o Plano Enterprise</span>
              </a>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planos" className="py-16 px-4 bg-card">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Escolha seu Plano</h2>
              <p className="text-xl text-muted-foreground">Planos flexíveis para todos os tamanhos de negócio</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <PricingCard
                name="Simples"
                description="Para profissionais autônomos"
                price="29"
                features={[
                  "Até 100 agendamentos/mês",
                  "Lembretes automáticos",
                  "Integração WhatsApp",
                  "Google Calendar"
                ]}
              />
              <PricingCard
                name="Intermediário"
                description="Para pequenas equipes"
                price="79"
                popular={true}
                features={[
                  "Agendamentos ilimitados",
                  "Até 3 usuários",
                  "Relatórios avançados",
                  "Suporte prioritário",
                  "Personalização avançada"
                ]}
              />
              <PricingCard
                name="Enterprise"
                description="Para grandes empresas"
                price="199"
                features={[
                  "Usuários ilimitados",
                  "Gestão de equipes",
                  "API dedicada",
                  "Suporte 24/7",
                  "Treinamento personalizado"
                ]}
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="depoimentos" className="container mx-auto flex flex-col gap-10 px-4 py-16">
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-foreground text-3xl font-bold leading-tight tracking-[-0.015em]">O que nossos clientes dizem</h2>
            <p className="text-muted-foreground text-base font-normal leading-normal max-w-2xl mx-auto">
              Veja como o Livegenda está ajudando negócios como o seu a crescer.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Testimonial
              name="Ana Silva"
              role="Dona de Salão de Beleza"
              image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
              quote="Desde que começamos a usar o Livegenda, nossos no-shows diminuíram em 70%. Os lembretes automáticos são fantásticos!"
            />
            <Testimonial
              name="Carlos Mendes"
              role="Barbeiro"
              image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
              quote="A integração com WhatsApp mudou meu negócio. Meus clientes adoram a facilidade de agendar pelo app que já usam."
            />
            <Testimonial
              name="Mariana Costa"
              role="Clínica de Estética"
              image="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
              quote="Gerenciar a agenda de 5 profissionais era um pesadelo. Com o Livegenda, tudo ficou organizado e automatizado."
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-purple-500 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">
              Pronto para transformar seu negócio?
            </h2>
            <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de profissionais que já otimizaram seus agendamentos com o Livegenda.
            </p>
            <Link
              to="/login"
              className="inline-flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-8 bg-white text-purple-500 text-base font-bold"
              data-testid="button-final-cta"
            >
              Comece Agora - É Grátis
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-purple-500" />
                <span className="text-foreground text-lg font-bold">Livegenda</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Agendamento inteligente para empresas que valorizam o tempo de seus clientes.
              </p>
            </div>
            <div>
              <h4 className="text-foreground font-bold mb-4">Produto</h4>
              <ul className="space-y-2">
                <li><a href="#recursos" className="text-muted-foreground hover:text-foreground text-sm">Recursos</a></li>
                <li><a href="#planos" className="text-muted-foreground hover:text-foreground text-sm">Planos</a></li>
                <li><Link to="/buscar" className="text-muted-foreground hover:text-foreground text-sm">Buscar Serviços</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-bold mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground text-sm">Sobre</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground text-sm">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground text-sm">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground text-sm">Privacidade</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground text-sm">Termos de Uso</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Livegenda. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
