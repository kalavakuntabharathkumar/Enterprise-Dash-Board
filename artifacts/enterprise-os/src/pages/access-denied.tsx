import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldOff, ArrowLeft, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#080c14] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
          <ShieldOff className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
          You don't have permission to view this page.
        </p>
        {user && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
            Signed in as <span className="font-semibold text-gray-600 dark:text-gray-300">{user.name}</span>{" "}
            <span className="bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded text-[10px] font-medium capitalize">{user.role}</span>
          </p>
        )}

        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/20 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
