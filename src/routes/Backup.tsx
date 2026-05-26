import AutoBackupPanel from '@/components/AutoBackupPanel'
import ImportExport from '@/components/ImportExport'
import PublishPanel from '@/components/PublishPanel'
import { useCurrentProduction } from '@/lib/hooks'

/**
 * Backup & storage — single home for everything that protects show data
 * from loss or moves it between devices. Previously these were spread
 * across the bottom of the Production page; pulling them onto their own
 * route keeps Production focused on the production itself (CRUD +
 * distribute) and lets a stage manager find their backup options in an
 * obvious place.
 *
 * Three panels, in order of how often a working SM touches them:
 *
 *   1. Auto-backup folder — pick once, Standby writes a JSON snapshot
 *      to that folder on every change. Per-production.
 *   2. Publish folder — pick once, Standby writes the per-show PDFs to
 *      that folder so cast/crew can read them from a shared drive.
 *      Per-production.
 *   3. JSON backup / restore — manual export + import. Useful for
 *      moving a show between devices or sharing with a collaborator.
 *
 * Auto-backup and Publish need a current production; ImportExport works
 * whether or not one is selected (you can always import a show JSON).
 * The panels handle their own "Pick a production first" empty states.
 */
export default function BackupRoute() {
  const current = useCurrentProduction()
  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <header>
        <h2 className="font-display text-3xl">Backup &amp; storage</h2>
        <p className="mt-1 text-sm text-muted">
          Standby's everything-on-this-device promise means losing your
          browser data loses your shows. These three layers make that
          unlikely: keep storage persistent, auto-backup to a folder you
          already sync (Dropbox / iCloud / Google Drive), and export JSON
          snapshots before big changes.
        </p>
      </header>

      <AutoBackupPanel productionId={current?.id ?? null} />

      <PublishPanel
        productionId={current?.id ?? null}
        productionName={current?.name}
      />

      <ImportExport productionId={current?.id ?? null} />
    </section>
  )
}
