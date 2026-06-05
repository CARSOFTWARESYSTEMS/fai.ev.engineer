export function PdfLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Loading PDF…</p>
    </div>
  )
}
