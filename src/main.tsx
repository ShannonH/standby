import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Today from './routes/Today'
import Production from './routes/Production'
import Contacts from './routes/Contacts'
import Rehearsals from './routes/Rehearsals'
import ShowReports from './routes/ShowReports'
import DailyCall from './routes/DailyCall'
import LineNotes from './routes/LineNotes'
import Props from './routes/Props'
import Settings from './routes/Settings'
import Tracking from './routes/Tracking'
import Blocking from './routes/Blocking'
import Breaks from './routes/Breaks'
import Breakdown from './routes/Breakdown'
import Backup from './routes/Backup'
import './index.css'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <Today /> },
        { path: 'production', element: <Production /> },
        { path: 'contacts', element: <Contacts /> },
        { path: 'rehearsals', element: <Rehearsals /> },
        { path: 'show-reports', element: <ShowReports /> },
        { path: 'daily-call', element: <DailyCall /> },
        { path: 'line-notes', element: <LineNotes /> },
        { path: 'props', element: <Props /> },
        { path: 'tracking', element: <Tracking /> },
        { path: 'blocking', element: <Blocking /> },
        { path: 'breaks', element: <Breaks /> },
        { path: 'breakdown', element: <Breakdown /> },
        { path: 'backup', element: <Backup /> },
        { path: 'settings', element: <Settings /> },
      ],
    },
  ],
  { basename: '/standby' },
)

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
