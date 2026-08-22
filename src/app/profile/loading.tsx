import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function ProfileLoading() {
  return (
    <DashboardLayout>
      <main className="flex-1 w-full animate-pulse">
        <div className="max-w-5xl mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-space-xl">
            <div className="flex items-center gap-space-lg">
              <div className="w-24 h-24 rounded-full bg-surface-container-high shrink-0"></div>
              <div className="space-y-2">
                <div className="h-6 w-48 bg-surface-container-high rounded"></div>
                <div className="h-4 w-32 bg-surface-container-high rounded"></div>
                <div className="flex gap-2 pt-1">
                  <div className="h-5 w-16 bg-surface-container-high rounded"></div>
                  <div className="h-5 w-24 bg-surface-container-high rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation Skeleton */}
          <div className="border-b border-border-light mb-space-xl">
            <div className="flex gap-space-lg pb-3">
              <div className="h-5 w-20 bg-surface-container-high rounded"></div>
              <div className="h-5 w-24 bg-surface-container-high rounded"></div>
              <div className="h-5 w-20 bg-surface-container-high rounded"></div>
              <div className="h-5 w-20 bg-surface-container-high rounded"></div>
            </div>
          </div>

          {/* Form Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
            <div className="lg:col-span-2 space-y-space-lg">
              <div className="h-48 bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl"></div>
              <div className="h-32 bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl"></div>
            </div>
            <div className="h-96 bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl"></div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
