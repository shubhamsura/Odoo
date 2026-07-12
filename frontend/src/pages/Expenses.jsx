import { useState } from 'react';
import { Plus, Fuel, CircleDollarSign, MoreHorizontal } from 'lucide-react';

const mockExpenses = [
  { id: 1, vehicle: 'VAN-05', type: 'Fuel', amount: 85.50, date: '2024-07-12', description: 'Full tank refill' },
  { id: 2, vehicle: 'TRUCK-04', type: 'Toll', amount: 25.00, date: '2024-07-11', description: 'Highway toll - Route A1' },
  { id: 3, vehicle: 'VAN-03', type: 'Fuel', amount: 72.30, date: '2024-07-11', description: 'Partial refill' },
  { id: 4, vehicle: 'TRUCK-04', type: 'Other', amount: 150.00, date: '2024-07-10', description: 'Parking fees (monthly)' },
];

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
  const [expenses] = useState(mockExpenses);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fuel & Expenses</h1>
          <p className="text-slate-500">Total this period: <span className="font-semibold text-slate-800">${totalExpenses.toFixed(2)}</span></p>
        </div>
        <button className="btn-primary flex items-center gap-2">
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
            {expenses.map((expense) => {
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
                  <td className="px-6 py-4 text-slate-600">{expense.vehicle}</td>
                  <td className="px-6 py-4 text-slate-600">{expense.description}</td>
                  <td className="px-6 py-4 text-slate-600">{expense.date}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-800">${expense.amount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
