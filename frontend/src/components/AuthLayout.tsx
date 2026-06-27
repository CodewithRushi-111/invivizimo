import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <main className="min-h-screen flex relative overflow-hidden bg-background text-on-background font-sans selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Left Panel: Brand Visual */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-inverse-surface overflow-hidden items-center justify-center p-8">
        {/* Background Decorative Element (Subtle grid/shimmer) */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
          }}
        />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary rounded-full blur-[120px] opacity-10"></div>
        
        <div className="relative z-10 max-w-lg text-left">
          <div className="mb-12 flex items-center gap-3">
            {/* White pill wrapping our branding image logo to render consistently with high-contrast styling */}
            <div className="bg-white px-4 py-2 rounded-xl flex items-center justify-center shadow-md">
              <img src="/logo.png" alt="Invoizmo" className="h-8 object-contain" />
            </div>
            <span className="font-display text-3xl font-extrabold text-white tracking-tight">Invoizmo</span>
          </div>
          
          <h1 className="font-display text-4xl font-extrabold text-white mb-6 leading-tight">
            Get paid faster with <span className="text-primary-fixed-dim">intelligent</span> invoicing.
          </h1>
          <p className="font-sans text-lg text-outline-variant mb-12">
            Join over 10,000 businesses automating their financial operations with precision and ease.
          </p>
          
          {/* Floating Badge Preview */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-outline-variant uppercase tracking-widest">Recent Activity</span>
              <span className="text-secondary text-xs font-semibold bg-secondary-container/20 px-2.5 py-1 rounded-full border border-secondary/20">Live</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-secondary"></div>
                </div>
                <span className="font-mono text-sm text-white">$12,450.00</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed"></div>
                <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-primary-fixed"></div>
                </div>
                <span className="font-mono text-sm text-white">$8,210.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel: Forms */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background relative z-20">
        {children}
      </section>
    </main>
  );
};
