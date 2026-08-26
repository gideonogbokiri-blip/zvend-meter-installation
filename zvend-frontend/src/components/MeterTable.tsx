import { Link } from 'react-router-dom'
import type { MeterInstallation } from '../types'
import { StatusBadge } from './StatusBadge'
import { StageBar } from './StageBar'
import { formatDate } from '../lib/status'

export function MeterTable({ items }: { items: MeterInstallation[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl ring-1 ring-slate-900/5 shadow-sm md:block">
        <table className="w-full bg-white text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-3.5">Meter</th>
              <th className="px-5 py-3.5">Facility</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Field Tech</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Progress</th>
              <th className="px-5 py-3.5 text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((m) => (
              <tr key={m.id} className="group transition hover:bg-brand-50/50">
                <td className="px-5 py-4">
                  <Link to={`/meters/${m.id}`} className="font-bold text-brand-700 hover:text-brand-800 group-hover:underline">
                    {m.officialMeterNumber}
                  </Link>
                  {m.rejectionReason && (
                    <p className="mt-0.5 text-xs text-red-600">Rejected — needs attention</p>
                  )}
                </td>
                <td className="px-5 py-4 text-slate-600">{m.facilityName}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-5 py-4 text-slate-600">{m.fieldTechnicianName ?? '—'}</td>
                <td className="px-5 py-4 text-slate-600">
                  {m.customerName ? (
                    <span>
                      <span className="font-medium text-slate-800">{m.customerName}</span>
                      <span className="block text-xs text-slate-400">{m.customerPhone}</span>
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="w-36">
                    <StageBar status={m.status} showLabel />
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    to={`/meters/${m.id}`}
                    className="btn-secondary px-3 py-1.5 text-xs"
                    aria-label={`Open ${m.officialMeterNumber}`}
                  >
                    Open
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((m) => (
          <Link
            key={m.id}
            to={`/meters/${m.id}`}
            className="animate-fade-in-up card block p-4 transition hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-extrabold tracking-tight text-slate-900">{m.officialMeterNumber}</p>
              <StatusBadge status={m.status} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{m.facilityName}</p>
            {m.customerName && (
              <p className="mt-2 text-xs text-slate-500">
                Customer: <span className="font-semibold text-slate-700">{m.customerName}</span>{' '}
                <span className="text-slate-400">· {m.customerPhone}</span>
              </p>
            )}
            {m.installationAddress && <p className="mt-2 text-xs text-slate-400">{m.installationAddress}</p>}
            <div className="mt-3">
              <StageBar status={m.status} showLabel />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Tech: {m.fieldTechnicianName ?? '—'}</span>
              <span>{formatDate(m.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}