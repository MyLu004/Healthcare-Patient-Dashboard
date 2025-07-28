import React from "react";

const EntryTable = ({ data }) => {
  if (!data || data.length === 0) return <p>No recent entries found.</p>;

  return (
    <div className='bg-white rounded-2xl shadow-soft p-4'>
      <h2 className='text-lg font-semibold text-neutral-dark mb-4'>Recent Entries</h2>
      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm'>
          <thead>
            <tr className='border-b'>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">BP</th>
              <th className="py-2 pr-4">HR</th>
              <th className="py-2 pr-4">Temp</th>
              <th className="py-2 pr-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.id} className='border-b'>
                <td className='px-4 py-2'>{new Date(entry.date).toLocaleDateString()}</td>
                <td className='px-4 py-2'>
                  {entry.systolic != null && entry.diastolic != null
                    ? `${entry.systolic}/${entry.diastolic}`
                    : "—"}
                </td>
                <td className='px-4 py-2'>{entry.heart_rate ?? "—"}</td>
                <td className='px-4 py-2'>{entry.temperature ?? "—"}°F</td>
                <td className='px-4 py-2'>{entry.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EntryTable;
