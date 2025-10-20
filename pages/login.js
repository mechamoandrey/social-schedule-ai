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
      setError(
        'Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local'
      );
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

  const errorId = 'login-error';

  return (
    <div className='min-h-screen flex'>
      {/* Left Side - Branding */}
      <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-light p-12 text-primary-foreground flex-col  relative overflow-hidden'>
        <div className='relative z-10'>
          <div className='h-10 w-auto font-semibold text-2xl tracking-tight'>
            NewCo®
          </div>
        </div>

        <div className='relative z-10'>
          <h1 className='text-4xl font-bold mb-4'>
            Transforme sua gestão de social media
          </h1>
          <p className='text-lg opacity-90 max-w-xl'>
            Crie conteúdo com IA, gerencie aprovações e colabore com sua equipe
            em um só lugar.
          </p>
        </div>

        {/* blobs decorativos (substitui a hero illustration do Lovable) */}
        <div className='absolute inset-0 -z-0 opacity-20 [mask-image:radial-gradient(60%_60%_at_70%_60%,black,transparent)]'>
          <div className='absolute -right-24 -bottom-24 w-[36rem] h-[36rem] rounded-full bg-primary-foreground/30 blur-3xl' />
          <div className='absolute -left-24 -top-24 w-[28rem] h-[28rem] rounded-full bg-primary-foreground/20 blur-3xl' />
        </div>

        <img
          src='/hero-illustration.png'
          alt=''
          class='absolute inset-0 w-full h-full object-cover opacity-20'
        ></img>
      </div>

      {/* Right Side - Login Form */}
      <div className='flex-1 flex items-center justify-center p-8 bg-background'>
        <div className='w-full max-w-md elevation-md border-0 rounded-[var(--radius)] bg-card'>
          <div className='space-y-1 p-6 pb-0'>
            <h2 className='text-2xl font-bold text-card-foreground'>Entrar</h2>
            <p className='text-sm text-muted-foreground'>
              Digite seu email e senha para acessar sua conta
            </p>
          </div>

          <div className='space-y-4 p-6'>
            <form onSubmit={onSignIn} className='space-y-4'>
              <div className='space-y-2'>
                <label
                  htmlFor='email'
                  className='text-sm font-medium text-foreground'
                >
                  Email
                </label>
                <input
                  id='email'
                  name='email'
                  autoComplete='email'
                  inputMode='email'
                  aria-invalid={!!error}
                  aria-describedby={error ? errorId : undefined}
                  className='h-11 w-full border border-input rounded-[var(--radius)] bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  placeholder='seu@email.com'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <label
                    htmlFor='password'
                    className='text-sm font-medium text-foreground'
                  >
                    Senha
                  </label>
                  <button
                    type='button'
                    className='px-0 font-normal text-xs text-primary underline-offset-4 hover:underline'
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  id='password'
                  name='password'
                  autoComplete='current-password'
                  aria-invalid={!!error}
                  aria-describedby={error ? errorId : undefined}
                  type='password'
                  className='h-11 w-full border border-input rounded-[var(--radius)] bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  placeholder='••••••••'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p id={errorId} className='text-destructive text-sm'>
                  {error}
                </p>
              )}

              <button
                type='submit'
                disabled={loading}
                className='w-full h-11 rounded-[var(--radius)] px-3 py-2 text-sm font-semibold border border-transparent bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none'
              >
                {loading ? '...' : 'Entrar'}
              </button>
            </form>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-card px-2 text-muted-foreground'>Ou</span>
              </div>
            </div>

            <button
              onClick={onSignUp}
              type='button'
              className='w-full h-11 rounded-[var(--radius)] px-3 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background inline-flex items-center justify-center'
            >
              Criar conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
