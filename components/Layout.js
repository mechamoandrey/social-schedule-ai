import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className='min-h-screen grid grid-rows-[auto_1fr] bg-background'>
      <header className='border-b bg-white sticky top-0 z-10'>
        <div className='container mx-auto px-4 h-14 flex items-center gap-4'>
          <Link href='/dashboard' className='font-semibold'>
            Social Scheduler
          </Link>
          <nav className='text-sm flex gap-3'>
            <Link href='/agencies'>Agências</Link>
            <Link href='/clients'>Clientes</Link>
            <Link href='/projects'>Projetos</Link>
            <Link href='/help/cronogramas'>Ajuda</Link>
          </nav>
        </div>
      </header>
      <main className='container mx-auto px-6 py-8 bg-background'>
        {children}
      </main>
    </div>
  );
}
