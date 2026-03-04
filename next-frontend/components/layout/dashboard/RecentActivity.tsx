const ACTIVITIES = [
  {
    dot: 'bg-[#4ade80]',
    text: (
      <>
        <span className="text-white font-medium">Emily Carter</span>
        {' completed her interview for '}
        <span className="font-semibold">Senior Frontend Developer</span>
      </>
    ),
    time: '2m ago',
  },
  {
    dot: 'bg-blue-400',
    text: (
      <>
        <span className="text-white font-medium">James Liu</span>
        {' accepted interview invite for '}
        <span className="font-semibold">UX Designer</span>
      </>
    ),
    time: '18m ago',
  },
  {
    dot: 'bg-yellow-400',
    text: (
      <>
        {'Interview link for '}
        <span className="font-semibold">Backend Engineer</span>
        {' was viewed but not started by '}
        <span className="text-white font-medium">Marcus Webb</span>
      </>
    ),
    time: '1h ago',
  },
  {
    dot: 'bg-blue-400',
    text: (
      <>
        {'New application received for '}
        <span className="font-semibold">Product Manager</span>
        {' from '}
        <span className="text-white font-medium">Aisha Okonkwo</span>
      </>
    ),
    time: '3h ago',
  },
  {
    dot: 'bg-[#4ade80]',
    text: (
      <>
        {'Interview questions updated for '}
        <span className="font-semibold">Data Analyst</span>
        {' role'}
      </>
    ),
    time: 'Yesterday',
  },
]

export default function RecentActivity() {
  return (
    <div className="bg-[#0D1117] border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold">Recent Activity</h2>
        <button className="text-xs text-gray-500 hover:text-white transition-colors">
          View all
        </button>
      </div>
      <ul className="flex flex-col divide-y divide-white/5">
        {ACTIVITIES.map((item, i) => (
          <li key={i} className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
              <p className="text-sm text-gray-400 leading-snug">{item.text}</p>
            </div>
            <span className="text-xs text-gray-600 shrink-0 mt-0.5">{item.time}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
