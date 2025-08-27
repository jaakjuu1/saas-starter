import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Twitter, Github, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold text-gray-900">AI Growth Reports</span>
            </div>
            <p className="text-gray-500 text-sm mb-4 max-w-md">
              Professional AI-powered website analysis reports with actionable insights. 
              Get comprehensive SEO, CRO, and UX recommendations in minutes.
            </p>
            <div className="flex space-x-4">
              <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="hover:text-orange-500">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Button>
              </Link>
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="hover:text-orange-500">
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </Button>
              </Link>
              <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="hover:text-orange-500">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Button>
              </Link>
              <Link href="mailto:contact@aigrowthreports.com">
                <Button variant="ghost" size="icon" className="hover:text-orange-500">
                  <Mail className="h-5 w-5" />
                  <span className="sr-only">Email</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/generate" className="text-gray-500 hover:text-orange-500 text-sm transition-colors">
                  Generate Report
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-500 hover:text-orange-500 text-sm transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-500 hover:text-orange-500 text-sm transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/reports" className="text-gray-500 hover:text-orange-500 text-sm transition-colors">
                  My Reports
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-gray-500 hover:text-orange-500 text-sm transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs" className="text-gray-500 hover:text-orange-500 text-sm transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-gray-500 hover:text-orange-500 text-sm transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-500 hover:text-orange-500 text-sm transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-500 hover:text-orange-500 text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-500 hover:text-orange-500 text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-4 md:mb-0">
              © {new Date().getFullYear()} AI Growth Reports. All rights reserved.
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Ready to grow?</span>
              <Link href="/generate">
                <Button size="sm" className="rounded-full bg-orange-500 hover:bg-orange-600">
                  Start Free Analysis
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}