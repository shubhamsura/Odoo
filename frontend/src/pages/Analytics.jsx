import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const fuelEfficiencyData = [
  { month: 'Jan', efficiency: 8.2 },
  { month: 'Feb', efficiency: 8.5 },
  { month: 'Mar', efficiency: 7.9 },
  { month: 'Apr', efficiency: 8.8 },
  { month: 'May', efficiency: 9.1 },
  { month: 'Jun', efficiency: 8.7 },
];

const vehicleROIData = [
  { vehicle: 'VAN-05', roi: 12.5 },
  { vehicle: 'TRUCK-04', roi: 8.2 },
  { vehicle: 'VAN-03', roi: 15.3 },
  { vehicle: 'CAR-01', roi: 6.8 },
  { vehicle: 'TRUCK-01', roi: 11.2 },
];

export default function Analytics() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Fuel Efficiency Over Time (km/L)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelEfficiencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Vehicle ROI (%)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleROIData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="vehicle" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="roi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Fleet Utilization</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">78%</p>
            <p className="text-slate-500">Fleet Utilization</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">142</p>
            <p className="text-slate-500">Trips This Month</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">8.4 km/L</p>
            <p className="text-slate-500">Avg Fuel Efficiency</p>
          </div>
        </div>
      </div>
    </div>
  );
}
