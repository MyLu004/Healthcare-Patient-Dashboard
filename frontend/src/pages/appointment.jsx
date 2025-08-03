import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


// sample data for appointments
// TODO :  future improve - replace with real API calls
// or a more complex state management solution
const fakeAppointments = [
  {
    id: 1,
    title: "Annual Physical",
    date: "2025-08-06 10:30 AM",
    doctor: "Dr. Smith",
    location: "Health Clinic A",
    notes: "Bring previous medical records.",
  },
  {
    id: 2,
    title: "Dentist Cleaning",
    date: "2025-09-15 2:00 PM",
    doctor: "Dr. Lee",
    location: "DentalCare Center",
    notes: "",
  },
];


// -- MAIN APPOINTMENT COMPONENT --
// Displays upcoming appointments and allows users to request new ones
export default function Appointment() {
    // state to hold appointments and form data
  const [appointments, setAppointments] = useState(fakeAppointments);
  const [form, setForm] = useState({
    title: "",
    date: null, //Date object
    doctor: "",
    location: "",
    notes: "",
  });

  // state to show/hide the new appointment form
  const [showForm, setShowForm] = useState(false);


  // handle inpit changes for text fields
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // DatePicker change for Data object in form
  function handleDateChange(date) {
    setForm({ ...form, date });
  }

    // handle form submission to add a new appointment
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.date || !form.doctor || !form.location) {
      alert("Please fill in all required fields.");
      return;
    }
    //else, add the new appointment to the list
    // "Create a new array with all the previous appointments, and add the new appointment object at the end."
    setAppointments([
      ...appointments,
      // new appointment object with formatted date
      {
        ...form,
        id: Date.now(),
        date: form.date.toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }), // format for display
      },
    ]);

    // reset form fields after submission
    // "Reset the form state to its initial values."
    setForm({
      title: "",
      date: null,
      doctor: "",
      location: "",
      notes: "",
    });

    // showForm : boolean state to hide the form after submission
    setShowForm(false);
  }

  return (
    <div className="space-y-6 m-5">
      <h2 className="text-3xl font-bold mb-6">Upcoming Appointments</h2>
      <button
        className="bg-teal-600 text-white px-4 py-2 rounded-lg mb-4"

        // setShowForm to toggle the appointment request form [default: false]
        onClick={() => setShowForm((f) => !f)}
      >
        {/* if true: show cancel, else: request appointment [false] */}
        {showForm ? "Cancel" : "+ Request Appointment"}
      </button>

      {showForm && (
        <form
          className="bg-white shadow-soft rounded-2xl p-6 mb-6 space-y-4 max-w-xl"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block font-medium mb-1">
              Title<span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full border rounded p-2"
              placeholder="e.g. Eye Checkup"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              Date & Time<span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-5">

                {/* DatePicker for selecting date and time */}
              <DatePicker
                selected={form.date}
                onChange={handleDateChange}
                showTimeSelect
                dateFormat="Pp"
                placeholderText="Select date and time"
                className="w-full border rounded p-2"
                minDate={new Date()}
                required
                popperPlacement="right-start"
              />
              {/* calendar icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} className="text-gray-400">
                <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 16H5V9h14zm0-11H5V6h14z"/>
              </svg>
            </div>
          </div>
          {/* ...rest of your form (doctor, location, notes) */}
          <div>
            <label className="block font-medium mb-1">Doctor<span className="text-red-500">*</span></label>
            <input
              name="doctor"
              value={form.doctor}
              onChange={handleChange}
              required
              className="w-full border rounded p-2"
              placeholder="Dr. Jane Doe"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Location<span className="text-red-500">*</span></label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className="w-full border rounded p-2"
              placeholder="Clinic Name"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Notes [Optional]</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full border rounded p-2"
              placeholder="Anything else?"
            />
          </div>
          <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg">
            Submit Request
          </button>
        </form>
      )}

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl">
          No upcoming appointments.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {appointments.map((app) => (
            <div
              key={app.id}
              className="bg-white shadow-soft rounded-2xl p-5 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-semibold text-teal-700">
                  {app.title}
                </span>
                <span className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full">
                  {app.date}
                </span>
              </div>
              <div className="text-gray-600">
                <strong>Doctor:</strong> {app.doctor}
              </div>
              <div className="text-gray-600">
                <strong>Location:</strong> {app.location}
              </div>
              {app.notes && (
                <div className="text-gray-500 text-sm italic">
                  <strong>Notes:</strong> {app.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
