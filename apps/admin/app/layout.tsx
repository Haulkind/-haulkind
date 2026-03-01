'use client';
import './globals.css';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      router.push('/login');
    }
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/drivers', label: 'Drivers', icon: '🚗' },
    { href: '/customers', label: 'Customers', icon: '👥' },
    { href: '/orders', label: 'Orders', icon: '📦' },
    { href: '/payouts', label: 'Payouts', icon: '💰' },
  ];

  if (isLoginPage) {
    return (
      <html lang="en">
        <head>
          <title>Haulkind Admin - Login</title>
        </head>
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>Haulkind Admin Dashboard</title>
      </head>
      <body className="bg-gray-100">
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-gray-900 text-white flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <h1 className="text-2xl font-bold">🚛 Haulkind</h1>
              <p className="text-sm text-gray-400 mt-1">Admin Dashboard</p>
            </div>

            <nav className="flex-1 p-4">
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
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
