"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";

export default function MyProfilePage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"resume" | "private" | "security">("private");

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
          {/* Page Header (Profile Snapshot) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-space-xl">
            <div className="flex items-center gap-space-lg">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border-light bg-surface-container shadow-sm shrink-0">
                {currentUser.avatar ? (
                  <img
                    alt="Profile Picture"
                    className="w-full h-full object-cover"
                    src={currentUser.avatar}
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-secondary text-4xl font-bold font-sans">
                    {currentUser.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                  {currentUser.name}
                </h1>
                <p className="font-body-lg text-body-lg text-secondary mt-1">
                  {currentUser.role} • {currentUser.department} Department
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-success-soft text-success-text font-label-sm text-label-sm font-bold border border-success-text/10">
                    {currentUser.status}
                  </span>
                  <span className="text-secondary font-label-sm text-label-sm font-bold">
                    EMP-{currentUser.id.padStart(4, "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border-light mb-space-xl">
            <nav className="flex gap-space-lg">
              <button
                onClick={() => setActiveTab("resume")}
                className={`pb-3 font-label-md text-label-md transition-colors cursor-pointer ${
                  activeTab === "resume"
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-secondary hover:text-primary font-medium"
                }`}
              >
                Resume
              </button>
              <button
                onClick={() => setActiveTab("private")}
                className={`pb-3 font-label-md text-label-md transition-colors cursor-pointer ${
                  activeTab === "private"
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-secondary hover:text-primary font-medium"
                }`}
              >
                Private Info
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`pb-3 font-label-md text-label-md transition-colors cursor-pointer ${
                  activeTab === "security"
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-secondary hover:text-primary font-medium"
                }`}
              >
                Security
              </button>
            </nav>
          </div>

          {/* TAB CONTENT: Private Info */}
          {activeTab === "private" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
              {/* Left Column (Personal & Employment) */}
              <div className="lg:col-span-2 flex flex-col gap-space-lg">
                {/* Personal Information Card */}
                <section className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-space-lg border-b border-border-light pb-space-sm">
                    <span className="material-symbols-outlined text-secondary text-xl">person</span>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">
                      Personal Details
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-space-lg gap-x-space-xl">
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        Date of Birth
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface font-medium">
                        {currentUser.dob}
                      </p>
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        Nationality
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface font-medium">
                        {currentUser.nationality}
                      </p>
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        Marital Status
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface font-medium">
                        {currentUser.maritalStatus}
                      </p>
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        Personal Email
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface font-medium">
                        {currentUser.email}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        Permanent Address
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface leading-relaxed font-medium">
                        {currentUser.address}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Employment Data Card */}
                <section className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-space-lg border-b border-border-light pb-space-sm">
                    <span className="material-symbols-outlined text-secondary text-xl">work</span>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">
                      Employment Record
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-space-lg gap-x-space-xl">
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        Date of Joining (DOJ)
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface font-medium">
                        {currentUser.doj}
                      </p>
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        Employee Code
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface font-semibold">
                        EMP-{currentUser.id.padStart(4, "0")}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column (Financial/Statutory) */}
              <div className="flex flex-col gap-space-lg">
                {/* Financial & Statutory Card */}
                <section className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl h-full shadow-sm">
                  <div className="flex items-center gap-2 mb-space-lg border-b border-border-light pb-space-sm">
                    <span className="material-symbols-outlined text-secondary text-xl">
                      account_balance
                    </span>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">
                      Financial Data
                    </h2>
                  </div>
                  <div className="flex flex-col gap-space-lg">
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        Bank Name
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface font-medium">
                        {currentUser.bankName}
                      </p>
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        Account Number
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface font-mono tracking-tight font-medium">
                        {currentUser.accountNo}
                      </p>
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        Routing / IFSC
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface font-mono tracking-tight font-medium">
                        {currentUser.routingNo}
                      </p>
                    </div>
                    <div className="my-space-sm border-t border-border-light border-dashed"></div>
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        PAN / Tax ID
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface font-mono tracking-tight font-medium">
                        {currentUser.panTaxId}
                      </p>
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                        UAN
                      </label>
                      <p className="font-body-lg text-body-lg text-on-surface font-mono tracking-tight font-medium">
                        {currentUser.uan}
                      </p>
                    </div>
                  </div>
                  {/* Contextual Help Note */}
                  <div className="mt-space-xl bg-surface-container-low p-space-md rounded-lg flex gap-3 shadow-inner">
                    <span className="material-symbols-outlined text-secondary text-lg mt-0.5">
                      info
                    </span>
                    <p className="font-body-md text-body-md text-secondary leading-snug">
                      To update these details, please submit a formal request through the HR Helpdesk portal.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Resume */}
          {activeTab === "resume" && (
            <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl text-center py-20 shadow-sm">
              <span className="material-symbols-outlined text-secondary text-5xl mb-4 opacity-60">
                description
              </span>
              <h3 className="font-headline-md text-primary font-bold mb-2">Resume &amp; CV</h3>
              <p className="text-secondary max-w-sm mx-auto mb-6">
                View or replace your employment resume attachments on file.
              </p>
              <button
                onClick={() => alert("Resume download started...")}
                className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded hover:bg-primary transition-colors cursor-pointer font-bold"
              >
                Download CV_Jenkins.pdf
              </button>
            </div>
          )}

          {/* TAB CONTENT: Security */}
          {activeTab === "security" && (
            <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl shadow-sm max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-space-lg border-b border-border-light pb-space-sm">
                <span className="material-symbols-outlined text-secondary text-xl">security</span>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">
                  Security Settings
                </h2>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Security settings updated successfully!");
                }}
                className="space-y-space-md"
              >
                <div>
                  <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                    placeholder="••••••••"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded hover:bg-primary transition-colors font-bold cursor-pointer"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
