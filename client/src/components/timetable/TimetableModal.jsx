import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react';

export default function TimetableModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  classrooms = [],
  faculties = [],
  entry = null
}) {
  const [classroomId, setClassroomId] = useState(entry?.classroom_id || classrooms[0]?.id || '');
  const [facultyId, setFacultyId] = useState(entry?.faculty_id || faculties[0]?.id || '');
  const [courseName, setCourseName] = useState(entry?.course_name || '');
  const [courseCode, setCourseCode] = useState(entry?.course_code || '');
  const [dayOfWeek, setDayOfWeek] = useState(entry?.day_of_week || 'Monday');
  const [startTime, setStartTime] = useState(entry?.start_time ? entry.start_time.slice(0, 5) : '09:00');
  const [endTime, setEndTime] = useState(entry?.end_time ? entry.end_time.slice(0, 5) : '10:30');
  const [semester, setSemester] = useState(entry?.semester || 'MCA Semester 3');
  const [section, setSection] = useState(entry?.section || 'A');
  const [error, setError] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseName.trim() || !courseCode.trim()) {
      setError('Course name and code are required.');
      return;
    }
    if (startTime >= endTime) {
      setError('Start time must be earlier than end time.');
      return;
    }
    setError('');
    onSubmit({
      id: entry?.id,
      classroomId: parseInt(classroomId, 10),
      facultyId: parseInt(facultyId, 10),
      courseName: courseName.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      dayOfWeek,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      semester: semester.trim(),
      section: section.trim()
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? 'Edit Timetable Schedule Slot' : 'Add New Timetable Schedule Entry'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Classroom</label>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.roomNumber} ({c.building} - Floor {c.floor})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Faculty In-Charge</label>
            <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            >
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course Name</label>
            <input
              type="text"
              required
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Distributed Computing Systems"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course Code</label>
            <input
              type="text"
              required
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. MCA312"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500 uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Day of Week</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Time</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Time</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Semester</label>
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Section / Group</label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-campus-600 hover:bg-campus-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Validating Conflicts...' : entry ? 'Update Slot' : 'Save Timetable Entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
