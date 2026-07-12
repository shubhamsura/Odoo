import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TRIP_STATUSES = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

const mockVehicles = [
  { id: 1, registration_number: 'VAN-05', model: 'Transit Van', max_load: 500, status: 'Available' },
  { id: 2, registration_number: 'TRUCK-04', model: 'Ford F-150', max_load: 1000, status: 'Available' },
  { id: 3, registration_number: 'VAN-03', model: 'Sprinter', max_load: 800, status: 'On Trip' },
];

const mockDrivers = [
  { id: 1, name: 'Alex', license_number: 'DL001', status: 'Available' },
  { id: 2, name: 'Suresh', license_number: 'DL002', status: 'Available' },
  { id: 3, name: 'Maria', license_number: 'DL003', status: 'On Trip' },
];

const mockTrips = [
  {
    id: 'TR001',
    source: 'Gandhinagar Depot',
    destination: 'Ahmedabad Hub',
    status: 'Dispatched',
    vehicle: 'VAN-05',
    driver: 'Alex',
    eta: '45 min'
  },
  {
    id: 'TR004',
    source: 'Vatva Industrial Area',
    destination: 'Sanand Warehouse',
    status: 'Draft',
    vehicle: 'TRUCK-04',
    driver: 'SURESH',
    note: 'Awaiting driver'
  },
  {
    id: 'TR006',
    source: 'Mansa',
    destination: 'Kalol Depot',
    status: 'Cancelled',
    vehicle: null,
    driver: null,
    note: 'Vehicle went to shop'
  },
];

function TripLifecycle({ currentStatus }) {
  const statusIndex = TRIP_STATUSES.indexOf(currentStatus);

  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Trip Lifecycle</h3>
      <div className="flex items-center gap-2">
        {TRIP_STATUSES.map((status, index) => (
          <div key={status} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full ${
                  index <= statusIndex
                    ? index === statusIndex
                      ? 'bg-blue-500'
                      : 'bg-emerald-500'
                    : 'bg-slate-300'
                }`}
              />
              <span className={`text-xs mt-1 ${
                index <= statusIndex ? 'text-slate-700 font-medium' : 'text-slate-400'
              }`}>
                {status}
              </span>
            </div>
            {index < TRIP_STATUSES.length - 1 && (
              <div className={`w-16 h-0.5 mx-1 ${
                index < statusIndex ? 'bg-emerald-500' : 'bg-slate-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TripCard({ trip }) {
  const getStatusClass = (status) => {
    switch (status) {
      case 'Dispatched': return 'status-dispatched';
      case 'Draft': return 'status-draft';
      case 'Completed': return 'status-completed';
      case 'Cancelled': return 'status-cancelled';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div className="trip-card">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-semibold text-slate-800">{trip.id}</span>
        <span className="text-sm text-slate-500">
          {trip.vehicle && trip.driver ? `${trip.vehicle} / ${trip.driver}` : 'Unassigned'}
        </span>
      </div>
      <p className="text-slate-700 mb-3">
        {trip.source} -&gt; {trip.destination}
      </p>
      <div className="flex justify-between items-center">
        <span className={`status-badge ${getStatusClass(trip.status)}`}>
          {trip.status}
        </span>
        <span className="text-sm text-slate-500 italic">
          {trip.eta || trip.note || ''}
        </span>
      </div>
    </div>
  );
}

function CapacityWarning({ vehicleCapacity, cargoWeight }) {
  if (!vehicleCapacity || !cargoWeight) return null;

  const exceeded = cargoWeight > vehicleCapacity;
  const difference = cargoWeight - vehicleCapacity;

  if (!exceeded) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-2 text-red-700">
        <XCircle size={20} className="mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm">Vehicle Capacity: {vehicleCapacity} kg</p>
          <p className="text-sm">Cargo Weight: {cargoWeight} kg</p>
          <p className="text-sm font-semibold">
            Capacity exceeded by {difference} kg — dispatch blocked
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Trips() {
  const [trips, setTrips] = useState(mockTrips);
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [drivers, setDrivers] = useState(mockDrivers);

  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight: '',
    planned_distance: '',
  });

  const availableVehicles = useMemo(
    () => vehicles.filter((v) => v.status === 'Available'),
    [vehicles]
  );

  const availableDrivers = useMemo(
    () => drivers.filter((d) => d.status === 'Available'),
    [drivers]
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === Number(formData.vehicle_id)),
    [vehicles, formData.vehicle_id]
  );

  const cargoWeight = Number(formData.cargo_weight) || 0;
  const isOverCapacity = selectedVehicle && cargoWeight > selectedVehicle.max_load;

  const canDispatch =
    formData.source &&
    formData.destination &&
    formData.vehicle_id &&
    formData.driver_id &&
    formData.cargo_weight &&
    formData.planned_distance &&
    !isOverCapacity;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDispatch = async (e) => {
    e.preventDefault();

    if (!canDispatch) {
      toast.error('Please fill all fields and ensure cargo weight is within vehicle capacity.');
      return;
    }

    const newTrip = {
      id: `TR${String(trips.length + 1).padStart(3, '0')}`,
      source: formData.source,
      destination: formData.destination,
      status: 'Dispatched',
      vehicle: selectedVehicle?.registration_number,
      driver: drivers.find((d) => d.id === Number(formData.driver_id))?.name,
      eta: 'Just dispatched'
    };

    setTrips((prev) => [newTrip, ...prev]);

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === Number(formData.vehicle_id) ? { ...v, status: 'On Trip' } : v
      )
    );
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === Number(formData.driver_id) ? { ...d, status: 'On Trip' } : d
      )
    );

    setFormData({
      source: '',
      destination: '',
      vehicle_id: '',
      driver_id: '',
      cargo_weight: '',
      planned_distance: '',
    });

    toast.success('Trip dispatched successfully!');
  };

  const handleCancel = () => {
    setFormData({
      source: '',
      destination: '',
      vehicle_id: '',
      driver_id: '',
      cargo_weight: '',
      planned_distance: '',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Create Trip Form */}
      <div>
        <TripLifecycle currentStatus="Dispatched" />

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Create Trip</h2>

          <form onSubmit={handleDispatch} className="space-y-4">
            <div>
              <label className="form-label">Source</label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                placeholder="Enter source location"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Destination</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                placeholder="Enter destination"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Vehicle (Available Only)</label>
              <select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select a vehicle</option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration_number} - {vehicle.max_load} kg capacity
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Driver (Available Only)</label>
              <select
                name="driver_id"
                value={formData.driver_id}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select a driver</option>
                {availableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Cargo Weight (KG)</label>
              <input
                type="number"
                name="cargo_weight"
                value={formData.cargo_weight}
                onChange={handleInputChange}
                placeholder="Enter cargo weight"
                className="form-input"
                min="0"
              />
            </div>

            <div>
              <label className="form-label">Planned Distance (KM)</label>
              <input
                type="number"
                name="planned_distance"
                value={formData.planned_distance}
                onChange={handleInputChange}
                placeholder="Enter planned distance"
                className="form-input"
                min="0"
              />
            </div>

            <CapacityWarning
              vehicleCapacity={selectedVehicle?.max_load}
              cargoWeight={cargoWeight}
            />

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={!canDispatch}
                className="btn-primary flex-1"
              >
                {isOverCapacity ? 'Dispatch (disabled)' : 'Dispatch'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn-danger"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <p className="text-sm text-slate-500 mt-4">
          On Complete: odometer -&gt; fuel log -&gt; expenses -&gt; Vehicle & Driver Available
        </p>
      </div>

      {/* Right Panel - Live Board */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Live Board</h2>
        <div className="space-y-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </div>
    </div>
  );
}
