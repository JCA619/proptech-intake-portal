import React, { useState, useEffect } from 'react';
import IntakeForm from './components/IntakeForm';
import AdminDashboard from './components/AdminDashboard';
import { Home, Lock, UserCheck } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (hash) => {
    window.location.hash = hash;
  };

  return (
    <div style={styles.appContainer}>
      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {currentPath === '#/admin' ? (
          <AdminDashboard />
        ) : (
          <IntakeForm />
        )}
      </main>

      {/* Shared Footer with Portal Navigation */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <p style={styles.footerCopy}>&copy; 2026 PropIntake. All rights reserved.</p>
          <div style={styles.footerLinks}>
            {currentPath === '#/admin' ? (
              <button 
                onClick={() => navigateTo('#/')} 
                style={styles.footerLinkBtn}
              >
                <UserCheck size={14} /> Client Form View
              </button>
            ) : (
              <button 
                onClick={() => navigateTo('#/admin')} 
                style={styles.footerLinkBtn}
              >
                <Lock size={14} /> Admin Dashboard Portal
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  footer: {
    width: '100%',
    padding: '24px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    background: 'rgba(5, 8, 16, 0.4)',
    marginTop: 40,
  },
  footerContent: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerCopy: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  footerLinks: {
    display: 'flex',
    gap: 16,
  },
  footerLinkBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s',
  }
};
// Add simple hover effect in style or keep standard styling
styles.footerLinkBtn[':hover'] = {
  color: 'var(--primary-hover)',
  background: 'rgba(255,255,255,0.02)'
};
