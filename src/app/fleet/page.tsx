"use client";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fleetApi } from "@/lib/api";
import {
  Button, Table, Modal, ConfirmDialog, Field, SelectField,
  SearchBar, EmptyState, Badge
} from "@/components/ui";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { Truck } from "@/types";
import toast from "react-hot-toast";
import { Plus, Truck as TruckIcon, Edit, Trash2, Eye, Weight, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";

const toArray = <T,>(data: any): T[] =>
  Array.isArray(data) ? data : data?.results ?? data?.data ?? data?.trucks ?? [];

const TRUCK_TYPES = [
  { value: "small", label: "Small (< 2 tons)" },
  { value: "medium", label: "Medium (2-5 tons)" },
  { value: "large", label: "Large (5-10 tons)" },
  { value: "extra_large", label: "Extra Large (10+ tons)" },
];

const TRUCK_STATUSES = [
  { value: "available", label: "Available" },
  { value: "on_job", label: "On Job" },
  { value: "maintenance", label: "Maintenance" },
];

interface TruckForm {
  plate_number: string;
  make: string;
  model: string;
  year: string;
  truck_type: string;
  capacity_tons: string;
  status: string;
  next_service_date: string;
}

export default function FleetPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTruck, setEditTruck] = useState<Truck | null>(null);
  const [viewTruck, setViewTruck] = useState<Truck | null>(null);
  const [deleteTruck, setDeleteTruck] = useState<Truck | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<TruckForm>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.truck_type = typeFilter;
      const res = await fleetApi.list(params);
      setTrucks(toArray<Truck>(res.data));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (t: Truck) => {
    setEditTruck(t);
    setValue("plate_number", t.plate_number);
    setValue("make", t.make);
    setValue("model", t.model);
    setValue("year", String(t.year));
    setValue("truck_type", t.truck_type);
    setValue("capacity_tons", String(t.capacity_tons));
    setValue("status", t.status);
    setValue("next_service_date", t.next_service_date || "");
  };

  const onSubmit = async (data: TruckForm) => {
    const payload = { ...data, year: parseInt(data.year), capacity_tons: parseFloat(data.capacity_tons) };
    try {
      if (editTruck) {
        await fleetApi.update(editTruck.id, payload);
        toast.success("Truck updated!");
        setEditTruck(null);
      } else {
        await fleetApi.create(payload);
        toast.success("Truck registered!");
        setCreateOpen(false);
      }
      reset();
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTruck) return;
    setDeleting(true);
    try {
      await fleetApi.delete(deleteTruck.id);
      toast.success("Truck deleted");
      setDeleteTruck(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // Stats
  const available = trucks.filter(t => t.status === "available").length;
  const onJob = trucks.filter(t => t.status === "on_job").length;
  const maintenance = trucks.filter(t => t.status === "maintenance").length;

  const TruckFormFields = () => (
    <form id="truck-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Plate Number" required placeholder="KCA 123A"
          error={errors.plate_number?.message}
          {...register("plate_number", { required: "Plate number is required" })} />
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">Truck Type <span className="text-red-500">*</span></label>
          <select className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            {...register("truck_type", { required: true })}>
            <option value="">Select type...</option>
            {TRUCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Make" required placeholder="Toyota"
          error={errors.make?.message}
          {...register("make", { required: "Make is required" })} />
        <Field label="Model" required placeholder="Dyna"
          error={errors.model?.message}
          {...register("model", { required: "Model is required" })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Year" type="number" required placeholder="2020"
          {...register("year", { required: "Year is required" })} />
        <Field label="Capacity (tons)" type="number" required placeholder="5"
          {...register("capacity_tons", { required: "Capacity is required" })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">Status</label>
          <select className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            {...register("status")}>
            {TRUCK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <Field label="Next Service Date" type="date"
          {...register("next_service_date")} />
      </div>
    </form>
  );

  const headers = ["Truck", "Type", "Capacity", "Status", "Next Service", "Actions"];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-display">Fleet Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{trucks.length} trucks registered</p>
        </div>
        <Button onClick={() => { reset(); setCreateOpen(true); }} icon={<Plus size={16} />}>
          Register Truck
        </Button>
      </div>

      {/* Fleet stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Available", count: available, color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
          { label: "On Job", count: onJob, color: "bg-blue-50 border-blue-100 text-blue-700" },
          { label: "Maintenance", count: maintenance, color: "bg-orange-50 border-orange-100 text-orange-700" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`bg-white rounded-2xl shadow-card p-4 border ${color.split(" ")[1]}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">{label}</span>
              <TruckIcon size={16} className={color.split(" ")[2]} />
            </div>
            <p className={`text-2xl font-black font-display mt-1 ${color.split(" ")[2]}`}>{count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search plate, make, model..." />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-brand-500">
            <option value="">All Status</option>
            {TRUCK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-brand-500">
            <option value="">All Types</option>
            {TRUCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <Table headers={headers} loading={loading}>
          {trucks.length === 0 ? (
            <tr><td colSpan={6}>
              <EmptyState icon={<TruckIcon size={24} />} title="No trucks found"
                description="Register your first truck to get started."
                action={<Button size="sm" onClick={() => setCreateOpen(true)} icon={<Plus size={14} />}>Register Truck</Button>} />
            </td></tr>
          ) : (
            trucks.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                      <TruckIcon size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t.plate_number}</p>
                      <p className="text-xs text-gray-400">{t.make} {t.model} · {t.year}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 capitalize">{t.truck_type?.replace("_", " ")}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Weight size={12} className="text-gray-400" /> {t.capacity_tons} tons
                  </span>
                </td>
                <td className="px-6 py-4"><Badge status={t.status} /></td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${
                    t.next_service_date && new Date(t.next_service_date) < new Date()
                      ? "text-red-500 font-semibold" : "text-gray-500"
                  } flex items-center gap-1`}>
                    <Calendar size={12} className="text-gray-400" />
                    {formatDate(t.next_service_date)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setViewTruck(t)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"><Eye size={15} /></button>
                    <button onClick={() => openEdit(t)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={15} /></button>
                    <button onClick={() => setDeleteTruck(t)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

      {/* Modals */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Register New Truck" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
          <Button form="truck-form" type="submit" loading={isSubmitting}>Register Truck</Button>
        </>}>
        <TruckFormFields />
      </Modal>

      <Modal open={!!editTruck} onClose={() => { setEditTruck(null); reset(); }} title="Edit Truck" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => { setEditTruck(null); reset(); }}>Cancel</Button>
          <Button form="truck-form" type="submit" loading={isSubmitting}>Save Changes</Button>
        </>}>
        <TruckFormFields />
      </Modal>

      <Modal open={!!viewTruck} onClose={() => setViewTruck(null)} title="Truck Details" size="sm">
        {viewTruck && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                <TruckIcon size={22} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewTruck.plate_number}</h3>
                <p className="text-sm text-gray-500">{viewTruck.make} {viewTruck.model} ({viewTruck.year})</p>
              </div>
              <Badge status={viewTruck.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Type", value: viewTruck.truck_type?.replace("_", " ") },
                { label: "Capacity", value: `${viewTruck.capacity_tons} tons` },
                { label: "Next Service", value: formatDate(viewTruck.next_service_date) },
                { label: "Registered", value: formatDate(viewTruck.created_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-gray-700 capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTruck} onClose={() => setDeleteTruck(null)}
        onConfirm={handleDelete} loading={deleting} title="Delete Truck"
        message={`Delete truck ${deleteTruck?.plate_number}? Cannot delete trucks currently on a job.`}
        confirmLabel="Delete Truck" />
    </DashboardLayout>
  );
}