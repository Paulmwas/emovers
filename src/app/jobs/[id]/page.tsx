"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { jobsApi, billingApi, usersApi, fleetApi } from "@/lib/api";
import { Button, Badge, Modal, ConfirmDialog, PageLoader } from "@/components/ui";
import { formatDate, formatCurrency, getErrorMessage } from "@/lib/utils";
import { Job, User, Truck, Invoice } from "@/types";
import toast from "react-hot-toast";
import {
  ArrowLeft, MapPin, Calendar, Zap, Users, Truck as TruckIcon,
  FileText, Play, CheckCircle, XCircle, Star, Plus, Trash2,
  Clock, Package, Phone, Mail
} from "lucide-react";
import Link from "next/link";

const toArray = <T,>(data: any): T[] =>
  Array.isArray(data) ? data : data?.results ?? data?.data ?? [];

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [availableStaff, setAvailableStaff] = useState<User[]>([]);
  const [availableTrucks, setAvailableTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignStaffOpen, setAssignStaffOpen] = useState(false);
  const [assignTrucksOpen, setAssignTrucksOpen] = useState(false);
  const [generateInvoiceOpen, setGenerateInvoiceOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [selectedTrucks, setSelectedTrucks] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [numMovers, setNumMovers] = useState(3);
  const [numTrucks, setNumTrucks] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const jobRes = await jobsApi.detail(Number(id));
      setJob(jobRes.data);
      try {
        const invRes = await billingApi.invoices({ job: id });
        const invList = toArray<Invoice>(invRes.data);
        if (invList.length > 0) setInvoice(invList[0]);
      } catch { /* no invoice yet */ }
    } catch {
      toast.error("Failed to load job");
      router.push("/jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const openAssignStaff = async () => {
    try {
      const res = await usersApi.availableStaff();
      setAvailableStaff(toArray<User>(res.data));
      setSelectedStaff(job?.assignments?.map((a) => a.staff.id) || []);
      setAssignStaffOpen(true);
    } catch { toast.error("Failed to load available staff"); }
  };

  const openAssignTrucks = async () => {
    try {
      const res = await fleetApi.available();
      setAvailableTrucks(toArray<Truck>(res.data));
      setSelectedTrucks(job?.job_trucks?.map((t) => t.truck.id) || []);
      setAssignTrucksOpen(true);
    } catch { toast.error("Failed to load available trucks"); }
  };

  const handleAssignStaff = async () => {
    setProcessing(true);
    try {
      const res = await jobsApi.assignStaff(Number(id), selectedStaff);
      setJob(res.data.job);
      toast.success("Staff assigned successfully!");
      setAssignStaffOpen(false);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setProcessing(false); }
  };

  const handleAssignTrucks = async () => {
    setProcessing(true);
    try {
      const res = await jobsApi.assignTrucks(Number(id), selectedTrucks);
      setJob(res.data.job);
      toast.success("Trucks assigned successfully!");
      setAssignTrucksOpen(false);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setProcessing(false); }
  };

  const handleAutoAllocate = async () => {
    setProcessing(true);
    try {
      const res = await jobsApi.autoAllocate(Number(id), { num_movers: numMovers, num_trucks: numTrucks });
      setJob(res.data.job);
      toast.success("Auto-allocated successfully!");
      setAllocateOpen(false);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setProcessing(false); }
  };

  const handleGenerateInvoice = async () => {
    setProcessing(true);
    try {
      const res = await billingApi.generateInvoice({
        job_id: Number(id),
        due_date: dueDate || undefined,
        notes: invoiceNotes,
      });
      setInvoice(res.data);
      toast.success("Invoice generated successfully!");
      setGenerateInvoiceOpen(false);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setProcessing(false); }
  };

  const handleTransition = async (action: "start" | "complete" | "cancel") => {
    const labels = { start: "started", complete: "completed", cancel: "cancelled" };
    try {
      const res = await jobsApi.transition(Number(id), action);
      setJob(res.data.job);
      toast.success(`Job ${labels[action]}!`);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading) return <DashboardLayout><PageLoader /></DashboardLayout>;
  if (!job) return null;

  const isEditable = !["completed", "cancelled"].includes(job.status);

  return (
    <DashboardLayout>
      {/* Back + header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/jobs">
          <button className="p-2 rounded-xl hover:bg-white border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 font-display">{job.title}</h1>
          <p className="text-gray-500 text-sm">Job #{job.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={job.status} />
          {isEditable && (
            <Button size="sm" variant="secondary" onClick={() => setAllocateOpen(true)} icon={<Zap size={14} />}>
              Auto-Allocate
            </Button>
          )}
          {(job.status === "pending" || job.status === "assigned") && (
            <Button size="sm" onClick={() => handleTransition("start")} icon={<Play size={14} />}>
              Start Job
            </Button>
          )}
          {job.status === "in_progress" && (
            <Button size="sm" onClick={() => handleTransition("complete")} icon={<CheckCircle size={14} />} className="bg-emerald-600 hover:bg-emerald-700">
              Complete
            </Button>
          )}
          {isEditable && (
            <Button size="sm" variant="danger" onClick={() => handleTransition("cancel")} icon={<XCircle size={14} />}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Job details */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-base font-bold text-gray-900 font-display mb-4 flex items-center gap-2">
              <Package size={18} className="text-brand-600" /> Job Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {job.customer?.first_name} {job.customer?.last_name}
                  </p>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Phone size={10} /> {job.customer?.phone}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Mail size={10} /> {job.customer?.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Move Size</p>
                <p className="text-sm font-semibold text-gray-900">{job.move_size?.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Pickup</p>
                <p className="text-sm text-gray-700 flex items-start gap-1">
                  <MapPin size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                  {job.pickup_address}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Drop-off</p>
                <p className="text-sm text-gray-700 flex items-start gap-1">
                  <MapPin size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  {job.dropoff_address}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Scheduled</p>
                <p className="text-sm text-gray-700 flex items-center gap-1">
                  <Calendar size={13} className="text-brand-400" />
                  {formatDate(job.scheduled_date)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Distance</p>
                <p className="text-sm text-gray-700">{job.estimated_distance_km} km</p>
              </div>
              {job.started_at && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Started</p>
                  <p className="text-sm text-gray-700">{formatDate(job.started_at, "dd MMM yyyy HH:mm")}</p>
                </div>
              )}
              {job.completed_at && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Completed</p>
                  <p className="text-sm text-gray-700">{formatDate(job.completed_at, "dd MMM yyyy HH:mm")}</p>
                </div>
              )}
            </div>
            {job.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-600">{job.notes}</p>
              </div>
            )}
          </div>

          {/* Staff assignments */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 font-display flex items-center gap-2">
                <Users size={18} className="text-brand-600" />
                Staff Assigned ({job.assignments?.length || 0})
              </h2>
              {isEditable && (
                <Button size="sm" variant="secondary" onClick={openAssignStaff} icon={<Plus size={13} />}>
                  Assign Staff
                </Button>
              )}
            </div>
            {job.assignments?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No staff assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {job.assignments?.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {a.staff.first_name?.[0]}{a.staff.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{a.staff.first_name} {a.staff.last_name}</p>
                        <p className="text-xs text-gray-500">{a.staff.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      a.role === "supervisor" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {a.role === "supervisor" ? "⭐ Supervisor" : "Mover"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Truck assignments */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 font-display flex items-center gap-2">
                <TruckIcon size={18} className="text-brand-600" />
                Trucks Assigned ({job.job_trucks?.length || 0})
              </h2>
              {isEditable && (
                <Button size="sm" variant="secondary" onClick={openAssignTrucks} icon={<Plus size={13} />}>
                  Assign Trucks
                </Button>
              )}
            </div>
            {job.job_trucks?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <TruckIcon size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No trucks assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {job.job_trucks?.map((jt) => (
                  <div key={jt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                        <TruckIcon size={14} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{jt.truck.plate_number}</p>
                        <p className="text-xs text-gray-500">{jt.truck.make} {jt.truck.model} · {jt.truck.truck_type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{jt.truck.capacity_tons} tons</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — Invoice */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 font-display flex items-center gap-2">
                <FileText size={18} className="text-brand-600" /> Invoice
              </h2>
              <Button size="sm" variant="secondary" onClick={() => setGenerateInvoiceOpen(true)} icon={<Plus size={13} />}>
                {invoice ? "Regenerate" : "Generate"}
              </Button>
            </div>

            {invoice ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Badge status={invoice.payment_status} />
                  <span className="text-xs text-gray-400">#{invoice.id}</span>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {[
                    { label: "Base charge", val: invoice.base_charge },
                    { label: "Distance charge", val: invoice.distance_charge },
                    { label: "Staff charge", val: invoice.staff_charge },
                    { label: "Truck charge", val: invoice.truck_charge },
                    { label: "VAT (16%)", val: invoice.vat_amount },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between text-xs text-gray-500">
                      <span>{label}</span>
                      <span>{formatCurrency(val)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-emerald-600">
                    <span>Paid</span>
                    <span>{formatCurrency(invoice.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-red-500">
                    <span>Balance Due</span>
                    <span>{formatCurrency(invoice.balance_due)}</span>
                  </div>
                </div>
                <Link href={`/billing/${invoice.id}`}>
                  <Button size="sm" variant="outline" className="w-full mt-2">View Full Invoice</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No invoice generated yet</p>
                <p className="text-xs mt-1">Generate after assigning staff & trucks</p>
              </div>
            )}
          </div>

          {/* Quick info */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-base font-bold text-gray-900 font-display mb-3">Quick Links</h2>
            <div className="space-y-2">
              <Link href={`/reviews?job=${job.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 py-1.5 transition-colors">
                <Star size={14} /> View Reviews for this Job
              </Link>
              <Link href={`/customers/${job.customer?.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 py-1.5 transition-colors">
                <Users size={14} /> Customer Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-allocate Modal */}
      <Modal open={allocateOpen} onClose={() => setAllocateOpen(false)} title="Auto-Allocate Resources" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setAllocateOpen(false)}>Cancel</Button>
          <Button onClick={handleAutoAllocate} loading={processing} icon={<Zap size={14} />}>Allocate</Button>
        </>}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Best-rated available staff and trucks will be automatically assigned.</p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Movers</label>
            <input type="number" min={1} max={20} value={numMovers} onChange={(e) => setNumMovers(+e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Trucks</label>
            <input type="number" min={1} max={5} value={numTrucks} onChange={(e) => setNumTrucks(+e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
        </div>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal open={assignStaffOpen} onClose={() => setAssignStaffOpen(false)} title="Assign Staff" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setAssignStaffOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignStaff} loading={processing}>Save Assignment</Button>
        </>}
      >
        <div className="space-y-2">
          <p className="text-xs text-gray-500 mb-3">Select staff members to assign to this job:</p>
          {availableStaff.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No available staff found</p>
          ) : (
            availableStaff.map((s) => (
              <label key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" checked={selectedStaff.includes(s.id)}
                  onChange={(e) => setSelectedStaff(prev => e.target.checked ? [...prev, s.id] : prev.filter(id => id !== s.id))}
                  className="w-4 h-4 text-brand-600 rounded" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>
                {s.staff_profile && (
                  <span className="text-xs text-amber-600 font-semibold">
                    ★ {parseFloat(String(s.staff_profile.average_rating)).toFixed(1)}
                  </span>
                )}
              </label>
            ))
          )}
        </div>
      </Modal>

      {/* Assign Trucks Modal */}
      <Modal open={assignTrucksOpen} onClose={() => setAssignTrucksOpen(false)} title="Assign Trucks" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setAssignTrucksOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignTrucks} loading={processing}>Save Assignment</Button>
        </>}
      >
        <div className="space-y-2">
          {availableTrucks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No available trucks found</p>
          ) : (
            availableTrucks.map((t) => (
              <label key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" checked={selectedTrucks.includes(t.id)}
                  onChange={(e) => setSelectedTrucks(prev => e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id))}
                  className="w-4 h-4 text-brand-600 rounded" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{t.plate_number}</p>
                  <p className="text-xs text-gray-500">{t.make} {t.model} · {t.truck_type} · {t.capacity_tons} tons</p>
                </div>
                <Badge status={t.status} />
              </label>
            ))
          )}
        </div>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal open={generateInvoiceOpen} onClose={() => setGenerateInvoiceOpen(false)} title="Generate Invoice" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setGenerateInvoiceOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerateInvoice} loading={processing} icon={<FileText size={14} />}>Generate</Button>
        </>}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Invoice will be calculated based on assigned staff, trucks, and distance.</p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date (optional)</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea rows={3} value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)}
              placeholder="Payment instructions, references..."
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}