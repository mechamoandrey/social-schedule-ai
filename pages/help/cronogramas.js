import Link from 'next/link';
import Layout from '@/components/Layout';

const example = {
  month: '2025-10',
  client: 'GESSO VGP',
  posts: [
    {
      date: '2025-10-01',
      title: 'Bem-vindo, Outubro Rosa: prevenção em foco',
      arte: 'Estático: laço rosa + chamada de conscientização',
      legenda:
        'Outubro Rosa relembra a importância da prevenção e do diagnóstico precoce. Conte com a gente para construir ambientes mais saudáveis.',
      cta: 'Visite nosso site para saber mais',
      status: 'A criar',
    },
  ],
  suggested_holidays: [
    { date: '2025-10-12', name: 'Dia das Crianças / Nossa Senhora Aparecida' },
  ],
};

export default function HelpCronogramas() {
  return (
    <Layout>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-2xl font-bold mb-2'>
          Guia: Gerar cronogramas com IA
        </h1>
        <p className='text-neutral-700 mb-6'>
          Passo a passo para social media criar cronogramas no padrão da
          plataforma, com exemplos.
        </p>

        <section className='mb-8'>
          <h2 className='text-xl font-semibold mb-2'>Como funciona</h2>
          <ol className='list-decimal ml-6 space-y-1 text-neutral-800'>
            <li>
              No projeto, clique <strong>Gerar cronograma com IA</strong>.
            </li>
            <li>
              Preencha <strong>Mês</strong>, <strong>cliente</strong> e, se
              quiser, <strong>produtos</strong> e{' '}
              <strong>plano de temas</strong>.
            </li>
            <li>
              Clique <strong>Gerar cronograma</strong> e revise o{' '}
              <strong>Preview visual</strong>.
            </li>
            <li>
              Use <strong>Suggested Holidays</strong> para aprovar datas
              (opcional) ou <strong>Adicionar post dessa data</strong> para
              criar um post pontual sem refazer tudo.
            </li>
            <li>
              Finalize com <strong>Inserir posts no projeto</strong> ou insira{' '}
              <strong>post a post</strong>.
            </li>
          </ol>
        </section>

        <section className='mb-8'>
          <h2 className='text-xl font-semibold mb-2'>Padrão do conteúdo</h2>
          <ul className='list-disc ml-6 space-y-1 text-neutral-800'>
            <li>
              <strong>Arte</strong>: começar com <em>Carrossel:</em> ou{' '}
              <em>Estático:</em> (≤ 200 chars).
            </li>
            <li>
              <strong>Legenda</strong>: até 500 chars; variar ângulos/ganchos.
            </li>
            <li>
              <strong>CTA</strong>: opcional, até 150 chars; evitar repetição
              consecutiva.
            </li>
            <li>
              <strong>Dica</strong>: na Arte, incluir variação de "Temos este
              material".
            </li>
            <li>
              <strong>Institucional</strong>: usar o site do cliente quando
              houver.
            </li>
          </ul>
        </section>

        <section className='mb-8'>
          <h2 className='text-xl font-semibold mb-2'>Exemplo visual</h2>
          <div className='grid md:grid-cols-2 gap-3'>
            {example.posts.map((p, i) => (
              <article key={i} className='border rounded-lg bg-white p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <h4 className='font-semibold text-sm line-clamp-2'>
                    {p.title}
                  </h4>
                  <span className='text-xs px-2 py-0.5 rounded bg-neutral-100 whitespace-nowrap'>
                    {p.date}
                  </span>
                </div>
                <div className='mt-2 text-xs text-neutral-600'>
                  <strong>Arte:</strong> {p.arte}
                </div>
                <p className='mt-2 text-sm whitespace-pre-wrap'>{p.legenda}</p>
                {p.cta ? (
                  <div className='mt-2 text-xs'>
                    <strong>CTA:</strong> {p.cta}
                  </div>
                ) : null}
                <div className='mt-2 text-[11px] text-neutral-500'>
                  Status: {p.status}
                </div>
              </article>
            ))}
          </div>
          <p className='text-xs text-neutral-500 mt-2'>
            Exemplo do mês {example.month} para o cliente {example.client}.
            Feriados sugeridos: {example.suggested_holidays[0].date} —{' '}
            {example.suggested_holidays[0].name}.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-xl font-semibold mb-2'>Dicas rápidas</h2>
          <ul className='list-disc ml-6 space-y-1 text-neutral-800'>
            <li>Alterne tipos (Produto/Dica/Institucional/Campanha).</li>
            <li>Distribua as datas ao longo do mês; evite aglomerar.</li>
            <li>
              Prefira CTAs variados: "Solicite orçamento", "Visite o site",
              "Fale com nossa equipe"…
            </li>
          </ul>
        </section>

        <div className='text-sm'>
          Precisa de ajuda técnica? Veja o{' '}
          <Link href='/debug' className='underline'>
            Debug
          </Link>{' '}
          ou fale com o time.
        </div>
      </div>
    </Layout>
  );
}
