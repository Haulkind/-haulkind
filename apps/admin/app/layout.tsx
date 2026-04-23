'use client';
import './globals.css';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useState, useEffect } from 'react';
import { api, type AdminRole } from '../lib/api';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);

  // Fetch the current user's role once per mount so we can adapt the UI for
  // read-only guest auditors (hide Settings, show banner, gate writes).
  useEffect(() => {
    if (isLoginPage) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getMe();
        if (!cancelled) {
          const r = data?.admin?.role;
          setRole(r === 'admin' || r === 'guest' ? r : null);
        }
      } catch {
        // If /me fails (e.g. token expired) the individual pages will redirect
        // to /login; no need to double-handle here.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoginPage]);

  const isGuest = role === 'guest';

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      api.clearToken();
      router.push('/login');
    }
  };

  const allNavItems = [
    { href: '/', label: 'Dashboard', icon: '📊', adminOnly: false },
    { href: '/drivers', label: 'Drivers', icon: '🚗', adminOnly: false },
    { href: '/customers', label: 'Customers', icon: '👥', adminOnly: false },
    { href: '/orders', label: 'Orders', icon: '📦', adminOnly: false },
    { href: '/leads', label: 'Leads', icon: '📋', adminOnly: false },
    { href: '/payouts', label: 'Payouts', icon: '💰', adminOnly: false },
    { href: '/map', label: 'Driver Map', icon: '📍', adminOnly: false },
    { href: '/settings', label: 'Settings', icon: '🔒', adminOnly: true },
  ];
  const navItems = allNavItems.filter((item) => !item.adminOnly || !isGuest);

  if (isLoginPage) {
    return (
      <html lang="en">
        <head>
          <title>Haulkind Admin - Login</title>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Script id="gtm-head-login" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-KNBG3C48');
          `}</Script>
        </head>
        <body>
          {/* Google Tag Manager (noscript) */}
          <noscript>
            <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KNBG3C48" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
          </noscript>
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-KCC7J1ZT6Y" strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KCC7J1ZT6Y');
            gtag('config', 'AW-17988332947');
          `}</Script>
          <Script id="meta-pixel-login" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1470537883812602');
            fbq('track', 'PageView');
          `}</Script>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>Haulkind Admin Dashboard</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Script id="gtm-head-dashboard" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-KNBG3C48');
        `}</Script>
      </head>
      <body className="bg-gray-100">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KNBG3C48" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
        </noscript>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-KCC7J1ZT6Y" strategy="afterInteractive" />
        <Script id="gtag-init-dashboard" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-KCC7J1ZT6Y');
          gtag('config', 'AW-17988332947');
        `}</Script>
        <Script id="meta-pixel-dashboard" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1470537883812602');
          fbq('track', 'PageView');
        `}</Script>
        <div className="flex h-screen overflow-hidden">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col
            transform transition-transform duration-200 ease-in-out
            lg:relative lg:translate-x-0 lg:flex-shrink-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">🚛 Haulkind</h1>
                <p className="text-sm text-gray-400 mt-1">Admin Dashboard</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                          isActive
                            ? 'bg-green-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="p-4 border-t border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {isGuest && (
              <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-sm text-center flex-shrink-0">
                <span className="font-semibold">Read-only guest mode.</span>{' '}
                You can view data but not create, edit, or delete anything.
              </div>
            )}
            {/* Mobile top bar */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-600 hover:text-gray-900 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-gray-900">🚛 Haulkind</h1>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 p-1"
                title="Logout"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
