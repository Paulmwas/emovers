"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { authService } from "@/lib/services";
import { useAuthStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";
import { Eye, EyeOff, Zap, Truck, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await authService.login(data.email, data.password);
      const { user, tokens } = res;
      setAuth(user, tokens);
      toast.success(`Welcome back, ${user.first_name}!`);
      router.push("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const stats = [
    { icon: Truck, label: "Fleet Management", color: "text-amber-400" },
    { icon: Users, label: "Staff Scheduling", color: "text-emerald-400" },
    { icon: Briefcase, label: "Job Automation", color: "text-blue-400" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-brand-900 p-10 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-800 rounded-full opacity-50" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-brand-800 rounded-full opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-800 rounded-full opacity-20" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-yellow rounded-xl flex items-center justify-center">
            <Zap size={22} className="text-brand-900" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl font-display leading-none">E-Movers</h1>
            <p className="text-brand-400 text-xs">Management System</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h2 className="text-white text-4xl font-black leading-tight font-display mb-4">
            Moving &<br />
            <span className="text-accent-yellow">Storage</span><br />
            Made Simple
          </h2>
          <p className="text-brand-300 text-base leading-relaxed max-w-xs">
            A powerful backend system for automating your moving company operations — from job scheduling to billing.
          </p>

          <div className="mt-8 space-y-3">
            {stats.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-800 rounded-lg flex items-center justify-center">
                  <Icon size={16} className={color} />
                </div>
                <span className="text-brand-200 text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { num: "240+", label: "Jobs Managed" },
            { num: "6M+", label: "KES Processed" },
            { num: "15+", label: "Staff Managed" },
          ].map(({ num, label }) => (
            <div key={label} className="bg-brand-800 rounded-xl p-3 text-center">
              <p className="text-accent-yellow text-xl font-black font-display">{num}</p>
              <p className="text-brand-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <h1 className="font-black text-xl font-display text-gray-900">E-Movers</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 font-display">Sign In</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the system</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="you@emovers.co.ke"
                  className={`w-full px-4 py-3 text-sm border rounded-xl bg-gray-50 focus:bg-white transition-all focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
                    errors.email ? "border-red-400" : "border-gray-200"
                  }`}
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" },
                  })}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 pr-11 text-sm border rounded-xl bg-gray-50 focus:bg-white transition-all focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
                      errors.password ? "border-red-400" : "border-gray-200"
                    }`}
                    {...register("password", { required: "Password is required" })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full py-3 text-base"
                size="lg"
              >
                Sign In
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-bold text-blue-700 mb-2">Demo Credentials</p>
              <div className="space-y-1">
                <p className="text-xs text-blue-600">
                  <span className="font-semibold">Admin:</span> admin@emovers.co.ke / Admin1234!
                </p>
                <p className="text-xs text-blue-600">
                  <span className="font-semibold">Staff:</span> staff01@emovers.co.ke / Staff1234!
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} E-Movers. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
