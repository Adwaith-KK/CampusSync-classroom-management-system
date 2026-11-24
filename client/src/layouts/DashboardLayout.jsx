import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { Megaphone } from 'lucide-react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main shell */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Content Area */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {/* Global Broadcast Announcement Banner */}
          <div className="bg-campus-600 text-white px-4 py-2 sm:px-6 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2 truncate">
              <Megaphone className="w-4 h-4 flex-shrink-0 animate-bounce" />
              <span className="font-semibold tracking-wide uppercase text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                Announcement
              </span>
              <span className="truncate">
                Welcome to CampusSync — Centralized Smart Resource & Classroom Availability System
              </span>
            </div>
            <span className="hidden md:inline-block text-[11px] text-campus-100">
              MCA Academic Project 2026
            </span>
          </div>

          {/* Page View Body */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
