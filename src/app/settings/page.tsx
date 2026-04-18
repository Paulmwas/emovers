"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { authApi, usersApi } from "@/lib/api";
import { Button, Field, Modal, ConfirmDialog, Table, Badge, Avatar } from "@/components/ui";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { User } from "@/types";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  User as UserIcon, Lock, Users, Plus, Edit, UserX, Shield, Eye, EyeOff
} from "lucide-react";

const toArray = <T,>(data: any): T[] =>
  Array.isArray(data) ? data : data?.results ?? data?.data ?? data?.users ?? [];

interface ProfileForm { first_name: string; last_name: string; phone: string; }
interface PasswordForm { old_password: string; new_password: string; confirm_password: string; }
interface RegisterForm {
  email: string; first_name: string; last_name: string;
  phone: string; password: string; role: string;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const isAdmin = user?.role === "mover-admin";
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "users">("profile");
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const profileForm = useForm<ProfileForm>({
    defaultValues: { first_name: user?.first_name || "", last_name: user?.last_name || "", phone: user?.phone || "" },
  });
  const passwordForm = useForm<PasswordForm>();
  const registerForm = useForm<RegisterForm>();

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await usersApi.list();
      setUsers(toArray<User>(res.data));
    } catch { toast.error("Failed to load users"); }
    finally { setUsersLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "users" && isAdmin) loadUsers();
  }, [activeTab]);

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      const res = await authApi.updateMe(data);
      updateUser(res.data);
      toast.success("Profile updated!");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (data.new_password !== data.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await authApi.changePassword(data.old_password, data.new_password);
      toast.success("Password changed successfully!");
      passwordForm.reset();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
    try {
      await authApi.register(data);
      toast.success(`${data.role === "mover-admin" ? "Admin" : "Staff"} account created for ${data.email}`);
      setRegisterOpen(false);
      registerForm.reset();
      loadUsers();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDeactivate = async () => {
    if (!deactivateUser) return;
    setDeactivating(true);
    try {
      await usersApi.deactivate(deactivateUser.id);
      toast.success(`${deactivateUser.first_name} deactivated`);
      setDeactivateUser(null);
      loadUsers();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivating(false); }
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: UserIcon },
    { key: "password", label: "Password", icon: Lock },
    ...(isAdmin ? [{ key: "users", label: "User Management", icon: Users }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 font-display">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account and system settings</p>
      </div>

      <div className="flex gap-5">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-card p-2 space-y-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === key ? "bg-brand-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                }`}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-bold text-gray-900 font-display mb-6">Profile Information</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-800 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-xl font-black">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{user?.first_name} {user?.last_name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield size={12} className="text-brand-500" />
                    <span className="text-xs font-semibold text-brand-600 capitalize">
                      {user?.role === "mover-admin" ? "Administrator" : "Staff Member"}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" {...profileForm.register("first_name", { required: true })} />
                  <Field label="Last Name" {...profileForm.register("last_name", { required: true })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input value={user?.email} disabled
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed" />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <Field label="Phone" type="tel" {...profileForm.register("phone")} />
                <Button type="submit" loading={profileForm.formState.isSubmitting} icon={<UserIcon size={14} />}>
                  Save Profile
                </Button>
              </form>
            </div>
          )}

          {/* Password */}
          {activeTab === "password" && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-bold text-gray-900 font-display mb-6">Change Password</h2>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Current Password</label>
                  <div className="relative">
                    <input type={showOld ? "text" : "password"}
                      className="w-full px-3.5 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      {...passwordForm.register("old_password", { required: true })} />
                    <button type="button" onClick={() => setShowOld(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">New Password</label>
                  <div className="relative">
                    <input type={showNew ? "text" : "password"}
                      className="w-full px-3.5 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      {...passwordForm.register("new_password", { required: true, minLength: { value: 8, message: "Min 8 characters" } })} />
                    <button type="button" onClick={() => setShowNew(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.new_password && (
                    <p className="text-xs text-red-500">{passwordForm.formState.errors.new_password.message}</p>
                  )}
                </div>
                <Field label="Confirm New Password" type="password"
                  {...passwordForm.register("confirm_password", { required: true })} />
                <Button type="submit" loading={passwordForm.formState.isSubmitting} icon={<Lock size={14} />}>
                  Change Password
                </Button>
              </form>
            </div>
          )}

          {/* User Management */}
          {activeTab === "users" && isAdmin && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 font-display">User Management</h2>
                  <Button size="sm" onClick={() => setRegisterOpen(true)} icon={<Plus size={14} />}>
                    Add User
                  </Button>
                </div>
                <Table headers={["User", "Role", "Status", "Joined", "Actions"]} loading={usersLoading}>
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${u.first_name} ${u.last_name}`} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{u.first_name} {u.last_name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          u.role === "mover-admin" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {u.role === "mover-admin" ? "Admin" : "Staff"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={u.is_active ? "available" : "cancelled"} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{formatDate(u.date_joined)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {u.id !== Number(user?.id) && u.is_active && (
                          <button onClick={() => setDeactivateUser(u)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Deactivate">
                            <UserX size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Register User Modal */}
      <Modal open={registerOpen} onClose={() => { setRegisterOpen(false); registerForm.reset(); }}
        title="Create New User" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => { setRegisterOpen(false); registerForm.reset(); }}>Cancel</Button>
          <Button form="register-form" type="submit" loading={registerForm.formState.isSubmitting}>Create User</Button>
        </>}>
        <form id="register-form" onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" required placeholder="John"
              {...registerForm.register("first_name", { required: true })} />
            <Field label="Last Name" required placeholder="Doe"
              {...registerForm.register("last_name", { required: true })} />
          </div>
          <Field label="Email" type="email" required placeholder="user@emovers.co.ke"
            {...registerForm.register("email", { required: true })} />
          <Field label="Phone" type="tel" required placeholder="+254 700 000 000"
            {...registerForm.register("phone", { required: true })} />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Role <span className="text-red-500">*</span></label>
            <select className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              {...registerForm.register("role", { required: true })}>
              <option value="">Select role...</option>
              <option value="mover-admin">Administrator</option>
              <option value="mover-staff">Staff Member</option>
            </select>
          </div>
          <Field label="Temporary Password" type="password" required placeholder="Min 8 characters"
            {...registerForm.register("password", { required: true, minLength: { value: 8, message: "Min 8 chars" } })} />
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-700">
              The user will receive their credentials and should change their password on first login.
            </p>
          </div>
        </form>
      </Modal>

      {/* Deactivate confirm */}
      <ConfirmDialog open={!!deactivateUser} onClose={() => setDeactivateUser(null)}
        onConfirm={handleDeactivate} loading={deactivating}
        title="Deactivate User"
        message={`Deactivate ${deactivateUser?.first_name} ${deactivateUser?.last_name}? They won't be able to log in until reactivated.`}
        confirmLabel="Deactivate" variant="warning" />
    </DashboardLayout>
  );
}