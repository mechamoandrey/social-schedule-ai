import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return; // sem envs ainda
    sb.auth.getSession().then(({ data }) => {
      if (data.session) r.replace('/dashboard');
    });
  }, [r]);

  async function onSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const sb = supabaseBrowser();
    if (!sb) { 
      setLoading(false); 
      setError('Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local'); 
      return; 
    }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else r.replace('/dashboard');
  }

  async function onSignUp() {
    setLoading(true);
    setError('');
    const sb = supabaseBrowser();
    if (!sb) { 
      setLoading(false); 
      setError('Defina as variáveis do Supabase em .env.local'); 
      return; 
    }
    const { error } = await sb.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else alert('Verifique seu e-mail para confirmar a conta.');
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSignIn} className="w-full max-w-sm space-y-4 bg-white/5 border rounded-xl p-6">
        <h1 className="text-xl font-semibold">Entrar</h1>
        <input 
          className="w-full border rounded px-3 py-2" 
          placeholder="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          className="w-full border rounded px-3 py-2" 
          type="password" 
          placeholder="senha" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading} className="w-full border rounded px-3 py-2">
          {loading ? '...' : 'Entrar'}
        </button>
        <button type="button" onClick={onSignUp} className="w-full border rounded px-3 py-2">
          Criar conta
        </button>
      </form>
    </main>
  );
}
