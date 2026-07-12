import { useState } from 'react';
import { Moon, Sun, Bell, Shield, Database } from 'lucide-react';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Sun size={20} />
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">Dark Mode</p>
              <p className="text-sm text-slate-500">Switch between light and dark themes</p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full transition-colors ${
                darkMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Bell size={20} />
            Notifications
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">Push Notifications</p>
              <p className="text-sm text-slate-500">Receive alerts for trip updates and maintenance reminders</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition-colors ${
                notifications ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                notifications ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Database size={20} />
            Data Management
          </h2>
          <div className="space-y-4">
            <button className="btn-secondary w-full">Export All Data (CSV)</button>
            <button className="btn-secondary w-full">Backup Database</button>
          </div>
        </div>
      </div>
    </div>
  );
}
