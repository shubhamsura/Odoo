import { useState } from 'react';
import { Plus, Fuel, CircleDollarSign, MoreHorizontal, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi, apiPost } from '../hooks/useApi';

const typeIcons = {
  'Fuel': Fuel,
  'Toll': CircleDollarSign,
  'Other': MoreHorizontal,
};

const typeColors = {
  'Fuel': 'bg-amber-100 text-amber-700',
  'Toll': 'bg-blue-100 text-blue-700',
  'Other': 'bg-slate-100 text-slate-700',
};

export default function Expenses() {
  const { data: expenses, loading, refetch } = useApi('/expenses');
  const { data: vehicles } = useApi('/vehicles');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    type: 'Fuel',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/expenses', {
        ...formData,
        vehicle_id: Number(formData.vehicle_id),
        amount: Number(formData.amount),
      });
      toast.success('Expense logged successfully!');
      setShowModal(false);
      setFormData({
        vehicle_id: '',
        type: 'Fuel',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
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

  const totalExpenses = (expenses || []).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fuel & Expenses</h1>
          <p className="text-slate-500">Total: <span className="font-semibold text-slate-800">${totalExpenses.toFixed(2)}</span></p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Log Expense
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Vehicle</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="text-right px-6 py-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(expenses || []).length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">No expenses logged yet.</td>
              </tr>
            ) : (
              (expenses || []).map((expense) => {
                const Icon = typeIcons[expense.type];
                return (
                  <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${typeColors[expense.type]}`}>
                          <Icon size={16} />
                        </div>
                        <span className="font-medium text-slate-700">{expense.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{expense.vehicle_reg}</td>
                    <td className="px-6 py-4 text-slate-600">{expense.description || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{expense.date}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">${expense.amount.toFixed(2)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Log Expense</h2>
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
                  {(vehicles || []).map((v) => (
                    <option key={v.id} value={v.id}>{v.registration_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="form-input"
                >
                  <option value="Fuel">Fuel</option>
                  <option value="Toll">Toll</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="form-input"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Log Expense'}
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
