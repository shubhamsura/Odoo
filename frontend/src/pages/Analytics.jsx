import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useApi } from '../hooks/useApi';

export default function Analytics() {
  const { data: reports, loading, error } = useApi('/reports');

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
        Failed to load analytics: {error}
      </div>
    );
  }

  const fuelData = (reports?.fuel_efficiency || []).map(item => ({
    vehicle: item.registration_number,
    efficiency: item.km_per_liter || 0,
  }));

  const roiData = (reports?.vehicle_roi || []).map(item => ({
    vehicle: item.registration_number,
    roi: item.roi_percent || 0,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Fuel Efficiency by Vehicle (km/L)</h2>
          <div className="h-64">
            {fuelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="vehicle" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="efficiency" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No fuel efficiency data available yet. Complete some trips first!
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Vehicle ROI (%)</h2>
          <div className="h-64">
            {roiData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="vehicle" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="roi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No ROI data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Fleet Utilization</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">{reports?.fleet_utilization || 0}%</p>
            <p className="text-slate-500">Fleet Utilization</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{reports?.fuel_efficiency?.length || 0}</p>
            <p className="text-slate-500">Vehicles with Trip Data</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {fuelData.length > 0
                ? (fuelData.reduce((sum, v) => sum + v.efficiency, 0) / fuelData.length).toFixed(1)
                : '0'
              } km/L
            </p>
            <p className="text-slate-500">Avg Fuel Efficiency</p>
          </div>
        </div>
      </div>
    </div>
  );
}
