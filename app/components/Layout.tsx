import { useState, useEffect } from 'react';
import { Link, useLocation, Form, useNavigate } from '@remix-run/react';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UsersIcon,
  UserIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon,
  BellIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '~/lib/translations';
import { AuthUser } from '~/types';

interface LayoutProps {
  children: React.ReactNode;
  user: AuthUser;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  current?: boolean;
}

export default function Layout({ children, user }: LayoutProps) {
  const { t, language } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'bn'>('bn');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Navigation items based on user role
  const navigation: NavigationItem[] = [
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: HomeIcon,
      roles: ['superadmin']
    },
    {
      name: t('sales'),
      href: '/sales',
      icon: ShoppingCartIcon,
      roles: ['superadmin', 'manager']
    },
    {
      name: t('costs'),
      href: '/costs',
      icon: CurrencyDollarIcon,
      roles: ['superadmin', 'manager']
    },
    {
      name: t('users'),
      href: '/users',
      icon: UsersIcon,
      roles: ['superadmin']
    },
    {
      name: t('profile'),
      href: '/profile',
      icon: UserIcon,
      roles: ['superadmin', 'manager', 'user']
    },
    {
      name: t('reports'),
      href: '/reports',
      icon: DocumentChartBarIcon,
      roles: ['superadmin']
    },
    {
      name: t('settings'),
      href: '/settings',
      icon: Cog6ToothIcon,
      roles: ['superadmin', 'manager', 'user']
    }
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user.role)
  ).map(item => ({
    ...item,
    current: location.pathname === item.href
  }));

  // Load theme and language from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    const savedLanguage = localStorage.getItem('language') as 'en' | 'bn' || 'bn';
    
    setTheme(savedTheme);
    setCurrentLanguage(savedLanguage);
    
    // Apply theme to document
    document.documentElement.className = savedTheme;
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
    
    // Update cookie
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000`;
  };

  // Toggle language
  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'bn' ? 'en' : 'bn';
    setCurrentLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // Update cookie and reload
    document.cookie = `language=${newLanguage}; path=/; max-age=31536000`;
    window.location.reload();
  };

  // Handle logout
  const handleLogout = () => {
    // Clear auth token
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <HomeIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                VMS
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Vehicle Management
              </p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t(user.role)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.mobile}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-4">
          <ul className="space-y-1">
            {filteredNavigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={closeSidebar}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${item.current
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      item.current
                        ? 'text-blue-500 dark:text-blue-300'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }`}
                  />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Theme and Language Controls */}
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-4 h-4" />
              ) : (
                <SunIcon className="w-4 h-4" />
              )}
              {theme === 'light' ? t('darkMode') : t('lightMode')}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <LanguageIcon className="w-4 h-4" />
              {currentLanguage === 'bn' ? 'English' : 'বাংলা'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Page title */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredNavigation.find(item => item.current)?.name || t('dashboard')}
              </h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                <BellIcon className="w-5 h-5" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {t('profile')}
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {t('settings')}
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-gray-600" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
}