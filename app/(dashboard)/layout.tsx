'use client';

import Link from 'next/link';
import { use, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { Footer } from '@/components/footer';
import { siteConfig, mainNav } from '@/lib/config/site';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Button asChild variant="ghost" className="hidden sm:inline-flex rounded-full">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button
          asChild
          className="rounded-full bg-brand hover:bg-brand-600 text-brand-foreground"
        >
          <Link href="/generate">Generate Report</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="grid size-8 place-items-center rounded-lg brand-gradient text-white shadow-sm transition-transform group-hover:scale-105">
            <Sparkles className="size-4" />
          </span>
          <span className="text-lg font-bold tracking-tight text-gray-900">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Suspense fallback={<div className="h-9 w-20" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </section>
  );
}
