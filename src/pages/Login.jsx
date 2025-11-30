import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const API_BASE = '';

export default function Login() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Tentar login para verificar se usuário existe
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: 'check_exists' })
      });
      
      const data = await response.json();
      
      if (response.status === 401) {
        // Usuário existe, pedir senha
        setUsuario({ email, exists: true });
        setStep('password');
      } else if (response.status === 404) {
        // Novo usuário - cadastrar senha
        setUsuario({ email, exists: false });
        setStep('cadastro_senha');
      } else if (response.ok) {
        // Login bem sucedido (improvável com senha fake)
        localStorage.setItem('livegenda_user', JSON.stringify(data.usuario));
        localStorage.setItem('livegenda_empresa', JSON.stringify(data.empresa));
        navigate('/');
      }
    } catch (err) {
      // Se API falhar, assumir novo usuário
      setUsuario({ email, exists: false });
      setStep('cadastro_senha');
    }
    
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Senha incorreta');
        setLoading(false);
        return;
      }

      // Salvar dados da sessão
      localStorage.setItem('livegenda_user', JSON.stringify(data.usuario));
      localStorage.setItem('livegenda_empresa', JSON.stringify(data.empresa));
      
      navigate('/');
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    }
    
    setLoading(false);
  };

  const handleCadastroSenha = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      // Registrar usuário (sem empresa ainda - vai criar no onboarding)
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          senha: password,
          nome: email.split('@')[0]
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Erro ao cadastrar');
        setLoading(false);
        return;
      }

      // Salvar usuário logado
      localStorage.setItem('livegenda_user', JSON.stringify(data.usuario));
      
      // Novo usuário vai para onboarding
      navigate('/\onboarding');
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
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
            {step === 'email' && 'Entre com seu email para começar'}
            {step === 'password' && 'Digite sua senha'}
            {step === 'cadastro_senha' && 'Crie sua senha de acesso'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuar'}
              </Button>
            </form>
          )}
          
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                Email: {email}
              </div>
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => setStep('email')}
              >
                Voltar
              </Button>
            </form>
          )}
          
          {step === 'cadastro_senha' && (
            <form onSubmit={handleCadastroSenha} className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                Email: {email}
              </div>
              <Input
                type="password"
                placeholder="Crie sua senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <Input
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar conta'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => setStep('email')}
              >
                Voltar
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
