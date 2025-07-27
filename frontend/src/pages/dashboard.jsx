import React from 'react'

import SummaryCard from '../components/SummaryCard'
import EntryTable from '../components/EntryTable'
import VitalChart from '../components/vitalChart'


const Dashboard = () => {
  return (
    <div className='p-6 space-y-6 bg-neutral-light min-h-screen'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
         <h1 className='text-2xl font-bold text-neutral-dark'>This is Dashboard</h1>

          <div className="flex items-center gap-2">

          </div>


      </div>
     
      <SummaryCard />
      <VitalChart />
      <EntryTable />




    </div>
  )
}

export default Dashboard