import { useState } from 'react';
import { Plus, Wrench, CheckCircle, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi, apiPost, apiPut } from '../hooks/useApi';

export default function Maintenance() {
  const { data: logs, loading, refetch } = useApi('/maintenance');
  const { data: vehicles } = useApi('/vehicles');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    description: '',
    cost: '',
  });

  const availableVehicles = (vehicles || []).filter(v => v.status === 'Available');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/maintenance', {
        vehicle_id: Number(formData.vehicle_id),
        description: formData.description,
        cost: Number(formData.cost) || 0,
      });
      toast.success('Vehicle checked in for maintenance!');
      setShowModal(false);
      setFormData({ vehicle_id: '', description: '', cost: '' });
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (id) => {
    try {
      await apiPut(`/maintenance/${id}/close`, {});
      toast.success('Maintenance closed, vehicle released!');
      refetch();
    } catch (err) {
      toast.error(err.message);
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
        <h1 className="text-2xl font-bold text-slate-800">Maintenance Logs</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Check-in Vehicle
        </button>
      </div>

      <div className="grid gap-4">
        {(logs || []).length === 0 ? (
          <p className="text-slate-500 text-center py-8">No maintenance logs yet.</p>
        ) : (
          (logs || []).map((log) => (
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
                    <h3 className="font-semibold text-slate-800">{log.vehicle_reg}</h3>
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
                  <button onClick={() => handleClose(log.id)} className="btn-secondary text-sm py-2">
                    Mark as Complete & Release Vehicle
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Check-in Vehicle for Maintenance</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Vehicle</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="">Select a vehicle</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.registration_number} - {v.model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="form-label">Estimated Cost</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="form-input"
                  min="0"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Check-in Vehicle'}
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
