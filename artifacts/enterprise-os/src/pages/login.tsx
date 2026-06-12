import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LayoutDashboard, Shield, Zap, Globe } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const features = [
  { icon: LayoutDashboard, text: "Unified enterprise dashboard" },
  { icon: Shield, text: "Role-based access control" },
  { icon: Zap, text: "AI-powered workflow automation" },
  { icon: Globe, text: "Multi-module business management" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@enterpriseos.com", password: "admin123" },
  });

  const loginMutation = useLogin();

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.access_token);
          toast({ title: "Welcome back", description: "Successfully logged in." });
          navigate("/dashboard");
        },
        onError: () => {
          toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f1117] flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
        {/* Gradient orb */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)" }}
        />
        <div className="absolute bottom-[-50px] right-[-50px] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Enterprise OS</span>
          </div>
          <p className="text-gray-500 text-sm ml-12">Unified Enterprise Operating System</p>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Your complete<br />
              <span className="text-indigo-400">enterprise platform</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed max-w-sm">
              Manage HR, CRM, ERP, Finance, and Projects from one unified command center.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-gray-300 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
            <p className="text-gray-300 text-sm italic leading-relaxed mb-3">
              "Enterprise OS transformed how we manage operations across all departments — incredible unified experience."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                SC
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Sarah Chen</p>
                <p className="text-gray-500 text-xs">VP Engineering, TechCorp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50/50 p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Enterprise OS</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sign in</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your credentials to access your workspace</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@company.com"
                        {...field}
                        className="h-11 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-gray-700 font-medium text-sm">Password</FormLabel>
                      <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                        Forgot password?
                      </button>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="h-11 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 pr-10 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm shadow-indigo-600/20 transition-all"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : "Sign in"}
              </Button>
            </form>
          </Form>

          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-indigo-800 mb-2">Demo credentials</p>
            <div className="space-y-1">
              <p className="text-xs text-indigo-700"><span className="font-medium">Email:</span> admin@enterpriseos.com</p>
              <p className="text-xs text-indigo-700"><span className="font-medium">Password:</span> admin123</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            © 2026 Enterprise OS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
