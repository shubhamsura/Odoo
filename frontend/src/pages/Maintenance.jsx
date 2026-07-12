import { useState } from 'react';
import { Plus, Wrench, CheckCircle } from 'lucide-react';

const mockMaintenance = [
  { id: 1, vehicle: 'CAR-01', description: 'Oil change and brake inspection', cost: 250, start_date: '2024-07-10', status: 'Active' },
  { id: 2, vehicle: 'VAN-02', description: 'Tire replacement (all 4)', cost: 800, start_date: '2024-07-08', end_date: '2024-07-09', status: 'Closed' },
  { id: 3, vehicle: 'TRUCK-01', description: 'Engine diagnostic and repair', cost: 1500, start_date: '2024-07-05', status: 'Active' },
];

export default function Maintenance() {
  const [logs] = useState(mockMaintenance);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Maintenance Logs</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Check-in Vehicle
        </button>
      </div>

      <div className="grid gap-4">
        {logs.map((log) => (
          <div key={log.id} className="card p-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className={`p-3 rounded-lg ${log.status === 'Active' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                  {log.status === 'Active' ? (
                    <Wrench className="text-amber-600" size={24} />
                  ) : (
                    <CheckCircle className="text-emerald-600" size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{log.vehicle}</h3>
                  <p className="text-slate-600">{log.description}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Started: {log.start_date}
                    {log.end_date && ` • Completed: ${log.end_date}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-800">${log.cost}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  log.status === 'Active' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {log.status}
                </span>
              </div>
            </div>
            {log.status === 'Active' && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <button className="btn-secondary text-sm py-2">
                  Mark as Complete & Release Vehicle
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
