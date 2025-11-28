import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  const [step, setStep] = useState('email'); // 'email', 'password', 'cadastro_senha'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar usuário por email
      const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
      const usuarioEncontrado = usuarios.find(u => u.email === email);

      if (usuarioEncontrado) {
        setUsuario(usuarioEncontrado);
        setStep('password');
      } else {
        // Verificar se é email de funcionário convidado
        const funcionarios = JSON.parse(localStorage.getItem('funcionarios') || '[]');
        const funcionario = funcionarios.find(f => f.email === email);
        
        if (funcionario) {
          // Funcionário convidado - precisa cadastrar senha
          setUsuario({
            email,
            tipo: 'funcionario',
            funcionario_id: funcionario.id,
            empresa_id: funcionario.empresa_id,
            novo: true
          });
          setStep('cadastro_senha');
        } else {
          // Novo usuário - será dono de nova empresa
          setUsuario({
            email,
            tipo: 'dono',
            funcionario_id: null,
            empresa_id: null,
            novo: true
          });
          setStep('cadastro_senha');
        }
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao verificar o email',
        variant: 'destructive'
      });
    }
    
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar senha
      if (usuario.senha !== password) {
        toast({
          title: 'Senha incorreta',
          description: 'Por favor, verifique sua senha e tente novamente',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Salvar usuário logado
      localStorage.setItem('livegenda_user', JSON.stringify({
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo,
        funcionario_id: usuario.funcionario_id,
        empresa_id: usuario.empresa_id
      }));

      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo ao Livegenda'
      });

      navigate('/agendamentos');
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao fazer login',
        variant: 'destructive'
      });
    }
    
    setLoading(false);
  };

  const handleCadastroSenha = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar senha
      if (password.length < 6) {
        toast({
          title: 'Senha muito curta',
          description: 'A senha deve ter no mínimo 6 caracteres',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: 'Senhas não conferem',
          description: 'Por favor, verifique as senhas digitadas',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Criar novo usuário
      const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
      const novoUsuario = {
        id: Date.now().toString(),
        email: usuario.email,
        senha: password,
        tipo: usuario.tipo,
        funcionario_id: usuario.funcionario_id,
        empresa_id: usuario.empresa_id,
        createdAt: new Date().toISOString()
      };
      
      usuarios.push(novoUsuario);
      localStorage.setItem('usuarios', JSON.stringify(usuarios));

      // Salvar usuário logado
      localStorage.setItem('livegenda_user', JSON.stringify({
        id: novoUsuario.id,
        email: novoUsuario.email,
        tipo: novoUsuario.tipo,
        funcionario_id: novoUsuario.funcionario_id,
        empresa_id: novoUsuario.empresa_id
      }));

      toast({
        title: 'Senha cadastrada!',
        description: 'Bem-vindo ao Livegenda'
      });

      // Se é dono (novo), redireciona para onboarding
      // Se é funcionário, vai direto para agendamentos
      if (usuario.tipo === 'dono') {
        navigate('/onboarding');
      } else {
        navigate('/agendamentos');
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao cadastrar senha',
        variant: 'destructive'
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-white">L</span>
          </div>
          <CardTitle className="text-2xl">Livegenda</CardTitle>
          <CardDescription>
            {step === 'email' && 'Faça login para acessar o sistema'}
            {step === 'password' && 'Digite sua senha'}
            {step === 'cadastro_senha' && 'Cadastre sua senha de acesso'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600" disabled={loading}>
                {loading ? 'Verificando...' : 'Continuar'}
              </Button>
              <p className="text-xs text-center text-gray-500 mt-4">
                Para teste, use qualquer email e senha com 6+ caracteres
              </p>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setStep('email');
                    setPassword('');
                  }}
                >
                  Voltar
                </Button>
                <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </div>
            </form>
          )}

          {step === 'cadastro_senha' && (
            <form onSubmit={handleCadastroSenha} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium mb-2">
                  Nova Senha
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                  Confirmar Senha
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setStep('email');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Voltar
                </Button>
                <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600" disabled={loading}>
                  {loading ? 'Cadastrando...' : 'Cadastrar Senha'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
