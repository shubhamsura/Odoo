import { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';

const mockDrivers = [
  { id: 1, name: 'Alex Johnson', license_number: 'DL001', license_category: 'Heavy', license_expiry: '2025-03-15', safety_score: 92, status: 'Available' },
  { id: 2, name: 'Suresh Kumar', license_number: 'DL002', license_category: 'Heavy', license_expiry: '2024-12-20', safety_score: 88, status: 'Available' },
  { id: 3, name: 'Maria Garcia', license_number: 'DL003', license_category: 'Light', license_expiry: '2025-06-10', safety_score: 95, status: 'On Trip' },
  { id: 4, name: 'John Smith', license_number: 'DL004', license_category: 'Heavy', license_expiry: '2024-08-01', safety_score: 78, status: 'Off Duty' },
];

const statusColors = {
  'Available': 'bg-emerald-100 text-emerald-700',
  'On Trip': 'bg-blue-100 text-blue-700',
  'Off Duty': 'bg-slate-100 text-slate-700',
  'Suspended': 'bg-red-100 text-red-700',
};

function isExpiringSoon(dateStr) {
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays > 0;
}

function isExpired(dateStr) {
  return new Date(dateStr) < new Date();
}

export default function Drivers() {
  const [drivers] = useState(mockDrivers);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Driver Directory</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Driver
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">License No.</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Category</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">License Expiry</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Safety Score</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{driver.name}</td>
                <td className="px-6 py-4 text-slate-600">{driver.license_number}</td>
                <td className="px-6 py-4 text-slate-600">{driver.license_category}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`${isExpired(driver.license_expiry) ? 'text-red-600' : 'text-slate-600'}`}>
                      {driver.license_expiry}
                    </span>
                    {isExpiringSoon(driver.license_expiry) && (
                      <span className="flex items-center gap-1 text-amber-600 text-xs">
                        <AlertTriangle size={14} />
                        Expiring soon
                      </span>
                    )}
                    {isExpired(driver.license_expiry) && (
                      <span className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertTriangle size={14} />
                        Expired
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          driver.safety_score >= 90 ? 'bg-emerald-500' :
                          driver.safety_score >= 75 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${driver.safety_score}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600">{driver.safety_score}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[driver.status]}`}>
                    {driver.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
