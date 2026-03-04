export default function GreenButton({
  children,
  disabled,
}: {
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-60 disabled:cursor-not-allowed text-[#0A0D12] font-semibold py-3.5 rounded-xl transition-colors text-sm"
    >
      {children}
    </button>
  )
}
