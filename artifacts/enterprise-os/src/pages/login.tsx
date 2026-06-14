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
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const modules = ["HR", "CRM", "ERP", "Finance", "Projects", "AI"];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin();

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.access_token, data.user as any);
          toast({ title: "Welcome back", description: "Successfully signed in." });
          navigate("/dashboard");
        },
        onError: () => {
          toast({ title: "Sign in failed", description: "Invalid email or password.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#080c14] flex-col justify-between p-14 relative overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-[-120px] left-[-80px] w-[560px] h-[560px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 65%)" }}
        />
        <div className="absolute bottom-[-60px] right-[-60px] w-[360px] h-[360px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 65%)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden"
              style={{ backgroundImage: 'url(/logo.png)', backgroundSize: '300%', backgroundPosition: 'center 8%' }}
            />
            <div>
              <p className="text-white font-bold text-lg tracking-tight leading-none">Enterprise OS</p>
              <p className="text-white/30 text-[10px] tracking-widest uppercase mt-0.5">Unified Platform</p>
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-indigo-300 font-medium">Enterprise-ready</span>
            </div>
            <h2 className="text-5xl font-bold text-white leading-[1.1] tracking-tight mb-4">
              One platform.<br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Every operation.
              </span>
            </h2>
            <p className="text-white/40 text-base max-w-xs">
              Built for enterprise teams who move fast.
            </p>
          </div>

          {/* Module tags */}
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => (
              <span key={m} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/50">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom line */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <p className="text-white/25 text-xs tracking-wide">All systems operational</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50/60 p-8">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-10">
            <div className="w-9 h-9 rounded-xl flex-shrink-0"
              style={{ backgroundImage: 'url(/logo.png)', backgroundSize: '300%', backgroundPosition: 'center 8%' }}
            />
            <span className="font-bold text-xl text-gray-900">Enterprise OS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1.5">Sign in to your workspace</h1>
            <p className="text-gray-500 text-sm">Enter your credentials to continue</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Work email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@company.com"
                        type="email"
                        autoComplete="email"
                        {...field}
                        className="h-11 bg-white border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all rounded-lg text-sm text-gray-900 placeholder:text-gray-400"
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
                    <div className="flex items-center justify-between mb-1.5">
                      <FormLabel className="text-gray-700 font-medium text-sm mb-0">Password</FormLabel>
                      <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...field}
                          className="h-11 bg-white border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 pr-10 transition-all rounded-lg text-sm text-gray-900 placeholder:text-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 mt-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Secured with enterprise-grade encryption</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            © {new Date().getFullYear()} Enterprise OS · <span className="hover:text-gray-600 cursor-pointer transition-colors">Privacy</span> · <span className="hover:text-gray-600 cursor-pointer transition-colors">Terms</span>
          </p>
        </div>
      </div>
    </div>
  );
}
