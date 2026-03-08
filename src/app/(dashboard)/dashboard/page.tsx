"use client";

import { FileText, Clock, DollarSign, AlertTriangle } from "lucide-react";

const metrics = [
  { label: "ACTIVE SOWS", value: "0", icon: FileText },
  { label: "AVG DAYS TO SIGN", value: "0", icon: Clock },
  { label: "PIPELINE VALUE", value: "$0", icon: DollarSign },
  { label: "AT RISK", value: "0", icon: AlertTriangle },
];

export default function DashboardPage() {
  return (
    <div>
      {/* Hero banner */}
      <div className="relative rounded-[3rem] bg-[#0A0A0B] h-56 mb-10 overflow-hidden flex items-center px-12">
        {/* Animated orbs */}
        <div className="absolute top-[-200px] right-[-200px] w-[800px] h-[800px] rounded-full bg-[#9333EA]/20 blur-[120px] animate-float-slow pointer-events-none" />
        <div className="absolute bottom-[-200px] left-[-150px] w-[600px] h-[600px] rounded-full bg-[#4F46E5]/30 blur-[100px] animate-float-medium pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-5xl font-semibold text-white tracking-tighter">Welcome to EngagementFlow</h1>
          <p className="text-gray-400 mt-3 text-lg">Manage your SOWs, track engagement, and close deals faster.</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <div
            key={metric.label}
            className="reveal bg-white rounded-[2rem] p-10 shadow-sm border border-gray-200/50"
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-[#F3F0FF]">
              <metric.icon size={22} className="text-[#9333EA]" />
            </div>
            <p className="text-[2.75rem] font-semibold tracking-tighter text-[#9333EA] mb-1">
              {metric.value}
            </p>
            <p className="text-sm font-medium tracking-wider text-gray-500 uppercase">
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
