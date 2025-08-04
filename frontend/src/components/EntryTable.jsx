import React from "react";

/**
 * EntryTable component displays a table of recent vitals entries.
 * Props:
 *  - data: Array of entry objects to display
 *  - onEdit: Function to call with entry data when "Edit" is clicked
 *  - onDelete: Function to call with entry ID when "Delete" is clicked
 */



const EntryTable = ({ data, onEdit, onDelete }) => {

  // if there's no data, show a message
  if (!data || data.length === 0) return <p>No recent entries found.</p>;

  // debug to console statement to track the data
  console.log("Rendering EntryTable with data:", data);
  return (
    <div className="bg-white rounded-2xl shadow-soft p-4">
      <h2 className="text-lg font-semibold text-neutral-dark mb-4">Recent Entries</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">BP</th>
              <th className="py-2 pr-4">HR</th>
              <th className="py-2 pr-4">Temp</th>
              <th className="py-2 pr-4">Notes</th>
              <th className="py-2 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {/* Render a row for each entry in the data array */}
            {data.map((entry) => (
              <tr key={entry.id} className="border-b">
                <td className="px-4 py-2">
                  {entry.date
                    ? new Date(entry.date).toLocaleDateString()
                    : "—"}
                </td>
                
                 {/* Systolic/Diastolic BP if present, else em dash */}
                <td className="px-4 py-2">
                  {entry.systolic!= null && entry.diastolic != null
                    ? `${entry.systolic}/${entry.diastolic}`
                    : "—"}
                </td>

                  {/* Heart Rate, or em dash if missing */}
                <td className="px-4 py-2">
                  {entry.heart_rate != null ? entry.heart_rate : "—"}
                </td>
                  
                  {/* Temperature with °F, or em dash if missing */}
                <td className="px-4 py-2">
                  {entry.temperature != null ? `${entry.temperature}°F` : "—"}
                </td>
                  
                  {/* Notes, or em dash if empty */}
                <td className="px-4 py-2">{entry.notes || "—"}</td>
                  
                  {/* Edit and Delete actions */}
                <td className="py-2 pr-4 text-right space-x-2">
                  <button
                    className="text-primary hover:underline"
                    onClick={() => onEdit(entry)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-danger hover:underline"
                    onClick={() => onDelete(entry.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EntryTable;
