import React from 'react'

const SummaryCard = ({data}) => {

  if (!data) return <div>The data is loading....</div>

  console.log("Rendering SummaryCard with data:", data);


  return (
    <div className='grid gap-4 md:grid-cols-3'>

      <div className="bg-white rounded-2xl shadow-soft p-4">
        <p className='text-sm text-neutral-dark/70'>Average BP</p>
        <p className="mt-1 text-2xl font-bold text-neutral-dark">
          {data.avg_bp ? `${data.avg_bp.systolic}/${data.avg_bp.diastolic}` : '-'}
        </p>
      </div>


      <div className='bg-white rounded-2xl shadow-soft p-4'>
        <p className='text-sm text-neutral-dark/70'>Max HR (7d)</p>
        <p className="mt-1 text-2xl font-bold text-neutral-dark">
          <p className='text-base font-medium'>{data.max_hr ?? "--"} bpm</p>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4">
        <p className="text-sm text-neutral-dark/70">Avg Temp (7d)</p>
        <p className="mt-1 text-2xl font-bold text-neutral-dark inline-flex items-center">
          {data.avg_temp ?? "--"} °F {data.temp_trend === 'up' ? "↑" : data.temp_trend === 'down' ? "↓" : ""} 
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4">
        <p className="text-sm text-neutral-dark/70">Entries this week</p>
        <p className="mt-1 text-2xl font-bold text-neutral-dark">
            {data.entries_this_week}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4">
        <p className="text-sm text-neutral-dark/70">Last entry</p>
        <p className="mt-1 text-2xl font-bold text-neutral-dark">
           {data.last_entry_at ? new Date(data.last_entry_at).toLocaleDateString() : "—"}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4">
        <p className="text-sm text-neutral-dark/70">Flagged entries</p>
        <p className={`mt-1 text-2xl font-bold `}>
          {data.flagged_entries ?? 0}
        </p>
      </div>
    </div>
  )
}

export default SummaryCard