import { Link } from 'react-router-dom'
import { useCurrentProduction } from '@/lib/hooks'

interface Props {
  children: React.ReactNode
}

export default function RequiresProduction({ children }: Props) {
  const production = useCurrentProduction()
  if (!production) {
    return (
      <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-medium">No production selected.</p>
        <p className="mt-1">
          Set up a production first so the rest of Standby has something to
          attach to.
        </p>
        <Link
          to="/production"
          className="mt-2 inline-block font-medium underline"
        >
          Go to Production setup →
        </Link>
      </div>
    )
  }
  return <>{children}</>
}
