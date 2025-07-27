import React from 'react'

const EntryTable = () => {
  return (
    <div className='bg-white rounded-2xl shadow-soft p-4'>
      <h2 className='text-lg font-semibold text-neutral-dark mb-4'>Recent Entries</h2>
      <div className='overdlow-x-auto'>
        <table className='min-w-full'>
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
            {/* example 1 */}
            <tr className='border-b'>
              <td className='px-4 py-2'>2023-10-01</td>
              <td className='px-4 py-2'>Blood Pressure</td>
              <td className='px-4 py-2'>120/80 mmHg</td>
              <td className='px-4 py-2'>90F</td>
              <td className='px-4 py-2'>Some Note</td>

              <td className="py-2 pr-4 text-right space-x-2">
            
              <button className='text-primary hover:underline'>Edit</button>
              <button className='text-primary hover:underline'>Delete</button>

              </td>
            </tr>
            {/* example 2 */}
            <tr className='border-b'>
              <td className='px-4 py-2'>2023-10-01</td>
              <td className='px-4 py-2'>Blood Pressure</td>
              <td className='px-4 py-2'>120/80 mmHg</td>
              <td className='px-4 py-2'>90F</td>
              <td className='px-4 py-2'>Some Note</td>

              <td className="py-2 pr-4 text-right space-x-2">
            
              <button className='text-primary hover:underline'>Edit</button>
              <button className='text-primary hover:underline'>Delete</button>

              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default EntryTable