import { Search, User } from 'lucide-react';

export default function Header({ user = { name: 'Raven K.', role: 'Dispatcher' } }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-slate-700 font-medium">{user.name}</span>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
          <span className="text-blue-700 text-sm font-medium">{user.role}</span>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </div>
    </header>
  );
}
