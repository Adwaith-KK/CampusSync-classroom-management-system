import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { DoorOpen, Users, Building, Layers, Clock, UserCheck, ShieldAlert, CheckCircle } from 'lucide-react';

export default function ClassroomCard({ classroom, onClaim, onRelease }) {
  const { user } = useAuth();
  const role = user?.role;
  const isStudent = role === 'student';

  const { id, roomNumber, building, floor, capacity, type, status, features, occupancyDetails } = classroom;

  // Real-time countdown for temporarily claimed rooms
  const [secondsLeft, setSecondsLeft] = useState(occupancyDetails?.remainingSeconds || 0);

  useEffect(() => {
    if (status === 'temporarily_claimed' && occupancyDetails?.remainingSeconds) {
      setSecondsLeft(occupancyDetails.remainingSeconds);
      const timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, occupancyDetails]);

  const formatCountdown = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const isClaimedByMe = occupancyDetails?.userId === user?.id;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
      status === 'available' ? 'border-emerald-200 hover:border-emerald-300' :
      status === 'temporarily_claimed' ? 'border-amber-200 bg-amber-50/20' :
      status === 'scheduled' ? 'border-indigo-200 bg-indigo-50/20' :
      status === 'occupied' ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
    }`}>
      {/* Top Banner with Room Number & Status */}
      <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <DoorOpen className="w-5 h-5 text-campus-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{roomNumber}</h3>
              <p className="text-xs text-slate-500 font-medium">{type}</p>
            </div>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Room Details */}
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Building className="w-4 h-4 text-slate-400" />
            <span className="truncate">{building}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Floor {floor}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Capacity: {capacity}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-slate-400" />
            <span className="truncate">{features ? 'Equipped' : 'Standard'}</span>
          </div>
        </div>

        {/* Dynamic Occupancy Details Box */}
        {status === 'temporarily_claimed' && occupancyDetails && (
          <div className="rounded-xl bg-amber-50 p-3 border border-amber-200/80 text-xs">
            <div className="flex items-center justify-between text-amber-900 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                Claimed by {occupancyDetails.userName}
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] bg-amber-200/60 px-2 py-0.5 rounded-full text-amber-900">
                <Clock className="w-3 h-3" />
                {secondsLeft > 0 ? formatCountdown(secondsLeft) : 'Expiring...'}
              </span>
            </div>
            <p className="text-amber-800 text-[11px] truncate">Purpose: {occupancyDetails.purpose}</p>
            <p className="text-amber-700 text-[10px] mt-1">
              Until: {new Date(occupancyDetails.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {status === 'scheduled' && occupancyDetails && (
          <div className="rounded-xl bg-indigo-50 p-3 border border-indigo-200/80 text-xs">
            <p className="font-semibold text-indigo-900 truncate">
              {occupancyDetails.courseCode}: {occupancyDetails.courseName}
            </p>
            <p className="text-indigo-700 text-[11px] mt-0.5">Faculty: {occupancyDetails.facultyName}</p>
            <p className="text-indigo-600 text-[10px] mt-1 font-mono">
              Schedule: {occupancyDetails.startTime} - {occupancyDetails.endTime}
            </p>
          </div>
        )}

        {status === 'occupied' && occupancyDetails && (
          <div className="rounded-xl bg-rose-50 p-3 border border-rose-200/80 text-xs">
            <p className="font-semibold text-rose-900 truncate">Reserved: {occupancyDetails.purpose}</p>
            <p className="text-rose-700 text-[11px]">Booked by: {occupancyDetails.bookedBy}</p>
            <p className="text-rose-600 text-[10px] mt-1 font-mono">
              Time: {occupancyDetails.startTime} - {occupancyDetails.endTime}
            </p>
          </div>
        )}

        {status === 'maintenance' && (
          <div className="rounded-xl bg-slate-100 p-3 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>Under maintenance. Temporary access unavailable.</span>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          {features || 'Smart Board, Wi-Fi'}
        </span>

        {/* Claim / Release controls */}
        {status === 'available' ? (
          !isStudent ? (
            <button
              onClick={() => onClaim(classroom)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1.5"
            >
              Claim Room
            </button>
          ) : (
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-1 rounded">
              Ready for Class
            </span>
          )
        ) : status === 'temporarily_claimed' && (isClaimedByMe || role === 'coordinator') ? (
          <button
            onClick={() => onRelease(occupancyDetails?.claimId, roomNumber)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors"
          >
            Release Claim
          </button>
        ) : null}
      </div>
    </div>
  );
}
