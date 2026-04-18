"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { reportsApi, jobsApi } from "@/lib/api";
import { StatCard, SkeletonCard, Badge, Button, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DashboardSummary, Job } from "@/types";
import {
  Users, Truck, Briefcase, FileText, AlertTriangle, TrendingUp,
  CheckCircle, Clock, ArrowRight, Zap, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import Link from "next/link";
import toast from "react-hot-toast";

const JOB_STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  assigned: "#3b82f6",
  in_progress: "#6366f1",
  completed: "#10b981",
  cancelled: "#ef4444",
};

const toArray = (data: any): Job[] =>
  Array.isArray(data) ? data : data?.jobs ?? data?.results ?? data?.data ?? [];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [unassigned, setUnassigned] = useState<Job[]>([]);
  const [jobReport, setJobReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, unassignedRes, jobReportRes] = await Promise.all([
        reportsApi.dashboard(30),
        jobsApi.unassigned(),
        reportsApi.jobs(30),
      ]);
      setSummary(dashRes.data);
      setUnassigned(toArray(unassignedRes.data));
      setJobReport(jobReportRes.data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const jobPieData = summary
    ? Object.entries({
        Pending: summary.jobs.pending,
        Assigned: summary.jobs.assigned,
        "In Progress": summary.jobs.in_progress,
        Completed: summary.jobs.completed,
      }).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
    : [];

  const completionData = jobReport?.daily_completions?.slice(-14).map((d: any) => ({
    date: formatDate(d.day, "dd MMM"),
    jobs: d.count,
  })) || [];

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-display">Operations Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time overview of your moving operations</p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} icon={<RefreshCw size={14} />}>
          Refresh
        </Button>
      </div>

      {/* Alert banner if unassigned jobs */}
      {!loading && unassigned.length > 0 && (
        <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 animate-fade-in">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              {unassigned.length} job{unassigned.length > 1 ? "s" : ""} need attention
            </p>
            <p className="text-xs text-amber-600">Pending jobs with no staff or truck assigned</p>
          </div>
          <Link href="/jobs?status=pending">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0">
              View Jobs
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : summary ? (
          <>
            <StatCard
              label="Active Staff"
              value={summary.staff.total_active}
              icon={<Users size={20} />}
              sub={`${summary.staff.available} available · ${summary.staff.on_job} on job`}
              color="blue"
            />
            <StatCard
              label="Fleet Total"
              value={summary.fleet.total}
              icon={<Truck size={20} />}
              sub={`${summary.fleet.available} available · ${summary.fleet.on_job} on job`}
              color="indigo"
            />
            <StatCard
              label="Total Jobs"
              value={summary.jobs.total}
              icon={<Briefcase size={20} />}
              sub={`${summary.jobs.in_progress} in progress · ${summary.jobs.completed} completed`}
              color="green"
            />
            <StatCard
              label="Unassigned"
              value={summary.jobs.unassigned_needing_attention}
              icon={<AlertTriangle size={20} />}
              sub="Need immediate attention"
              color="amber"
            />
            <StatCard
              label="Total Invoiced"
              value={formatCurrency(summary.billing.total_invoiced)}
              icon={<FileText size={20} />}
              sub={`${summary.billing.unpaid_invoices} unpaid invoices`}
              color="blue"
            />
            <StatCard
              label="Collected"
              value={formatCurrency(summary.billing.total_collected)}
              icon={<TrendingUp size={20} />}
              sub="Total payments received"
              color="green"
            />
            <StatCard
              label="Outstanding"
              value={formatCurrency(summary.billing.total_outstanding)}
              icon={<Clock size={20} />}
              sub="Pending collection"
              color="amber"
            />
            <StatCard
              label="Customers"
              value={summary.customers.total}
              icon={<Users size={20} />}
              sub="Total registered"
              color="indigo"
            />
          </>
        ) : null}
      </div>

      {/* Charts + Unassigned */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 font-display">Job Completions</h3>
              <p className="text-xs text-gray-400">Last 14 days</p>
            </div>
          </div>
          {completionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={completionData}>
                <defs>
                  <linearGradient id="jobGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="jobs" stroke="#1d4ed8" strokeWidth={2} fill="url(#jobGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No completion data for this period
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 font-display">Job Status</h3>
            <p className="text-xs text-gray-400">Current distribution</p>
          </div>
          {jobPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={jobPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {jobPieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={Object.values(JOB_STATUS_COLORS)[index % Object.keys(JOB_STATUS_COLORS).length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Unassigned jobs table */}
      <div className="bg-white rounded-2xl shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 font-display">Unassigned Jobs</h3>
              <p className="text-xs text-gray-400">Jobs pending staff & truck allocation</p>
            </div>
          </div>
          <Link href="/jobs">
            <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />}>
              View All
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : unassigned.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={24} />}
            title="All jobs assigned!"
            description="No pending jobs require attention."
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {unassigned.slice(0, 6).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Briefcase size={16} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-400">
                      {job.customer?.first_name} {job.customer?.last_name} · {formatDate(job.scheduled_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={job.status} />
                  <Link href={`/jobs/${job.id}`}>
                    <Button size="sm" variant="outline" className="text-xs py-1.5 px-3">
                      <Zap size={12} />
                      Auto-allocate
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}