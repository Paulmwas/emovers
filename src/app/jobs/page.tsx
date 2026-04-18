"use client";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { jobsApi, customersApi } from "@/lib/api";
import {
  Button, Badge, Table, Modal, ConfirmDialog, Field,
  TextareaField, SearchBar, EmptyState, Avatar
} from "@/components/ui";
import { formatDate, getErrorMessage, STATUS_LABELS } from "@/lib/utils";
import { Job, Customer } from "@/types";
import toast from "react-hot-toast";
import {
  Plus, Briefcase, MapPin, Calendar, Zap, Users, Truck as TruckIcon,
  Eye, Trash2, Play, CheckCircle, XCircle
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

const toArray = <T,>(data: any): T[] =>
  Array.isArray(data) ? data : data?.results ?? data?.data ?? data?.jobs ?? [];

const MOVE_SIZES = [
  { value: "studio", label: "Studio" },
  { value: "one_bedroom", label: "1 Bedroom" },
  { value: "two_bedroom", label: "2 Bedrooms" },
  { value: "three_bedroom", label: "3 Bedrooms" },
  { value: "office_small", label: "Office (Small)" },
  { value: "office_large", label: "Office (Large)" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface JobForm {
  title: string;
  customer: string;
  move_size: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_date: string;
  estimated_distance_km: string;
  notes: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteJob, setDeleteJob] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [allocateJob, setAllocateJob] = useState<Job | null>(null);
  const [allocating, setAllocating] = useState(false);
  const [numMovers, setNumMovers] = useState(3);
  const [numTrucks, setNumTrucks] = useState(1);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<JobForm>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [jobsRes, custRes] = await Promise.all([
        jobsApi.list(params),
        customersApi.list(),
      ]);
      setJobs(toArray<Job>(jobsRes.data));
      setCustomers(toArray<Customer>(custRes.data));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const onCreateSubmit = async (data: JobForm) => {
    try {
      await jobsApi.create({
        ...data,
        customer: parseInt(data.customer),
        estimated_distance_km: parseFloat(data.estimated_distance_km),
      });
      toast.success("Job created successfully!");
      setCreateOpen(false);
      reset();
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteJob) return;
    setDeleting(true);
    try {
      await jobsApi.delete(deleteJob.id);
      toast.success("Job deleted successfully");
      setDeleteJob(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleAutoAllocate = async () => {
    if (!allocateJob) return;
    setAllocating(true);
    try {
      await jobsApi.autoAllocate(allocateJob.id, { num_movers: numMovers, num_trucks: numTrucks });
      toast.success("Job auto-allocated successfully! Staff and trucks assigned.");
      setAllocateJob(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAllocating(false);
    }
  };

  const handleTransition = async (job: Job, action: "start" | "complete" | "cancel") => {
    const labels = { start: "started", complete: "completed", cancel: "cancelled" };
    try {
      await jobsApi.transition(job.id, action);
      toast.success(`Job ${labels[action]}!`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const headers = ["Job", "Customer", "Move Size", "Scheduled", "Status", "Assigned", "Actions"];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-display">Jobs</h1>
          <p className="text-gray-500 text-sm mt-0.5">{jobs.length} total jobs</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>
          New Job
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search jobs, customers, addresses..." />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <Table headers={headers} loading={loading} skeletonCols={7}>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={<Briefcase size={24} />}
                  title="No jobs found"
                  description="Create your first job or adjust your filters."
                  action={
                    <Button size="sm" onClick={() => setCreateOpen(true)} icon={<Plus size={14} />}>
                      New Job
                    </Button>
                  }
                />
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase size={14} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin size={10} />
                        {job.pickup_address?.substring(0, 25)}...
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={`${job.customer?.first_name} ${job.customer?.last_name}`} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {job.customer?.first_name} {job.customer?.last_name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{STATUS_LABELS[job.move_size] || job.move_size}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar size={13} className="text-gray-400" />
                    {formatDate(job.scheduled_date)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge status={job.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {job.assignments?.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <TruckIcon size={11} /> {job.job_trucks?.length || 0}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/jobs/${job.id}`}>
                      <button className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Eye size={15} />
                      </button>
                    </Link>
                    {job.status === "pending" && (
                      <button
                        onClick={() => setAllocateJob(job)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Auto-allocate"
                      >
                        <Zap size={15} />
                      </button>
                    )}
                    {(job.status === "pending" || job.status === "assigned") && (
                      <button
                        onClick={() => handleTransition(job, "start")}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Start job"
                      >
                        <Play size={15} />
                      </button>
                    )}
                    {job.status === "in_progress" && (
                      <button
                        onClick={() => handleTransition(job, "complete")}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Complete job"
                      >
                        <CheckCircle size={15} />
                      </button>
                    )}
                    {!["completed", "cancelled"].includes(job.status) && (
                      <button
                        onClick={() => handleTransition(job, "cancel")}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel job"
                      >
                        <XCircle size={15} />
                      </button>
                    )}
                    {!["in_progress", "completed"].includes(job.status) && (
                      <button
                        onClick={() => setDeleteJob(job)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); reset(); }}
        title="Create New Job"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
            <Button form="job-form" type="submit" loading={isSubmitting}>Create Job</Button>
          </>
        }
      >
        <form id="job-form" onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <Field label="Job Title" required placeholder="e.g. 3-Bedroom Move - Westlands to Karen"
            error={errors.title?.message}
            {...register("title", { required: "Title is required" })} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Customer <span className="text-red-500">*</span></label>
              <select
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                {...register("customer", { required: "Customer is required" })}
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
              {errors.customer && <p className="text-xs text-red-500">{errors.customer.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Move Size <span className="text-red-500">*</span></label>
              <select
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                {...register("move_size", { required: "Move size is required" })}
              >
                <option value="">Select size...</option>
                {MOVE_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {errors.move_size && <p className="text-xs text-red-500">{errors.move_size.message}</p>}
            </div>
          </div>

          <Field label="Pickup Address" required placeholder="e.g. 123 Westlands Road, Nairobi"
            error={errors.pickup_address?.message}
            {...register("pickup_address", { required: "Pickup address is required" })} />

          <Field label="Drop-off Address" required placeholder="e.g. 456 Karen Blvd, Nairobi"
            error={errors.dropoff_address?.message}
            {...register("dropoff_address", { required: "Drop-off address is required" })} />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Scheduled Date" type="date" required
              error={errors.scheduled_date?.message}
              {...register("scheduled_date", { required: "Date is required" })} />
            <Field label="Distance (km)" type="number" required placeholder="e.g. 25"
              error={errors.estimated_distance_km?.message}
              {...register("estimated_distance_km", { required: "Distance is required", min: { value: 1, message: "Min 1 km" } })} />
          </div>

          <TextareaField label="Notes" placeholder="Any special instructions..."
            {...register("notes")} />
        </form>
      </Modal>

      {/* Auto-allocate Modal */}
      <Modal
        open={!!allocateJob}
        onClose={() => setAllocateJob(null)}
        title="Auto-Allocate Job"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAllocateJob(null)}>Cancel</Button>
            <Button onClick={handleAutoAllocate} loading={allocating} icon={<Zap size={14} />}>
              Allocate Now
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-sm font-semibold text-amber-800">Job: {allocateJob?.title}</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Staff will be selected by highest recommendation score
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Movers</label>
            <input
              type="number" min={1} max={20} value={numMovers}
              onChange={(e) => setNumMovers(parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Trucks</label>
            <input
              type="number" min={1} max={5} value={numTrucks}
              onChange={(e) => setNumTrucks(parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteJob}
        onClose={() => setDeleteJob(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Job"
        message={`Are you sure you want to delete "${deleteJob?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Job"
      />
    </DashboardLayout>
  );
}