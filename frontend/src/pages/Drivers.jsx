import { useState } from 'react';
import { Plus, AlertTriangle, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi, apiPost } from '../hooks/useApi';

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
  const { data: drivers, loading, refetch } = useApi('/drivers');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    license_category: 'Light Vehicle',
    license_expiry_date: '',
    contact_number: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/drivers', formData);
      toast.success('Driver added successfully!');
      setShowModal(false);
      setFormData({
        name: '',
        license_number: '',
        license_category: 'Light Vehicle',
        license_expiry_date: '',
        contact_number: '',
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
        <h1 className="text-2xl font-bold text-slate-800">Driver Directory</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
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
            {(drivers || []).map((driver) => (
              <tr key={driver.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{driver.name}</td>
                <td className="px-6 py-4 text-slate-600">{driver.license_number}</td>
                <td className="px-6 py-4 text-slate-600">{driver.license_category}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`${isExpired(driver.license_expiry_date) ? 'text-red-600' : 'text-slate-600'}`}>
                      {driver.license_expiry_date}
                    </span>
                    {isExpiringSoon(driver.license_expiry_date) && (
                      <span className="flex items-center gap-1 text-amber-600 text-xs">
                        <AlertTriangle size={14} />
                        Expiring soon
                      </span>
                    )}
                    {isExpired(driver.license_expiry_date) && (
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Add New Driver</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">License Number</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">License Category</label>
                <select
                  value={formData.license_category}
                  onChange={(e) => setFormData({ ...formData, license_category: e.target.value })}
                  className="form-input"
                >
                  <option value="Light Vehicle">Light Vehicle</option>
                  <option value="Heavy Cargo">Heavy Cargo</option>
                </select>
              </div>
              <div>
                <label className="form-label">License Expiry Date</label>
                <input
                  type="date"
                  value={formData.license_expiry_date}
                  onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Contact Number</label>
                <input
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Add Driver'}
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
