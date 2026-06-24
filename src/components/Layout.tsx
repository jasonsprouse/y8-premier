import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Wallet, Sparkles, LogOut, User } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export function Layout() {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();

  const getLinkStyle = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center justify-between px-4 py-3 rounded-lg mb-2 cursor-pointer transition-all ${
      isActive ? 'bg-slate-800 text-white opacity-100' : 'text-slate-100 opacity-70 hover:opacity-100'
    }`;
  };

  return (
    <div className="h-screen w-full flex bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      {isAuthenticated && (
        <aside className="w-60 bg-slate-900 text-slate-50 flex flex-col border-r border-slate-800 shrink-0 z-10">
          <div className="p-6 border-b border-slate-800">
            <Link to="/">
              <div className="text-2xl font-bold tracking-tight text-sky-400">
                Y8 <span className="font-light text-slate-400">PREMIER</span>
              </div>
            </Link>
          </div>
          <nav className="flex-1 p-5 overflow-y-auto">
            <div className="uppercase text-[10px] font-bold text-slate-500 tracking-widest mb-4">
              Navigation
            </div>
            <ul className="list-none p-0 m-0 text-sm">
              <li>
                <Link to="/" className={getLinkStyle('/')}>
                  <div className="flex items-center gap-3">
                    <Compass className="w-4 h-4" /> Dashboard
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/financial" className={getLinkStyle('/financial')}>
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4" /> Financial
                  </div>
                  {location.pathname !== '/financial' && <span className="bg-sky-400 w-2 h-2 rounded-full"></span>}
                </Link>
              </li>
              <li>
                <Link to="/ai" className={getLinkStyle('/ai')}>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4" /> AI Hub
                  </div>
                  {location.pathname !== '/ai' && <span className="bg-sky-400 w-2 h-2 rounded-full"></span>}
                </Link>
              </li>
            </ul>
          </nav>
          
          <div className="p-6 bg-slate-800 flex items-center justify-between gap-3 mt-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-400 flex items-center justify-center font-bold text-xs text-slate-900 shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="text-[13px] truncate">{user?.name}</div>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-white transition-colors" aria-label="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {!isAuthenticated ? 'Y8 Premier' : 'Command Center'}
          </h1>
          <div className="flex gap-4">
             {isAuthenticated ? (
               <>
                 <div className="px-4 py-2 bg-slate-100 rounded-md text-[13px] text-slate-500 font-medium flex items-center hidden sm:flex">
                   Auth: Authenticated
                 </div>
                 <div className="px-4 py-2 bg-sky-400 text-white rounded-md text-[13px] font-semibold flex items-center cursor-pointer shadow-sm shadow-sky-400/20">
                   + New Service
                 </div>
               </>
             ) : (
                <div className="px-4 py-2 bg-slate-100 rounded-md text-[13px] text-slate-500 font-medium flex items-center">
                   Please log in
                </div>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto w-full pb-12 flex flex-col min-h-full">
            <div className="flex-1">
              <Outlet />
            </div>
            
            {/* Footer */}
            <footer className="mt-16 border-t border-slate-200 pt-8 pb-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 w-full">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 tracking-wider">Y8</span>
                <span>&copy; {new Date().getFullYear()} Y8 Lifestyle Services.</span>
              </div>
              <div className="flex gap-6">
                <a href="#" className="hover:text-slate-800 transition-colors">Privacy</a>
                <a href="#" className="hover:text-slate-800 transition-colors">Terms</a>
                <a href="#" className="hover:text-slate-800 transition-colors">Support</a>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
