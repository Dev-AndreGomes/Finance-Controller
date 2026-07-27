import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { Sidebar } from '@/components/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex bg-bg text-ink">
      <Sidebar userName={user.name} userEmail={user.email} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
