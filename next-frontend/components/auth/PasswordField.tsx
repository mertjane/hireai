import { Eye, EyeOff, Lock } from 'lucide-react'

export default function PasswordField({
  label,
  placeholder,
  show,
  onToggle,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  show: boolean
  onToggle: () => void
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 tracking-widest block mb-1.5">{label}</label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-gray-500">
          <Lock className="w-4 h-4" />
        </span>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 py-3 pl-10 pr-10 outline-none focus:border-[#4ade80]/50 transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 text-gray-500 hover:text-gray-300"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
