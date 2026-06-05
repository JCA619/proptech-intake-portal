import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Search, 
  Trash2, 
  Lock, 
  Edit3, 
  Database, 
  FileSpreadsheet, 
  Users, 
  Clock, 
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';
import { subscribeToLeads, updateLead, deleteLead, getFirebaseConnectionStatus } from '../firebase';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [firebaseStatus, setFirebaseStatus] = useState({ enabled: false, connected: false });
  
  // Internal notes form state
  const [notesInput, setNotesInput] = useState('');
  const [statusInput, setStatusInput] = useState('');

  // Subscribe to real-time lead updates
  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = subscribeToLeads((fetchedLeads) => {
        setLeads(fetchedLeads);
      });
      setFirebaseStatus(getFirebaseConnectionStatus());
      return () => unsubscribe && unsubscribe();
    }
  }, [isAuthenticated]);

  // Handle selected lead details change
  useEffect(() => {
    if (selectedLead) {
      setNotesInput(selectedLead.notes || '');
      setStatusInput(selectedLead.status || 'New');
    } else {
      setNotesInput('');
      setStatusInput('');
    }
  }, [selectedLead]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Default system passcode is "admin" or "1234"
    if (passcode === '1234' || passcode.toLowerCase() === 'admin' || passcode === 'proptech') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect passcode. Try "admin" or "1234"');
    }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    const success = await updateLead(selectedLead.id, {
      notes: notesInput,
      status: statusInput
    });
    if (success) {
      setSelectedLead(prev => ({
        ...prev,
        notes: notesInput,
        status: statusInput
      }));
    }
  };

  const handleDeleteLead = async (id) => {
    if (confirm('Are you sure you want to permanently delete this lead?')) {
      const success = await deleteLead(id);
      if (success) {
        setSelectedLead(null);
      }
    }
  };

  // CSV Exporter for general spreadsheet / Excel upload
  const exportToGeneralCSV = () => {
    if (leads.length === 0) return;
    
    const headers = [
      'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Preferred Contact', 
      'Property of Interest', 'Target Move-in Date', 'Budget', 'Occupants', 
      'Has Pets', 'Pet Details', 'Notes', 'Created At', 'Status'
    ];
    
    const rows = leads.map(l => [
      l.id,
      l.firstName,
      l.lastName,
      l.email,
      l.phone,
      l.contactMethod,
      l.propertyOfInterest,
      l.moveInDate,
      l.budget,
      l.occupants,
      l.hasPets,
      l.petDetails || '',
      l.notes ? l.notes.replace(/,/g, ';') : '', // replace commas to prevent shifting columns
      l.createdAt,
      l.status
    ]);

    downloadCSV('leads_general_export.csv', headers, rows);
  };

  // CSV Exporter mapped directly to Buildium Prospect Import fields
  const exportToBuildiumCSV = () => {
    if (leads.length === 0) return;

    // Buildium Prospect Import Template Headers:
    // First name, Last name, Primary email, Primary phone, Address 1, City, State, Zip code, Property of interest, Target move-in date, Desired rent, Notes
    const headers = [
      'First name',
      'Last name',
      'Primary email',
      'Primary phone',
      'Address 1',
      'City',
      'State',
      'Zip code',
      'Property of interest',
      'Target move-in date',
      'Desired rent',
      'Notes'
    ];

    const rows = leads.map(l => {
      // Split current address if format matches "Street, City, State, Zip"
      let street = l.currentAddress || '';
      let city = '';
      let state = '';
      let zip = '';

      if (l.currentAddress && l.currentAddress.includes(',')) {
        const parts = l.currentAddress.split(',').map(p => p.trim());
        street = parts[0] || '';
        city = parts[1] || '';
        if (parts[2]) {
          // Address state and zip are often combined or separate
          const stateZip = parts[2].trim().split(' ');
          state = stateZip[0] || '';
          zip = stateZip[1] || '';
        }
      }

      // Concatenate other details like Occupants and Pets into Buildium's Notes column
      const buildiumNotes = `Preferred Contact: ${l.contactMethod}. Occupants: ${l.occupants}. Pets: ${l.hasPets === 'Yes' ? 'Yes (' + l.petDetails + ')' : 'No'}. Client Notes: ${l.notes || ''}`;

      return [
        l.firstName,
        l.lastName,
        l.email,
        l.phone,
        street,
        city,
        state,
        zip,
        l.propertyOfInterest,
        l.moveInDate,
        l.budget,
        buildiumNotes.replace(/,/g, ';')
      ];
    });

    downloadCSV('leads_buildium_prospects.csv', headers, rows);
  };

  const downloadCSV = (filename, headers, rows) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search computation
  const filteredLeads = leads.filter(l => {
    const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      fullName.includes(query) || 
      (l.email && l.email.toLowerCase().includes(query)) || 
      (l.phone && l.phone.toLowerCase().includes(query)) || 
      (l.propertyOfInterest && l.propertyOfInterest.toLowerCase().includes(query));
      
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyle = (status) => {
    switch(status) {
      case 'New': return { background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' };
      case 'Contacted': return { background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.3)' };
      case 'Qualified': return { background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' };
      case 'Disqualified': return { background: 'rgba(251, 113, 133, 0.15)', color: '#fb7185', border: '1px solid rgba(251, 113, 133, 0.3)' };
      default: return { background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' };
    }
  };

  // -------------------------------------------------------------
  // RENDER LOGIN GATEWAY
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div style={styles.authContainer} className="animate-fade-in">
        <form onSubmit={handleLogin} style={styles.authCard} className="glass-card pulse-border">
          <div style={styles.authIconWrapper}>
            <Lock size={36} color="var(--primary-hover)" />
          </div>
          <h2 style={styles.authTitle}>Access Admin Portal</h2>
          <p style={styles.authSubtitle}>Enter the passcode to view the spreadsheet and export responses.</p>
          
          <div className="form-group" style={{ width: '100%' }}>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode (try 'admin' or '1234')"
              className="form-input"
              style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: 4 }}
              autoFocus
              required
            />
            {authError && <span className="form-error" style={{ textAlign: 'center' }}>{authError}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER ADMIN PORTAL
  // -------------------------------------------------------------
  return (
    <div style={styles.container} className="animate-fade-in">
      
      {/* Top Header Metrics & Control Bar */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Leads Manager Dashboard</h1>
          <p style={styles.subtitle}>View, edit, and export client intake responses as spreadsheets.</p>
        </div>
        
        {/* Backend Connection Badge */}
        <div 
          style={{
            ...styles.dbBadge,
            borderColor: firebaseStatus.connected ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            background: firebaseStatus.connected ? 'rgba(52, 211, 153, 0.05)' : 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <Database size={16} color={firebaseStatus.connected ? '#34d399' : 'var(--text-muted)'} />
          <span style={{ fontSize: '0.8rem', color: firebaseStatus.connected ? '#34d399' : 'var(--text-muted)' }}>
            {firebaseStatus.connected ? 'Firestore Live Connected' : 'Offline Local Storage Mode'}
          </span>
        </div>
      </header>

      {/* Overview Analytics row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard} className="glass-card">
          <span style={styles.statLabel}><Users size={16} /> Total Leads</span>
          <span style={styles.statValue}>{leads.length}</span>
        </div>
        <div style={styles.statCard} className="glass-card">
          <span style={styles.statLabel}><Clock size={16} /> New Leads</span>
          <span style={styles.statValue}>{leads.filter(l => l.status === 'New').length}</span>
        </div>
        <div style={styles.statCard} className="glass-card">
          <span style={styles.statLabel}><Calendar size={16} /> Contacted</span>
          <span style={styles.statValue}>{leads.filter(l => l.status === 'Contacted').length}</span>
        </div>
      </div>

      {/* Spreadsheet Control Actions Bar */}
      <div style={styles.actionBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, property, email, phone..."
            style={styles.searchInput}
          />
        </div>

        {/* Filter buttons */}
        <div style={styles.filtersWrapper}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Disqualified">Disqualified</option>
          </select>

          {/* Export Dropdown options */}
          <button onClick={exportToGeneralCSV} className="btn btn-secondary" style={styles.actionButton}>
            <Download size={16} /> Export CSV
          </button>
          
          <button onClick={exportToBuildiumCSV} className="btn btn-accent" style={styles.actionButton}>
            <FileSpreadsheet size={16} /> Buildium Export
          </button>
        </div>
      </div>

      {/* Main Grid: Spreadsheet Table + Sidebar details panel */}
      <div style={styles.mainGrid}>
        
        {/* Spreadsheet container */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="spreadsheet-container">
            <table className="spreadsheet-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Property of Interest</th>
                  <th>Budget</th>
                  <th>Move-In Date</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Date Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={styles.emptyCell}>
                      <AlertCircle size={24} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                      No lead records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => setSelectedLead(lead)}
                      className={selectedLead && selectedLead.id === lead.id ? 'selected' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600 }}>{lead.firstName} {lead.lastName}</td>
                      <td>{lead.propertyOfInterest}</td>
                      <td>{lead.budget}</td>
                      <td>{lead.moveInDate}</td>
                      <td>
                        <div style={styles.contactCell}>
                          <span style={{ fontSize: '0.85rem' }}>{lead.phone}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email}</span>
                        </div>
                      </td>
                      <td>
                        <span 
                          style={{
                            ...styles.statusBadge,
                            ...getStatusBadgeStyle(lead.status)
                          }}
                        >
                          {lead.status || 'New'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Lead Details Editing Sidebar */}
        {selectedLead && (
          <div style={styles.sidebar} className="glass-card animate-fade-in">
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Lead Details</h3>
              <button 
                onClick={() => setSelectedLead(null)} 
                style={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.sidebarContent}>
              
              {/* Contact Info Block */}
              <div style={styles.sidebarSection}>
                <h4 style={styles.sidebarSubheading}>Contact Information</h4>
                <div style={styles.detailCard}>
                  <p style={styles.detailRow}><strong>Name:</strong> {selectedLead.firstName} {selectedLead.lastName}</p>
                  <p style={styles.detailRow}><strong>Email:</strong> {selectedLead.email} <a href={`mailto:${selectedLead.email}`}><ExternalLink size={12} color="var(--primary-hover)" /></a></p>
                  <p style={styles.detailRow}><strong>Phone:</strong> {selectedLead.phone} <a href={`tel:${selectedLead.phone}`}><ExternalLink size={12} color="var(--primary-hover)" /></a></p>
                  <p style={styles.detailRow}><strong>Preferred Contact:</strong> {selectedLead.contactMethod}</p>
                  <p style={styles.detailRow}><strong>Current Address:</strong> {selectedLead.currentAddress || 'None provided'}</p>
                </div>
              </div>

              {/* Preferences Block */}
              <div style={styles.sidebarSection}>
                <h4 style={styles.sidebarSubheading}>Preferences</h4>
                <div style={styles.detailCard}>
                  <p style={styles.detailRow}><strong>Property:</strong> {selectedLead.propertyOfInterest}</p>
                  <p style={styles.detailRow}><strong>Move-In Target:</strong> {selectedLead.moveInDate}</p>
                  <p style={styles.detailRow}><strong>Rent Budget:</strong> {selectedLead.budget}</p>
                  <p style={styles.detailRow}><strong>Occupants:</strong> {selectedLead.occupants}</p>
                  <p style={styles.detailRow}><strong>Pets:</strong> {selectedLead.hasPets} {selectedLead.hasPets === 'Yes' && `(${selectedLead.petDetails})`}</p>
                </div>
              </div>

              {/* Admin Note / Status Editor Form */}
              <div style={styles.sidebarSection}>
                <h4 style={styles.sidebarSubheading}>Update Status & Admin Notes</h4>
                
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Lead Status</label>
                  <select 
                    value={statusInput} 
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="form-input"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Disqualified">Disqualified</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Notes & Follow-up History</label>
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="form-input"
                    style={{ minHeight: 110, fontSize: '0.88rem', resize: 'vertical' }}
                    placeholder="Enter details about call history, credit checks, next steps etc."
                  />
                </div>

                <div style={styles.sidebarActions}>
                  <button 
                    onClick={handleUpdateLead} 
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '10px 16px', fontSize: '0.88rem' }}
                  >
                    Save Notes
                  </button>
                  <button 
                    onClick={() => handleDeleteLead(selectedLead.id)} 
                    className="btn btn-secondary"
                    style={{ padding: '10px 12px', border: '1px solid rgba(244, 63, 94, 0.2)', color: 'var(--danger)' }}
                    title="Delete Lead"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Scoped layout styles for Dashboard
const styles = {
  container: {
    maxWidth: 1200,
    width: '100%',
    margin: '0 auto',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: '1.8rem',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
  },
  dbBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
  },
  statsRow: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  statLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#fff',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    flex: 1,
    minWidth: 300,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 48px',
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid var(--input-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  filtersWrapper: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '12px 36px 12px 16px',
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid var(--input-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px',
    outline: 'none',
    cursor: 'pointer',
  },
  actionButton: {
    padding: '10px 16px',
    fontSize: '0.88rem',
  },
  contactCell: {
    display: 'flex',
    flexDirection: 'column',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: 6,
    fontSize: '0.78rem',
    fontWeight: 600,
    textAlign: 'center',
    display: 'inline-block',
  },
  emptyCell: {
    textAlign: 'center',
    padding: '48px 0',
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
  },
  mainGrid: {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  sidebar: {
    width: 360,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    background: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: 12,
  },
  sidebarTitle: {
    fontSize: '1.2rem',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 4,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  sidebarContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sidebarSubheading: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    fontWeight: 700,
  },
  detailCard: {
    background: 'rgba(0, 0, 0, 0.2)',
    padding: 14,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: '0.88rem',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--text-muted)',
  },
  sidebarActions: {
    display: 'flex',
    gap: 12,
  },
  authContainer: {
    maxWidth: 400,
    width: '100%',
    margin: '120px auto',
    padding: '0 20px',
  },
  authCard: {
    padding: '40px 32px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  authIconWrapper: {
    background: 'var(--primary-light)',
    padding: 16,
    borderRadius: '50%',
  },
  authTitle: {
    fontSize: '1.6rem',
  },
  authSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  }
};
