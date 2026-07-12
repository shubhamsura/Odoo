import { Truck, Users, MapPin, Wrench } from 'lucide-react';

const stats = [
  { label: 'Active Vehicles', value: '24', icon: Truck, color: 'bg-blue-500' },
  { label: 'Available Drivers', value: '18', icon: Users, color: 'bg-emerald-500' },
  { label: 'Active Trips', value: '12', icon: MapPin, color: 'bg-purple-500' },
  { label: 'In Maintenance', value: '3', icon: Wrench, color: 'bg-amber-500' },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h2>
        <p className="text-slate-500">Activity feed will be displayed here...</p>
      </div>
    </div>
  );
}
