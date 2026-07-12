import { useState } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi, apiPost } from '../hooks/useApi';

const statusColors = {
  'Available': 'bg-emerald-100 text-emerald-700',
  'On Trip': 'bg-blue-100 text-blue-700',
  'In Shop': 'bg-amber-100 text-amber-700',
  'Retired': 'bg-slate-100 text-slate-700',
};

export default function Fleet() {
  const { data: vehicles, loading, error, refetch } = useApi('/vehicles');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    registration_number: '',
    model: '',
    type: 'Van',
    max_load: '',
    odometer: '0',
    acquisition_cost: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/vehicles', {
        ...formData,
        max_load: Number(formData.max_load),
        odometer: Number(formData.odometer),
        acquisition_cost: Number(formData.acquisition_cost),
      });
      toast.success('Vehicle added successfully!');
      setShowModal(false);
      setFormData({
        registration_number: '',
        model: '',
        type: 'Van',
        max_load: '',
        odometer: '0',
        acquisition_cost: '',
      });
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Fleet Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
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
            {(vehicles || []).map((vehicle) => (
              <tr key={vehicle.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{vehicle.registration_number}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.model}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.type}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.max_load}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.odometer?.toLocaleString()} km</td>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Add New Vehicle</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Registration Number</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="form-input"
                >
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                  <option value="Car">Car</option>
                </select>
              </div>
              <div>
                <label className="form-label">Max Load (kg)</label>
                <input
                  type="number"
                  value={formData.max_load}
                  onChange={(e) => setFormData({ ...formData, max_load: e.target.value })}
                  className="form-input"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="form-label">Acquisition Cost</label>
                <input
                  type="number"
                  value={formData.acquisition_cost}
                  onChange={(e) => setFormData({ ...formData, acquisition_cost: e.target.value })}
                  className="form-input"
                  min="0"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Add Vehicle'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
