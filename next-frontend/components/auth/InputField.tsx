export default function InputField({
  label,
  icon,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string
  icon?: React.ReactNode
  type: string
  placeholder: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 tracking-widest block mb-1.5">{label}</label>
      <div className="relative flex items-center">
        {icon && <span className="absolute left-3 text-gray-500">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 py-3 pr-4 outline-none focus:border-[#4ade80]/50 transition-all ${
            icon ? 'pl-10' : 'pl-4'
          }`}
        />
      </div>
    </div>
  )
}
