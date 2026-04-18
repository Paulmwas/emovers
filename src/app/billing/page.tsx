"use client";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { billingApi } from "@/lib/api";
import { Button, Table, Modal, Badge, SearchBar, EmptyState, StatCard } from "@/components/ui";
import { formatDate, formatCurrency, getErrorMessage } from "@/lib/utils";
import { Invoice } from "@/types";
import toast from "react-hot-toast";
import {
  FileText, DollarSign, Clock, CreditCard, Eye, TrendingUp,
  AlertCircle, CheckCircle2
} from "lucide-react";
import Link from "next/link";

const toArray = <T,>(data: any): T[] =>
  Array.isArray(data) ? data : data?.results ?? data?.data ?? data?.invoices ?? [];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
];

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("mpesa");
  const [payNotes, setPayNotes] = useState("");
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.payment_status = statusFilter;
      const res = await billingApi.invoices(params);
      setInvoices(toArray<Invoice>(res.data));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openPayModal = (inv: Invoice) => {
    setPayInvoice(inv);
    setPayAmount(inv.balance_due);
    setPayMethod("mpesa");
    setPayNotes("");
  };

  const handlePayment = async () => {
    if (!payInvoice) return;
    setPaying(true);
    try {
      const res = await billingApi.pay(payInvoice.id, {
        amount: parseFloat(payAmount),
        method: payMethod,
        notes: payNotes,
      });
      toast.success(`Payment of ${formatCurrency(payAmount)} recorded! Transaction: ${res.data.payment.transaction_id}`);
      setPayInvoice(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  // Summary stats
  const totalInvoiced = invoices.reduce((s, i) => s + parseFloat(i.total_amount || "0"), 0);
  const totalCollected = invoices.reduce((s, i) => s + parseFloat(i.amount_paid || "0"), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + parseFloat(i.balance_due || "0"), 0);
  const unpaidCount = invoices.filter(i => i.payment_status === "unpaid").length;

  const headers = ["Invoice", "Job / Customer", "Total", "Paid", "Balance", "Status", "Due Date", "Actions"];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-display">Billing & Invoices</h1>
          <p className="text-gray-500 text-sm mt-0.5">{invoices.length} invoices total</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Invoiced" value={formatCurrency(totalInvoiced)}
          icon={<FileText size={20} />} color="blue" />
        <StatCard label="Total Collected" value={formatCurrency(totalCollected)}
          icon={<TrendingUp size={20} />} color="green" />
        <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)}
          icon={<Clock size={20} />} color="amber" />
        <StatCard label="Unpaid Invoices" value={unpaidCount}
          icon={<AlertCircle size={20} />} color="red" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-5">
        <div className="flex gap-3">
          {["", "unpaid", "partial", "paid"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                statusFilter === s
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <Table headers={headers} loading={loading}>
          {invoices.length === 0 ? (
            <tr><td colSpan={8}>
              <EmptyState icon={<FileText size={24} />} title="No invoices found"
                description="Generate invoices from job detail pages." />
            </td></tr>
          ) : (
            invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText size={14} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">INV-{String(inv.id).padStart(4, "0")}</p>
                      <p className="text-xs text-gray-400">{formatDate(inv.created_at)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{inv.job?.title}</p>
                  <p className="text-xs text-gray-400">
                    {inv.job?.customer?.first_name} {inv.job?.customer?.last_name}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(inv.total_amount)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-emerald-600">{formatCurrency(inv.amount_paid)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${parseFloat(inv.balance_due) > 0 ? "text-red-500" : "text-gray-500"}`}>
                    {formatCurrency(inv.balance_due)}
                  </span>
                </td>
                <td className="px-6 py-4"><Badge status={inv.payment_status} /></td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${
                    inv.due_date && new Date(inv.due_date) < new Date() && inv.payment_status !== "paid"
                      ? "text-red-500 font-semibold" : "text-gray-500"
                  }`}>{formatDate(inv.due_date)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/billing/${inv.id}`}>
                      <button className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Eye size={15} />
                      </button>
                    </Link>
                    {inv.payment_status !== "paid" && (
                      <button onClick={() => openPayModal(inv)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Record payment">
                        <CreditCard size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

      {/* Payment Modal */}
      <Modal open={!!payInvoice} onClose={() => setPayInvoice(null)} title="Record Payment" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setPayInvoice(null)}>Cancel</Button>
          <Button onClick={handlePayment} loading={paying} icon={<CheckCircle2 size={14} />}>
            Record Payment
          </Button>
        </>}>
        {payInvoice && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice</span>
                <span className="font-semibold">INV-{String(payInvoice.id).padStart(4, "0")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-semibold">{formatCurrency(payInvoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Already Paid</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(payInvoice.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                <span className="text-gray-700 font-semibold">Balance Due</span>
                <span className="font-bold text-red-500">{formatCurrency(payInvoice.balance_due)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Payment Amount (KES) <span className="text-red-500">*</span>
              </label>
              <input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(({ value, label }) => (
                  <button key={value} type="button"
                    onClick={() => setPayMethod(value)}
                    className={`py-2 px-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                      payMethod === value
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
              <textarea rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Reference number, notes..."
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}