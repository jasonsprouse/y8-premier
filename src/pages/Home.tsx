import { Link } from 'react-router-dom';
import { MapPin, Plane, Calendar, Shield, Wallet, Sparkles, ArrowUpRight } from 'lucide-react';

const CARDS = [
  { id: 'concierge', title: 'Private Concierge', icon: Shield, color: 'bg-stone-100 text-stone-700', link: '#' },
  { id: 'travel', title: 'Global Travel', icon: Plane, color: 'bg-sky-100 text-sky-700', link: '#' },
  { id: 'real-estate', title: 'Real Estate', icon: MapPin, color: 'bg-emerald-100 text-emerald-700', link: '#' },
  { id: 'events', title: 'Exclusive Events', icon: Calendar, color: 'bg-rose-100 text-rose-700', link: '#' },
  { id: 'financial', title: 'Financial Services', icon: Wallet, color: 'bg-indigo-100 text-indigo-700', link: '/financial' },
  { id: 'ai', title: 'AI Services Hub', icon: Sparkles, color: 'bg-fuchsia-100 text-fuchsia-700', link: '/ai' },
];

export function Home() {
  return (
    <div className="space-y-12 animate-fade-in">
      <header className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
          Welcome to your premier lifestyle dashboard.
        </h1>
        <p className="mt-4 text-xl text-slate-500 max-w-2xl">
          Manage your exclusive services, assets, and intelligent workflows in one unified platform.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CARDS.map((card) => (
          <Link
            key={card.id}
            to={card.link}
            className="group relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col h-64 justify-between"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon className="w-7 h-7" />
            </div>
            
            <div className="mt-8">
              <h3 className="text-[15px] font-semibold text-slate-900 group-hover:text-black">{card.title}</h3>
              <p className="text-slate-500 mt-2 text-[13px]">Access your personalized {card.title.toLowerCase()} dashboard and settings.</p>
            </div>
            
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0">
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
