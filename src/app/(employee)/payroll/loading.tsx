import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function PayrollLoading() {
  return (
    <DashboardLayout>
      <main className="flex-1 w-full animate-pulse">
        <div className="max-w-3xl mx-auto px-gutter-mobile md:px-0 py-space-xl space-y-space-xl">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-surface-container-high rounded"></div>
              <div className="h-7 w-48 bg-surface-container-high rounded"></div>
            </div>
            <div className="h-7 w-20 bg-surface-container-high rounded-full"></div>
          </div>

          {/* Net Pay Hero Skeleton */}
          <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-8 shadow-sm space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-surface-container-high rounded"></div>
              <div className="h-12 w-64 bg-surface-container-high rounded"></div>
              <div className="h-4 w-40 bg-surface-container-high rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border-light">
              <div className="space-y-1">
                <div className="h-3 w-20 bg-surface-container-high rounded"></div>
                <div className="h-5 w-28 bg-surface-container-high rounded"></div>
              </div>
              <div className="space-y-1">
                <div className="h-3 w-24 bg-surface-container-high rounded"></div>
                <div className="h-5 w-28 bg-surface-container-high rounded"></div>
              </div>
            </div>
          </div>

          {/* Components Skeleton */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
            <div className="px-space-md py-4 bg-surface-container-low/50 border-b border-border-light">
              <div className="h-6 w-36 bg-surface-container-high rounded"></div>
            </div>
            <div className="divide-y divide-border-light p-4 space-y-4">
              <div className="flex justify-between">
                <div className="h-5 w-24 bg-surface-container-high rounded"></div>
                <div className="h-5 w-16 bg-surface-container-high rounded"></div>
              </div>
              <div className="flex justify-between pt-4">
                <div className="h-5 w-32 bg-surface-container-high rounded"></div>
                <div className="h-5 w-16 bg-surface-container-high rounded"></div>
              </div>
              <div className="flex justify-between pt-4">
                <div className="h-5 w-28 bg-surface-container-high rounded"></div>
                <div className="h-5 w-16 bg-surface-container-high rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
