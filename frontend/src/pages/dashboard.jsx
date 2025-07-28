import { useEffect, useState } from "react";

import SummaryCard from '../components/SummaryCard'
import EntryTable from '../components/EntryTable'
import VitalChart from '../components/vitalChart'


export default function Dashboard  () {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [range, setRange] = useState('7d'); // Default to 7 days


  // useInsertionEffect(()=>{
  //   let cancelled = false;

  //   async function fetchAll(){
  //     setLoading(true);
  //     setError(null);

  //     try{
  //       const qs = range === "all" ? "" : `?range=${range}`;

      
  //     }

  //   }
  // })


  return (
    <div className='p-6 space-y-6 bg-neutral-light min-h-screen'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
         <h1 className='text-2xl font-bold text-neutral-dark '>This is Dashboard</h1>

          <div className="flex items-center gap-2">

          </div>


      </div>
     
      <SummaryCard />
      <VitalChart />
      <EntryTable />




    </div>
  )
}

