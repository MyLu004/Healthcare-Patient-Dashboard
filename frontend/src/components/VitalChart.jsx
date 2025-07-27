import React from 'react'
// import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";


const VitalChart = () => {
  return (
    <div className='bg-white rounded-2xl shadow-soft p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <h2>This is vital chart</h2>
        <div className='flex gap-2'> 
          <button className='px-3 py-1 rounded-lg text-sm'>BP</button>
          <button className='px-3 py-1 rounded-lg text-sm'>HR</button>
          <button className='px-3 py-1 rounded-lg text-sm'>Set Metric</button>
        </div>
      </div>

    </div>
  )
}

export default VitalChart