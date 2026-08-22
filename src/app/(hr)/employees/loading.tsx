import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function EmployeesLoading() {
  return (
    <DashboardLayout>
      <main className="flex-1 w-full animate-pulse">
        <div className="max-w-5xl mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-surface-container-high rounded-lg"></div>
              <div className="h-4 w-32 bg-surface-container-high rounded-lg"></div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="h-10 w-full md:w-72 bg-surface-container-high rounded-lg"></div>
              <div className="h-10 w-32 bg-surface-container-high rounded-lg"></div>
            </div>
          </div>

          {/* Desktop Table Skeleton (Hidden on mobile) */}
          <div className="hidden lg:block bg-surface-container-lowest border border-border-light rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-border-light bg-surface-container-low/50 h-12"></div>
            <div className="divide-y divide-border-light/50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-space-md flex items-center justify-between gap-4 h-16">
                  <div className="flex items-center gap-3 w-1/3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0"></div>
                    <div className="space-y-1.5 w-full">
                      <div className="h-4 w-3/4 bg-surface-container-high rounded"></div>
                      <div className="h-3 w-1/2 bg-surface-container-high rounded"></div>
                    </div>
                  </div>
                  <div className="h-5 w-20 bg-surface-container-high rounded w-1/6"></div>
                  <div className="h-4 w-24 bg-surface-container-high rounded w-1/6"></div>
                  <div className="h-5 w-16 bg-surface-container-high rounded w-1/6"></div>
                  <div className="h-4 w-16 bg-surface-container-high rounded w-1/12 font-mono"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Grid Skeleton (Hidden on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md lg:hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md flex flex-col items-center text-center space-y-3 h-48 justify-center shadow-sm animate-pulse"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container-high"></div>
                <div className="h-4 w-28 bg-surface-container-high rounded"></div>
                <div className="h-3.5 w-20 bg-surface-container-high rounded"></div>
                <div className="h-4 w-16 bg-surface-container-high rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
