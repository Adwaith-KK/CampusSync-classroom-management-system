import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, DoorOpen, CalendarDays, Building2, 
  BookmarkCheck, BarChart3, History, Users, Bell, UserCircle,
  CheckSquare, BookOpen, X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role;
  const prefix = `/${role}`;

  const mainLinks = [
    { title: 'Dashboard',              path: `${prefix}/dashboard`,      icon: LayoutDashboard, roles: ['student','faculty','hod','coordinator'] },
    { title: 'Classroom Availability', path: `${prefix}/classrooms`,     icon: DoorOpen,        roles: ['student','faculty','hod','coordinator'] },
    { title: 'Official Timetable',     path: `${prefix}/timetable`,      icon: CalendarDays,    roles: ['student','faculty','hod','coordinator'] },
    { title: 'Campus Facilities',      path: `${prefix}/facilities`,     icon: Building2,       roles: ['student','faculty','hod','coordinator'] },
    { title: 'My Bookings',            path: `${prefix}/bookings`,       icon: BookmarkCheck,   roles: ['faculty','hod','coordinator'] },
    { title: 'Notifications',          path: `${prefix}/notifications`,  icon: Bell,            roles: ['student','faculty','hod','coordinator'] },
    { title: 'My Profile',             path: `${prefix}/profile`,        icon: UserCircle,      roles: ['student','faculty','hod','coordinator'] },
  ];

  const managementLinks = [
    { title: 'Booking Approvals',    path: `${prefix}/manage/bookings`,    icon: CheckSquare,    roles: ['hod','coordinator'] },
    { title: 'Manage Classrooms',    path: `${prefix}/manage/classrooms`,  icon: DoorOpen,       roles: ['hod','coordinator'] },
    { title: 'Manage Timetable',     path: `${prefix}/manage/timetable`,   icon: BookOpen,       roles: ['hod','coordinator'] },
    { title: 'Manage Facilities',    path: `${prefix}/manage/facilities`,  icon: Building2,      roles: ['coordinator'] },
    { title: 'User Management',      path: `${prefix}/manage/users`,       icon: Users,          roles: ['hod','coordinator'] },
    { title: 'Analytics & Trends',   path: `${prefix}/analytics`,          icon: BarChart3,      roles: ['hod','coordinator'] },
    { title: 'Audit Trail',          path: `${prefix}/audit-logs`,         icon: History,        roles: ['hod','coordinator'] },
  ];

  const filteredMain = mainLinks.filter(l => l.roles.includes(role));
  const filteredMgmt = managementLinks.filter(l => l.roles.includes(role));

  const LinkItem = ({ item }) => {
    const Icon = item.icon;
    return (
      <NavLink
        to={item.path}
        onClick={onClose}
        end={item.path.endsWith('/dashboard')}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            isActive
              ? 'bg-campus-50 text-campus-700 shadow-sm border border-campus-200/50'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`
        }
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{item.title}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } pt-16 flex flex-col`}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-end px-4 py-2">
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {filteredMain.map(item => <LinkItem key={item.path} item={item} />)}

          {filteredMgmt.length > 0 && (
            <>
              <div className="px-3 pt-4 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Management
              </div>
              {filteredMgmt.map(item => <LinkItem key={item.path} item={item} />)}
            </>
          )}
        </div>

        {/* Role summary card at bottom */}
        <div className="p-4 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
            <p className="text-[11px] font-bold text-slate-700 capitalize">
              {role === 'hod' ? 'HOD' : role === 'coordinator' ? 'Coordinator' : role} Portal
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{user?.department}</p>
            <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
              <span>CampusSync v1.0</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Connected" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
