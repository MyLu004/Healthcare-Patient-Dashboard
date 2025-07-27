import React from 'react'

const SummaryCard = () => {
  return (
    <div className='grid gap-4 md:grid-cols-3 bg-blue-200 '>

      <div className="bg-white rounded-2xl shadow-soft p-4">
        <p className='text-sm text-neutral-dark/70'>Average BP</p>
        <p className="mt-1 text-2xl font-bold text-neutral-dark">
          name1
        </p>
      </div>


      <div className='bg-white rounded-2xl shadow-soft p-4'>
        <p className='text-sm text-neutral-dark/70'>Max HR (7d)</p>
        <p className="mt-1 text-2xl font-bold text-neutral-dark">
          <p className='text-base font-medium'>name 2</p>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4">
        <p className="text-sm text-neutral-dark/70">Avg Temp (7d)</p>
        <p className="mt-1 text-2xl font-bold text-neutral-dark inline-flex items-center">
          name3
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4">
        <p className="text-sm text-neutral-dark/70">Entries this week</p>
        <p className="mt-1 text-2xl font-bold text-neutral-dark">
            name4 
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4">
        <p className="text-sm text-neutral-dark/70">Last entry</p>
        <p className="mt-1 text-2xl font-bold text-neutral-dark">
          name5
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4">
        <p className="text-sm text-neutral-dark/70">Flagged entries</p>
        <p className={`mt-1 text-2xl font-bold `}>
          name5
        </p>
      </div>
    </div>
  )
}

export default SummaryCard