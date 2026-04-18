"use client";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { customersApi } from "@/lib/api";
import {
  Button, Table, Modal, ConfirmDialog, Field, TextareaField,
  SearchBar, EmptyState, Badge, Avatar
} from "@/components/ui";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { Customer } from "@/types";
import toast from "react-hot-toast";
import { Plus, Users, Edit, Trash2, Eye, Phone, Mail, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";

const toArray = <T,>(data: any): T[] =>
  Array.isArray(data) ? data : data?.results ?? data?.data ?? data?.customers ?? [];

interface CustomerForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CustomerForm>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const res = await customersApi.list(params);
      setCustomers(toArray<Customer>(res.data));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setValue("first_name", c.first_name);
    setValue("last_name", c.last_name);
    setValue("email", c.email);
    setValue("phone", c.phone);
    setValue("address", c.address);
  };

  const onSubmit = async (data: CustomerForm) => {
    try {
      if (editCustomer) {
        await customersApi.update(editCustomer.id, data);
        toast.success("Customer updated successfully!");
        setEditCustomer(null);
      } else {
        await customersApi.create(data);
        toast.success("Customer created successfully!");
        setCreateOpen(false);
      }
      reset();
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteCustomer) return;
    setDeleting(true);
    try {
      await customersApi.delete(deleteCustomer.id);
      toast.success("Customer deleted successfully");
      setDeleteCustomer(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const CustomerForm = () => (
    <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" required placeholder="John"
          error={errors.first_name?.message}
          {...register("first_name", { required: "First name is required" })} />
        <Field label="Last Name" required placeholder="Doe"
          error={errors.last_name?.message}
          {...register("last_name", { required: "Last name is required" })} />
      </div>
      <Field label="Email Address" type="email" placeholder="john@example.com"
        error={errors.email?.message}
        {...register("email", { pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" } })} />
      <Field label="Phone Number" required placeholder="+254 700 000 000"
        error={errors.phone?.message}
        {...register("phone", { required: "Phone is required" })} />
      <TextareaField label="Address" placeholder="123 Main Street, Nairobi"
        {...register("address")} />
    </form>
  );

  const headers = ["Customer", "Contact", "Address", "Registered", "Actions"];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-display">Customers</h1>
          <p className="text-gray-500 text-sm mt-0.5">{customers.length} registered customers</p>
        </div>
        <Button onClick={() => { reset(); setCreateOpen(true); }} icon={<Plus size={16} />}>
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone..." />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <Table headers={headers} loading={loading} skeletonCols={5}>
          {customers.length === 0 ? (
            <tr><td colSpan={5}>
              <EmptyState icon={<Users size={24} />} title="No customers found"
                description="Start by adding your first customer."
                action={<Button size="sm" onClick={() => setCreateOpen(true)} icon={<Plus size={14} />}>Add Customer</Button>} />
            </td></tr>
          ) : (
            customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={`${c.first_name} ${c.last_name}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-gray-400">ID #{c.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-0.5">
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <Mail size={12} className="text-gray-400" />{c.email}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <Phone size={12} className="text-gray-400" />{c.phone}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 flex items-start gap-1.5 max-w-[200px]">
                    <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{c.address || "—"}</span>
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-500">{formatDate(c.created_at)}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setViewCustomer(c)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => openEdit(c)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => setDeleteCustomer(c)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Add New Customer" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
          <Button form="customer-form" type="submit" loading={isSubmitting}>Create Customer</Button>
        </>}>
        <CustomerForm />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editCustomer} onClose={() => { setEditCustomer(null); reset(); }} title="Edit Customer" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => { setEditCustomer(null); reset(); }}>Cancel</Button>
          <Button form="customer-form" type="submit" loading={isSubmitting}>Save Changes</Button>
        </>}>
        <CustomerForm />
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewCustomer} onClose={() => setViewCustomer(null)} title="Customer Details" size="md">
        {viewCustomer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <Avatar name={`${viewCustomer.first_name} ${viewCustomer.last_name}`} size="lg" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewCustomer.first_name} {viewCustomer.last_name}</h3>
                <p className="text-sm text-gray-500">Customer ID #{viewCustomer.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Email", value: viewCustomer.email, icon: <Mail size={14} /> },
                { label: "Phone", value: viewCustomer.phone, icon: <Phone size={14} /> },
                { label: "Registered", value: formatDate(viewCustomer.created_at), icon: null },
                { label: "Address", value: viewCustomer.address || "—", icon: <MapPin size={14} /> },
              ].map(({ label, value, icon }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm text-gray-700 flex items-center gap-1.5">
                    {icon && <span className="text-gray-400">{icon}</span>}{value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog open={!!deleteCustomer} onClose={() => setDeleteCustomer(null)}
        onConfirm={handleDelete} loading={deleting} title="Delete Customer"
        message={`Delete ${deleteCustomer?.first_name} ${deleteCustomer?.last_name}? This cannot be undone and will fail if they have active jobs.`}
        confirmLabel="Delete Customer" />
    </DashboardLayout>
  );
}