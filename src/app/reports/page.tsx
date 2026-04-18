"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { reportsApi } from "@/lib/api";
import { StatCard, PageLoader, RatingStars, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { BarChart3, Truck, Users, FileText, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";

const COLORS = ["#1d4ed8", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899"];

export default function ReportsPage() {
  const [days, setDays] = useState(30);
  const [jobReport, setJobReport] = useState<any>(null);
  const [billingReport, setBillingReport] = useState<any>(null);
  const [staffReport, setStaffReport] = useState<any>(null);
  const [fleetReport, setFleetReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jobs" | "billing" | "staff" | "fleet">("jobs");

  const load = async () => {
    setLoading(true);
    try {
      const [jr, br, sr, fr] = await Promise.all([
        reportsApi.jobs(days),
        reportsApi.billing(days),
        reportsApi.staffPerformance(),
        reportsApi.fleet(),
      ]);
      setJobReport(jr.data);
      setBillingReport(br.data);
      setStaffReport(sr.data);
      setFleetReport(fr.data);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);

  const tabs = [
    { key: "jobs", label: "Jobs", icon: BarChart3 },
    { key: "billing", label: "Billing", icon: FileText },
    { key: "staff", label: "Staff Performance", icon: Users },
    { key: "fleet", label: "Fleet", icon: Truck },
  ];

  if (loading) return <DashboardLayout><PageLoader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-display">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Operational insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-brand-500">
            {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>Last {d} days</option>)}
          </select>
          <Button variant="secondary" size="sm" onClick={load} icon={<RefreshCw size={14} />}>Refresh</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl shadow-card p-1.5 mb-5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === key ? "bg-brand-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Jobs Report */}
      {activeTab === "jobs" && jobReport && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Jobs" value={jobReport.total_jobs_in_window} icon={<BarChart3 size={20} />} color="blue" />
            <StatCard label="Avg Duration" value={jobReport.average_job_duration_hours ? `${jobReport.average_job_duration_hours}h` : "—"}
              icon={<TrendingUp size={20} />} color="green" />
            <StatCard label="Unassigned" value={jobReport.unassigned_jobs?.length || 0} icon={<AlertCircle size={20} />} color="amber" />
            <StatCard label="Completed" value={jobReport.status_breakdown?.find((s: any) => s.status === "completed")?.count || 0}
              icon={<BarChart3 size={20} />} color="indigo" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Status breakdown */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-bold text-gray-900 font-display mb-4">Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={jobReport.status_breakdown?.map((s: any) => ({
                  name: s.status?.replace("_", " "),
                  count: s.count,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Move size distribution */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-bold text-gray-900 font-display mb-4">Move Size Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={jobReport.move_size_distribution?.map((s: any) => ({
                    name: s.move_size?.replace(/_/g, " "),
                    value: s.count,
                  }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3}>
                    {jobReport.move_size_distribution?.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unassigned jobs list */}
          {jobReport.unassigned_jobs?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-bold text-gray-900 font-display mb-4 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" /> Unassigned Jobs
              </h3>
              <div className="space-y-2">
                {jobReport.unassigned_jobs.map((j: any) => (
                  <div key={j.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{j.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(j.scheduled_date)} · {j.move_size?.replace(/_/g, " ")}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Unassigned</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Billing Report */}
      {activeTab === "billing" && billingReport && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Invoiced" value={formatCurrency(billingReport.revenue_totals?.total_invoiced)}
              icon={<FileText size={20} />} color="blue" />
            <StatCard label="Collected" value={formatCurrency(billingReport.revenue_totals?.total_collected)}
              icon={<TrendingUp size={20} />} color="green" />
            <StatCard label="Outstanding" value={formatCurrency(billingReport.revenue_totals?.total_outstanding)}
              icon={<AlertCircle size={20} />} color="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Monthly trend */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-bold text-gray-900 font-display mb-4">Monthly Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={billingReport.monthly_revenue_trend?.reverse().map((m: any) => ({
                  month: m.month ? new Date(m.month).toLocaleDateString("en", { month: "short" }) : "—",
                  invoiced: parseFloat(m.invoiced || 0),
                  collected: parseFloat(m.collected || 0),
                }))}>
                  <defs>
                    <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }}
                    formatter={(val: number) => formatCurrency(val)} />
                  <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#1d4ed8" strokeWidth={2} fill="url(#invGrad)" />
                  <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" strokeWidth={2} fill="none" strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Payment method breakdown */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-bold text-gray-900 font-display mb-4">Payment Methods</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={billingReport.payment_method_breakdown?.map((m: any) => ({
                  method: m.method?.replace("_", " "),
                  total: parseFloat(m.total || 0),
                  count: m.count,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="method" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }}
                    formatter={(val: number) => formatCurrency(val)} />
                  <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unpaid invoices */}
          {billingReport.top_unpaid_invoices?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-bold text-gray-900 font-display mb-4">Top Unpaid Invoices</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Customer", "Job", "Total", "Balance", "Status", "Due"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {billingReport.top_unpaid_invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{inv.job__customer__first_name} {inv.job__customer__last_name}</td>
                        <td className="px-4 py-3 text-gray-600">{inv.job__title}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(inv.total_amount)}</td>
                        <td className="px-4 py-3 text-red-500 font-semibold">{formatCurrency(inv.balance_due)}</td>
                        <td className="px-4 py-3"><Badge status={inv.payment_status} /></td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(inv.due_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Staff Performance */}
      {activeTab === "staff" && staffReport && (
        <div className="space-y-5">
          <StatCard label="Total Active Staff" value={staffReport.total_staff}
            icon={<Users size={20} />} color="blue" sub="Ranked by recommendation score" />
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 font-display">Staff Leaderboard</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {staffReport.staff?.map((s: any, idx: number) => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                    idx === 0 ? "bg-amber-400 text-white" :
                    idx === 1 ? "bg-gray-300 text-gray-700" :
                    idx === 2 ? "bg-amber-700 text-white" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {s.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.email}</p>
                  </div>
                  <div className="text-center px-3">
                    <p className="text-xs text-gray-400">Jobs Done</p>
                    <p className="text-sm font-bold text-gray-900">{s.jobs_completed}</p>
                  </div>
                  <div className="text-center px-3">
                    <p className="text-xs text-gray-400">Supervised</p>
                    <p className="text-sm font-bold text-gray-900">{s.jobs_supervised}</p>
                  </div>
                  <div>
                    <RatingStars rating={s.average_rating} />
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-bold ${s.is_available ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.is_available ? "Available" : "Unavailable"}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Score</p>
                    <p className="text-sm font-black text-brand-600">{(s.recommendation_score * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fleet Report */}
      {activeTab === "fleet" && fleetReport && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Trucks" value={fleetReport.total_trucks} icon={<Truck size={20} />} color="blue" />
            <StatCard label="Utilization" value={`${fleetReport.utilization_rate_percent}%`} icon={<TrendingUp size={20} />} color="green" />
            <StatCard label="On Job Now" value={fleetReport.status_breakdown?.find((s: any) => s.status === "on_job")?.count || 0}
              icon={<Truck size={20} />} color="indigo" />
            <StatCard label="Due Service" value={fleetReport.due_for_service?.length || 0} icon={<AlertCircle size={20} />} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-bold text-gray-900 font-display mb-4">Fleet Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={fleetReport.status_breakdown?.map((s: any) => ({ name: s.status, value: s.count }))}
                    cx="50%" cy="50%" outerRadius={75} dataKey="value" paddingAngle={3}>
                    {fleetReport.status_breakdown?.map((_: any, i: number) => (
                      <Cell key={i} fill={["#10b981", "#1d4ed8", "#f59e0b"][i % 3]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Due for service */}
            {fleetReport.due_for_service?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="font-bold text-gray-900 font-display mb-4 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500" /> Due for Service
                </h3>
                <div className="space-y-2">
                  {fleetReport.due_for_service.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t.plate_number}</p>
                        <p className="text-xs text-gray-500">{t.make} {t.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-red-500 font-semibold">{formatDate(t.next_service_date)}</p>
                        <Badge status={t.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
