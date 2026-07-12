import { Truck, Users, MapPin, Wrench, Loader2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';

export default function Dashboard() {
  const { data: kpis, loading, error } = useApi('/kpis');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load dashboard: {error}
      </div>
    );
  }

  const stats = [
    { label: 'Total Vehicles', value: kpis?.vehicles?.total || 0, icon: Truck, color: 'bg-blue-500' },
    { label: 'Available Drivers', value: kpis?.drivers?.available || 0, icon: Users, color: 'bg-emerald-500' },
    { label: 'Active Trips', value: kpis?.trips?.active || 0, icon: MapPin, color: 'bg-purple-500' },
    { label: 'In Maintenance', value: kpis?.maintenance?.active || 0, icon: Wrench, color: 'bg-amber-500' },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Fleet Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Available</span>
              <span className="font-medium text-emerald-600">{kpis?.vehicles?.available || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">On Trip</span>
              <span className="font-medium text-blue-600">{kpis?.vehicles?.on_trip || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">In Shop</span>
              <span className="font-medium text-amber-600">{kpis?.vehicles?.in_shop || 0}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Driver Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Available</span>
              <span className="font-medium text-emerald-600">{kpis?.drivers?.available || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">On Trip</span>
              <span className="font-medium text-blue-600">{kpis?.drivers?.on_trip || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Active</span>
              <span className="font-medium text-slate-800">{kpis?.drivers?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 card p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Trip Statistics</h2>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-600">{kpis?.trips?.active || 0}</p>
            <p className="text-slate-500">Active</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-600">{kpis?.trips?.completed || 0}</p>
            <p className="text-slate-500">Completed</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-600">{kpis?.trips?.total || 0}</p>
            <p className="text-slate-500">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
