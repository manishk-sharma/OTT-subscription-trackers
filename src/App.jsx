import React, { useState } from 'react'
import Dashboard from './components/Dashboard'
import ExpensesPage from './components/ExpensesPage'
import { LayoutDashboard, Wallet, Bell, Settings, User } from 'lucide-react'

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon"></div>
          <span>OTT Tracker</span>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#" className={activePage === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('dashboard'); }}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </a>
          <a href="#" className={activePage === 'expenses' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('expenses'); }}>
            <Wallet size={20} /> <span>Expenses</span>
          </a>
          <a href="#" className={activePage === 'notifications' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('notifications'); }}>
            <Bell size={20} /> <span>Notifications</span>
          </a>
          <a href="#" className={activePage === 'settings' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('settings'); }}>
            <Settings size={20} /> <span>Settings</span>
          </a>
        </nav>

        <div className="user-profile">
          <div className="avatar"><User size={20} /></div>
          <div className="user-info">
            <p className="user-name">Premium User</p>
            <p className="user-plan">Pro Member</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'expenses' && <ExpensesPage />}
        {activePage === 'notifications' && (
          <div className="placeholder-page fade-in">
            <h1>🔔 Notifications</h1>
            <p className="subtitle">Renewal alerts coming soon...</p>
          </div>
        )}
        {activePage === 'settings' && (
          <div className="placeholder-page fade-in">
            <h1>⚙️ Settings</h1>
            <p className="subtitle">Preferences & configuration coming soon...</p>
          </div>
        )}
      </main>

      <style>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          background: rgba(15, 17, 26, 0.95);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          padding: 32px 0;
          position: sticky;
          top: 0;
        }

        .logo {
          padding: 0 32px 48px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 20px;
          color: var(--text-main);
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 8px;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 0 16px;
          flex: 1;
        }

        .sidebar-nav a {
          text-decoration: none;
          color: var(--text-dim);
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .sidebar-nav a:hover, .sidebar-nav a.active {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.05);
        }

        .sidebar-nav a.active {
          background: rgba(124, 77, 255, 0.1);
          color: var(--accent-primary);
        }

        .user-profile {
          margin: 0 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--glass-border);
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: var(--bg-card);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }

        .user-info p {
           margin: 0;
        }

        .user-plan {
          font-size: 11px;
          color: var(--accent-primary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 1024px) {
          .sidebar {
            width: 80px;
            padding: 32px 0;
            z-index: 100;
          }
          .logo span, .user-info, .sidebar-nav a span {
            display: none;
          }
          .sidebar-nav a {
            justify-content: center;
            padding: 16px;
          }
          .logo {
            padding: 0 0 48px;
            justify-content: center;
          }
          .user-profile {
            justify-content: center;
            padding: 8px;
            margin: 0 8px;
          }
        }
        
        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }
          .sidebar {
            position: fixed;
            bottom: 0;
            left: 0;
            top: auto;
            width: 100%;
            height: 70px;
            flex-direction: row;
            border-right: none;
            border-top: 1px solid var(--glass-border);
            padding: 0;
            background: rgba(15, 17, 26, 0.98);
            backdrop-filter: blur(20px);
            z-index: 1000;
          }
          .logo, .user-profile {
            display: none;
          }
          .sidebar-nav {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            width: 100%;
            padding: 0 16px;
          }
          .sidebar-nav a {
            flex: 1;
            flex-direction: column;
            gap: 4px;
            padding: 8px;
            font-size: 10px;
            border-radius: 8px;
          }
          .sidebar-nav a span {
            display: block; /* show tiny text on bottom nav */
            font-weight: 600;
          }
          .sidebar-nav a svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  )
}

export default App
