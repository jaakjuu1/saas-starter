import { trustedBy } from '@/lib/config/site';

export function LogoCloud() {
  return (
    <div className="border-y border-gray-100 bg-gray-50/60 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium uppercase tracking-widest text-gray-400">
          Trusted by growth teams at
        </p>
        <div className="group relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex w-max animate-marquee items-center gap-14">
            {[...trustedBy, ...trustedBy].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="text-xl font-semibold tracking-tight text-gray-400 transition-colors hover:text-gray-700"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
