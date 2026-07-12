import { useState } from 'react';
import { Plus, Truck } from 'lucide-react';

const mockVehicles = [
  { id: 1, registration_number: 'VAN-05', model: 'Transit Van', type: 'Van', max_load: 500, odometer: 45000, status: 'Available' },
  { id: 2, registration_number: 'TRUCK-04', model: 'Ford F-150', type: 'Truck', max_load: 1000, odometer: 78000, status: 'Available' },
  { id: 3, registration_number: 'VAN-03', model: 'Sprinter', type: 'Van', max_load: 800, odometer: 32000, status: 'On Trip' },
  { id: 4, registration_number: 'CAR-01', model: 'Honda Civic', type: 'Car', max_load: 200, odometer: 15000, status: 'In Shop' },
];

const statusColors = {
  'Available': 'bg-emerald-100 text-emerald-700',
  'On Trip': 'bg-blue-100 text-blue-700',
  'In Shop': 'bg-amber-100 text-amber-700',
  'Retired': 'bg-slate-100 text-slate-700',
};

export default function Fleet() {
  const [vehicles] = useState(mockVehicles);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Fleet Management</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Vehicle
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Registration</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Model</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Max Load (kg)</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Odometer</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{vehicle.registration_number}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.model}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.type}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.max_load}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.odometer.toLocaleString()} km</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[vehicle.status]}`}>
                    {vehicle.status}
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
