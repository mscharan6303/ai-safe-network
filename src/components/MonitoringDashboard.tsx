import { useState } from 'react';
import LiveTrafficFeed from './LiveTrafficFeed';
import AlertsPanel from './AlertsPanel';
import StatsOverview from './StatsOverview';
import ESP32StatusPanel from './ESP32StatusPanel';

const MonitoringDashboard = () => {
  return (
    <section className="relative w-full animation-fade-in" id="monitor">
      
      {/* 1. Top Stats Row */}
      <div className="mb-6">
        <StatsOverview />
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Traffic (Takes 2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-900">
                   <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                   Live Traffic Feed
                </h3>
             </div>
             <div className="p-0">
                <LiveTrafficFeed />
             </div>
          </div>
        </div>

        {/* Right Column: Alerts & Hardware Status (Takes 1/3 width) */}
        <div className="space-y-6">
          
          {/* Hardware Status */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-0 overflow-hidden">
             <ESP32StatusPanel />
          </div>

          {/* Security Alerts */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden h-[500px] flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-900">
                   <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                   Security Alerts
                </h3>
             </div>
             <div className="flex-1 overflow-hidden">
                <AlertsPanel />
             </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default MonitoringDashboard;
