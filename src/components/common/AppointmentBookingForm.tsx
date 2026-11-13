import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  APPLICANT_TYPES,
  APPOINTMENT_OFFICES,
  APPOINTMENT_TIME_SLOTS,
  createAppointmentBooking,
} from '../../services/appointmentService';
import type { AppointmentBooking, Department } from '../../types';

interface AppointmentBookingFormProps {
  departments: Department[];
  onBooked?: (booking: AppointmentBooking) => void;
}

function getDefaultDate(): string {
  const tomorrow = new Date(Date.now() + 86400000);
  return tomorrow.toISOString().split('T')[0];
}

export function AppointmentBookingForm({
  departments,
  onBooked,
}: AppointmentBookingFormProps) {
  const { firebaseUser, studentProfile, facultyProfile } = useAuth();
  const { showToast } = useToast();

  const ugDepartments = departments.filter((d) => (d.programLevel || 'UG') === 'UG');
  const pgDepartments = departments.filter((d) => d.programLevel === 'PG');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [usnOrId, setUsnOrId] = useState('');
  const [applicantType, setApplicantType] = useState<string>('Student');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'cse');
  const [appointmentOffice, setAppointmentOffice] = useState<string>(APPOINTMENT_OFFICES[0]);
  const [preferredDate, setPreferredDate] = useState(getDefaultDate);
  const [preferredTime, setPreferredTime] = useState<string>(APPOINTMENT_TIME_SLOTS[0]);
  const [purpose, setPurpose] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<AppointmentBooking | null>(null);

  useEffect(() => {
    if (studentProfile) {
      setFullName((prev) => prev || studentProfile.fullName);
      setUsnOrId((prev) => prev || studentProfile.usn);
      setDepartmentId(studentProfile.departmentId || departments[0]?.id || 'cse');
      setApplicantType('Student');
    } else if (facultyProfile) {
      setFullName((prev) => prev || facultyProfile.fullName);
      setUsnOrId((prev) => prev || facultyProfile.employeeId);
      setDepartmentId(facultyProfile.departmentId || departments[0]?.id || 'cse');
    }
    if (firebaseUser?.email) {
      setEmail((prev) => prev || firebaseUser.email || '');
    }
    if (firebaseUser?.displayName) {
      setFullName((prev) => prev || firebaseUser.displayName || '');
    }
  }, [firebaseUser, studentProfile, facultyProfile, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (
      fullName.trim().length < 2 ||
      !email.trim().includes('@') ||
      phone.trim().length < 7 ||
      !preferredDate ||
      purpose.trim().length < 5
    ) {
      setErrorMsg('Please fill in your name, valid email, phone number, preferred date, and appointment purpose.');
      return;
    }

    const selectedDept = departments.find((d) => d.id === departmentId);
    const departmentName = selectedDept
      ? `${selectedDept.name} (${selectedDept.code})`
      : departmentId.toUpperCase();

    setSubmitting(true);
    try {
      const booking = await createAppointmentBooking({
        fullName,
        email,
        phone,
        usnOrId,
        applicantType,
        departmentId,
        departmentName,
        appointmentOffice,
        preferredDate,
        preferredTime,
        purpose,
        userUid: firebaseUser?.uid,
      });

      setConfirmedBooking(booking);
      setPurpose('');
      showToast('Appointment booked and saved successfully.', 'success');
      onBooked?.(booking);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to save appointment booking right now. Please try again.';
      setErrorMsg(msg);
      showToast('Appointment submission could not be completed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-[#0D1C31] p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
              Appointment Request Confirmed
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Your campus appointment request for{' '}
              <span className="font-semibold text-[#0B1F3A] dark:text-white">
                {confirmedBooking.appointment_office}
              </span>{' '}
              has been saved.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#091526] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Applicant</p>
            <p className="font-semibold text-[#0B1F3A] dark:text-white">
              {confirmedBooking.full_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Department / Program</p>
            <p className="font-medium text-[#0B1F3A] dark:text-slate-200">
              {confirmedBooking.department_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Preferred Schedule</p>
            <p className="font-mono tabular-nums font-medium text-[#0B1F3A] dark:text-slate-200">
              {confirmedBooking.preferred_date} · {confirmedBooking.preferred_time}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Office</p>
            <p className="font-medium text-[#0B1F3A] dark:text-slate-200">
              {confirmedBooking.appointment_office}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfirmedBooking(null)}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] hover:opacity-90 transition-opacity cursor-pointer"
        >
          Book Another Appointment
        </button>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-6 sm:p-8 space-y-4"
    >
      <div>
        <h3 className="font-display text-lg sm:text-xl font-bold text-[#0B1F3A] dark:text-white">
          Schedule an Appointment
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Book a consultation with GAT department heads, faculty mentors, admissions, or placement officers.
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-xs sm:text-sm text-red-800 dark:text-red-200"
        >
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            maxLength={120}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., Ananya Sharma"
            className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
            maxLength={160}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@gat.ac.in"
            className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            maxLength={24}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white font-mono focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
            Applicant Role *
          </label>
          <select
            value={applicantType}
            onChange={(e) => setApplicantType(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          >
            {APPLICANT_TYPES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
            USN / ID (Optional)
          </label>
          <input
            type="text"
            maxLength={40}
            value={usnOrId}
            onChange={(e) => setUsnOrId(e.target.value)}
            placeholder="e.g., 1GA22CS001"
            className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white font-mono uppercase focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
            Department / Program *
          </label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          >
            {ugDepartments.length > 0 && (
              <optgroup label="Undergraduate Programs (B.E.)">
                {ugDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </optgroup>
            )}
            {pgDepartments.length > 0 && (
              <optgroup label="Postgraduate Programs (M.Tech / MBA)">
                {pgDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
            Office / Coordinator *
          </label>
          <select
            value={appointmentOffice}
            onChange={(e) => setAppointmentOffice(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          >
            {APPOINTMENT_OFFICES.map((office) => (
              <option key={office} value={office}>
                {office}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C9972C]" />
              Preferred Date *
            </span>
          </label>
          <input
            type="date"
            required
            min={today}
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white font-mono focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C9972C]" />
              Preferred Time Slot *
            </span>
          </label>
          <select
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white font-mono focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          >
            {APPOINTMENT_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
          Purpose / Agenda of Appointment *
        </label>
        <textarea
          required
          rows={3}
          maxLength={1500}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Briefly describe the academic, admissions, or administrative matter you wish to discuss..."
          className="w-full p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
        />
      </div>

      <div className="pt-1 flex items-center justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white hover:bg-[#132F54] dark:bg-[#C9972C] dark:text-[#07111F] dark:hover:bg-[#DFB047] transition-colors disabled:opacity-60 cursor-pointer"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{submitting ? 'Submitting Booking...' : 'Confirm Appointment Booking'}</span>
        </button>
      </div>
    </form>
  );
}
