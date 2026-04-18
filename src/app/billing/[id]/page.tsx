"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { billingApi } from "@/lib/api";
import { Button, Badge, Modal, PageLoader } from "@/components/ui";
import { formatDate, formatCurrency, getErrorMessage } from "@/lib/utils";
import { Invoice } from "@/types";
import toast from "react-hot-toast";
import { ArrowLeft, CreditCard, CheckCircle2, FileText, Receipt } from "lucide-react";
import Link from "next/link";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
];

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("mpesa");
  const [payNotes, setPayNotes] = useState("");
  const [paying, setPaying] = useState(false);

  const load = async () => {
    try {
      const res = await billingApi.invoiceDetail(Number(id));
      setInvoice(res.data);
      setPayAmount(res.data.balance_due);
    } catch {
      toast.error("Invoice not found");
      router.push("/billing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handlePayment = async () => {
    if (!invoice) return;
    setPaying(true);
    try {
      const res = await billingApi.pay(invoice.id, {
        amount: parseFloat(payAmount),
        method: payMethod,
        notes: payNotes,
      });
      toast.success(`Payment recorded! ID: ${res.data.payment.transaction_id}`);
      setPayOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <DashboardLayout><PageLoader /></DashboardLayout>;
  if (!invoice) return null;

  const isPaid = invoice.payment_status === "paid";

  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/billing">
          <button className="p-2 rounded-xl hover:bg-white border border-gray-200 text-gray-500 transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 font-display">
            INV-{String(invoice.id).padStart(4, "0")}
          </h1>
          <p className="text-gray-500 text-sm">Generated {formatDate(invoice.created_at)}</p>
        </div>
        <Badge status={invoice.payment_status} />
        {!isPaid && (
          <Button onClick={() => setPayOpen(true)} icon={<CreditCard size={14} />}>
            Record Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Invoice breakdown */}
        <div className="lg:col-span-2 space-y-5">
          {/* Job info */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="font-bold text-gray-900 font-display mb-4 flex items-center gap-2">
              <FileText size={18} className="text-brand-600" /> Invoice Details
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Job</p>
                <Link href={`/jobs/${invoice.job?.id}`}
                  className="text-sm font-semibold text-brand-600 hover:underline">
                  {invoice.job?.title}
                </Link>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                <p className="text-sm font-semibold text-gray-900">
                  {invoice.job?.customer?.first_name} {invoice.job?.customer?.last_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                <p className="text-sm text-gray-700">{formatDate(invoice.due_date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Distance</p>
                <p className="text-sm text-gray-700">{invoice.job?.estimated_distance_km} km</p>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Cost Breakdown</h3>
              {[
                { label: "Base Charge", value: invoice.base_charge },
                { label: `Distance Charge (${invoice.job?.estimated_distance_km} km × KES 100)`, value: invoice.distance_charge },
                { label: `Staff Charge (${invoice.job?.assignments?.length || 0} staff × KES 500)`, value: invoice.staff_charge },
                { label: `Truck Charge (${invoice.job?.job_trucks?.length || 0} trucks × KES 1,500)`, value: invoice.truck_charge },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(value)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (16%)</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoice.vat_amount)}</span>
              </div>
              <div className="border-t border-gray-300 pt-3 flex justify-between text-base font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Payment history */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="font-bold text-gray-900 font-display mb-4 flex items-center gap-2">
              <Receipt size={18} className="text-brand-600" /> Payment History
            </h2>
            {invoice.payments?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CreditCard size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No payments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoice.payments?.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-gray-400">{p.transaction_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-600 capitalize">{p.method?.replace("_", " ")}</p>
                      <p className="text-xs text-gray-400">{formatDate(p.payment_date, "dd MMM yyyy HH:mm")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="font-bold text-gray-900 font-display mb-4">Payment Summary</h2>
            <div className="space-y-4">
              {[
                { label: "Total Invoice", value: formatCurrency(invoice.total_amount), cls: "text-gray-900 font-bold text-lg" },
                { label: "Amount Paid", value: formatCurrency(invoice.amount_paid), cls: "text-emerald-600 font-semibold" },
                { label: "Balance Due", value: formatCurrency(invoice.balance_due), cls: `font-bold text-lg ${parseFloat(invoice.balance_due) > 0 ? "text-red-500" : "text-emerald-600"}` },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className={`text-sm ${cls}`}>{value}</span>
                </div>
              ))}
            </div>
            {isPaid ? (
              <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-emerald-700 text-sm font-semibold">
                <CheckCircle2 size={16} /> Fully Paid
              </div>
            ) : (
              <Button onClick={() => setPayOpen(true)} className="w-full mt-4" icon={<CreditCard size={14} />}>
                Record Payment
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record Payment" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button onClick={handlePayment} loading={paying} icon={<CheckCircle2 size={14} />}>Confirm Payment</Button>
        </>}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (KES)</label>
            <input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setPayMethod(value)}
                  className={`py-2 px-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                    payMethod === value ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"
                  }`}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Reference, notes..."
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
