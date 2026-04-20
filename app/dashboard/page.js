import { PartyPopper } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white inline-flex items-center gap-2">
          You&apos;re logged in!
          <PartyPopper size={30} />
        </h1>
        <p className="text-slate-400 mt-2">Dashboard coming in the next step.</p>
      </div>
    </div>
  )
}