const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500',
]

export function avatarColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export const JOB_CHIP_COLORS = [
  { bg: 'bg-blue-400/10',    text: 'text-blue-400' },
  { bg: 'bg-violet-400/10',  text: 'text-violet-400' },
  { bg: 'bg-pink-400/10',    text: 'text-pink-400' },
  { bg: 'bg-amber-400/10',   text: 'text-amber-400' },
  { bg: 'bg-cyan-400/10',    text: 'text-cyan-400' },
  { bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
]

const _jobChipCache: Record<string, (typeof JOB_CHIP_COLORS)[number]> = {}
let _jobChipIdx = 0

export function getJobChipColor(jobId: string): (typeof JOB_CHIP_COLORS)[number] {
  if (!_jobChipCache[jobId]) {
    _jobChipCache[jobId] = JOB_CHIP_COLORS[_jobChipIdx % JOB_CHIP_COLORS.length]
    _jobChipIdx++
  }
  return _jobChipCache[jobId]
}
