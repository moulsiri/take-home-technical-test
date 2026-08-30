import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 text-center relative overflow-hidden">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000"></div>

      <div className="scale-in gap-6 flex flex-col items-center max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground bg-clip-text">
          Authentication made <span className="text-transparent bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text">Simple.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed mt-4">
          A production-ready full-stack authentication system built with Next.js App Router, NestJS, Prisma, and PostgreSQL. Highly secure and completely modern.
        </p>
        
        <div className="flex gap-4 mt-8">
          <Link href="/register" className="px-8 py-4 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/25 active:scale-95">
            Get Started
          </Link>
          <Link href="/login" className="px-8 py-4 rounded-full font-bold text-foreground bg-white/50 border border-gray-200 dark:border-gray-800 hover:bg-white/80 transition active:scale-95 shadow-sm">
            View Live Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
