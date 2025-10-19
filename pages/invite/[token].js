import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function InvitePage() {
  const router = useRouter();
  const { token } = router.query;
  const [info, setInfo] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!token) return;

      try {
        const sb = supabaseBrowser();
        const { data: u } = await sb.auth.getUser();
        setAuthUser(u?.user || null);

        const { data, error } = await sb.rpc('get_invitation_info', {
          p_token: token,
        });
        if (error) throw error;

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
          setError('Convite não encontrado ou expirado.');
          return;
        }

        setInfo(row);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function accept() {
    try {
      const sb = supabaseBrowser();
      const { data: user } = await sb.auth.getUser();
      if (!user?.user) {
        alert('Faça login para aceitar o convite.');
        return;
      }

      const { error } = await sb.rpc('accept_invitation', { p_token: token });
      if (error) throw error;

      alert('Convite aceito! Você agora é membro da agência.');
      router.push('/dashboard');
    } catch (e) {
      alert(e.message);
    }
  }

  async function sendMagic() {
    try {
      setSending(true);
      const sb = supabaseBrowser();
      const redirectTo =
        typeof window !== 'undefined' ? window.location.href : undefined;
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div>Carregando convite...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <h1 className='text-xl font-semibold mb-2'>Convite Inválido</h1>
        <p className='text-red-600'>{error}</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className='text-xl font-semibold mb-2'>Convite</h1>

      {info && (
        <div className='border rounded p-3 bg-white'>
          <h2 className='font-semibold mb-2'>
            Convite para {info.agency_name}
          </h2>
          <div className='text-sm text-neutral-600 mb-2'>
            Você foi convidado para participar da agência{' '}
            <strong>{info.agency_name}</strong> como{' '}
            <strong>{info.role}</strong>.
          </div>
          <div className='text-xs text-neutral-500 mb-3'>
            Convite enviado em: {new Date(info.created_at).toLocaleDateString()}
            <br />
            Expira em: {new Date(info.expires_at).toLocaleDateString()}
          </div>

          <div className='mt-3 space-y-3'>
            {authUser ? (
              <button
                className='border rounded px-3 py-2 text-sm hover:bg-neutral-50'
                onClick={accept}
              >
                Aceitar convite
              </button>
            ) : (
              <div className='border rounded p-3 bg-neutral-50'>
                <div className='text-sm font-medium mb-1'>
                  Entre para aceitar o convite
                </div>
                {!sent ? (
                  <div className='flex items-center gap-2'>
                    <input
                      type='email'
                      className='border rounded px-3 py-2 text-sm w-64'
                      placeholder='seuemail@exemplo.com'
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    <button
                      disabled={sending || !email}
                      onClick={sendMagic}
                      className='border rounded px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50'
                    >
                      {sending ? 'Enviando...' : 'Enviar link por e-mail'}
                    </button>
                  </div>
                ) : (
                  <div className='text-sm text-neutral-600'>
                    Enviamos um link de login para <strong>{email}</strong>.
                    Abra o e-mail e volte para esta página.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
