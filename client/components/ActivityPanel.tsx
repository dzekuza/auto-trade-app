import React from 'react'
import { useActivityQuery } from '../hooks/useActivityQuery'

const ActivityPanel: React.FC = () => {
  const { data, isLoading, isError } = useActivityQuery()
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold">Auto-Trade Activity</h3>
      </div>
      <div className="card-body">
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {isError && <p className="text-sm text-red-600">Failed to load activity</p>}
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Time</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.activity.map((e, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2">{new Date(e.time).toLocaleString()}</td>
                    <td className="py-2">{e.action}</td>
                    <td className="py-2 font-mono text-xs break-words">{JSON.stringify(e.details)}</td>
                  </tr>
                ))}
                {data.activity.length === 0 && (
                  <tr><td className="py-4 text-gray-500" colSpan={3}>No activity yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityPanel


