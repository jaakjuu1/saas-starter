import Link from 'next/link';
import { ArrowRight, Github, Linkedin, Mail, Sparkles, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig, footerNav } from '@/lib/config/site';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg brand-gradient text-white shadow-sm">
                <Sparkles className="size-4" />
              </span>
              <span className="text-lg font-bold text-gray-900">
                {siteConfig.name}
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
              {siteConfig.description}
            </p>
            <div className="mt-5 flex gap-2">
              <Link href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-brand">
                  <Twitter className="size-5" />
                  <span className="sr-only">Twitter</span>
                </Button>
              </Link>
              <Link href={siteConfig.social.github} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-brand">
                  <Github className="size-5" />
                  <span className="sr-only">GitHub</span>
                </Button>
              </Link>
              <Link href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-brand">
                  <Linkedin className="size-5" />
                  <span className="sr-only">LinkedIn</span>
                </Button>
              </Link>
              <Link href={`mailto:${siteConfig.email}`}>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-brand">
                  <Mail className="size-5" />
                  <span className="sr-only">Email</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Link groups */}
          {footerNav.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 md:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Ready to grow?</span>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-brand hover:bg-brand-600 text-brand-foreground"
            >
              <Link href="/generate">
                Start Analysis
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
