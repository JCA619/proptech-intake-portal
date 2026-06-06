import { useState } from 'react';
import {
  User, Mail, MapPin, Phone, Home, Briefcase, Smartphone,
  Calendar, MessageSquare, UserPlus, CheckCircle, Send
} from 'lucide-react';
import { saveLead } from '../firebase';

const emptyContact = () => ({
  firstName: '', lastName: '', address: '',
  homePhone: '', workPhone: '', cellPhone: '',
  email: '', emailType: '', dob: ''
});

export default function IntakeForm() {
  const [primary, setPrimary] = useState(emptyContact());
  const [secondary, setSecondary] = useState(emptyContact());
  const [hasSecondary, setHasSecondary] = useState(false);
  const [contactMethods, setContactMethods] = useState({ phone: false, text: false, email: false });
  const [bestTimeToCall, setBestTimeToCall] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const updatePrimary = (field, value) => {
    setPrimary((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    if ((field === 'homePhone' || field === 'workPhone' || field === 'cellPhone') && errors.phone) {
      setErrors((e) => ({ ...e, phone: undefined }));
    }
  };
  const updateSecondary = (field, value) => setSecondary((s) => ({ ...s, [field]: value }));
  const toggleMethod = (key) => setContactMethods((m) => ({ ...m, [key]: !m[key] }));

  const validate = () => {
    const e = {};
    if (!primary.firstName.trim()) e.firstName = 'First name is required';
    if (!primary.lastName.trim()) e.lastName = 'Last name is required';
    if (!primary.homePhone.trim() && !primary.workPhone.trim() && !primary.cellPhone.trim()) {
      e.phone = 'Please provide at least one phone number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setIsSubmitting(true);
    const selectedMethods = Object.keys(contactMethods).filter((k) => contactMethods[k]);
    const payload = {
      firstName: primary.firstName, lastName: primary.lastName,
      email: primary.email, emailType: primary.emailType, address: primary.address,
      homePhone: primary.homePhone, workPhone: primary.workPhone, cellPhone: primary.cellPhone,
      dob: primary.dob,
      contactMethods: selectedMethods,
      contactMethod: selectedMethods.join(', '),
      bestTimeToCall: contactMethods.phone ? bestTimeToCall : '',
      hasSecondary, secondary: hasSecondary ? secondary : null,
      notes
    };
    try {
      await saveLead(payload);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was a problem submitting your form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPrimary(emptyContact()); setSecondary(emptyContact()); setHasSecondary(false);
    setContactMethods({ phone: false, text: false, email: false });
    setBestTimeToCall(''); setNotes(''); setErrors({}); setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div style={styles.successContainer} className="animate-fade-in">
        <div style={styles.successCard} className="glass-card">
          <div style={styles.checkmarkWrapper}><CheckCircle size={80} color="var(--accent)" /></div>
          <h2 style={styles.successTitle}>Thank You!</h2>
          <p style={styles.successText}>
            Thank you, <strong>{primary.firstName}</strong>. Your contact information has been
            securely recorded. A member of our team will be in touch shortly.
          </p>
          <button onClick={resetForm} style={styles.resetBtn} className="btn-secondary">
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  const renderContactFields = (data, updater, prefix, isPrimary) => (
    <>
      <div style={styles.row}>
        <div style={styles.col}>
          <label style={styles.label}><User size={14} /> First Name {isPrimary && <span style={styles.req}>*</span>}</label>
          <input style={{ ...styles.input, ...(isPrimary && errors.firstName ? styles.inputError : {}) }}
            value={data.firstName} onChange={(e) => updater('firstName', e.target.value)} placeholder="First" />
          {isPrimary && errors.firstName && <span style={styles.errorText}>{errors.firstName}</span>}
        </div>
        <div style={styles.col}>
          <label style={styles.label}><User size={14} /> Last Name {isPrimary && <span style={styles.req}>*</span>}</label>
          <input style={{ ...styles.input, ...(isPrimary && errors.lastName ? styles.inputError : {}) }}
            value={data.lastName} onChange={(e) => updater('lastName', e.target.value)} placeholder="Last" />
          {isPrimary && errors.lastName && <span style={styles.errorText}>{errors.lastName}</span>}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}><MapPin size={14} /> Address</label>
        <input style={styles.input} value={data.address}
          onChange={(e) => updater('address', e.target.value)} placeholder="Street, City, State, ZIP" />
      </div>

      <div style={styles.row3}>
        <div style={styles.col}>
          <label style={styles.label}><Home size={14} /> Home</label>
          <input style={styles.input} value={data.homePhone}
            onChange={(e) => updater('homePhone', e.target.value)} placeholder="(___) ___-____" />
        </div>
        <div style={styles.col}>
          <label style={styles.label}><Briefcase size={14} /> Work</label>
          <input style={styles.input} value={data.workPhone}
            onChange={(e) => updater('workPhone', e.target.value)} placeholder="(___) ___-____" />
        </div>
        <div style={styles.col}>
          <label style={styles.label}><Smartphone size={14} /> Cell</label>
          <input style={styles.input} value={data.cellPhone}
            onChange={(e) => updater('cellPhone', e.target.value)} placeholder="(___) ___-____" />
        </div>
      </div>
      {isPrimary && errors.phone && <span style={styles.errorText}>{errors.phone}</span>}

      <div style={styles.fieldGroup}>
        <label style={styles.label}><Mail size={14} /> E-mail</label>
        <input style={styles.input} type="email" value={data.email}
          onChange={(e) => updater('email', e.target.value)} placeholder="you@example.com" />
        <div style={styles.inlineRadios}>
          {['work', 'personal'].map((t) => (
            <label key={t} style={styles.inlineRadioLabel}>
              <input type="radio" name={`${prefix}-emailType`} checked={data.emailType === t}
                onChange={() => updater('emailType', t)} />
              <span style={{ textTransform: 'capitalize' }}>{t}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}><Calendar size={14} /> Date of Birth</label>
        <input style={styles.input} type="date" value={data.dob}
          onChange={(e) => updater('dob', e.target.value)} />
      </div>
    </>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoContainer} className="logo-hover-effect">
          {!logoError ? (
            <img src="logo.svg" alt="5RG Realty" style={styles.logoImg} className="brand-logo"
              onError={() => setLogoError(true)} />
          ) : (
            <span style={styles.logoText} className="brand-display">5RG REALTY</span>
          )}
        </div>
        <h1 style={styles.title} className="brand-display">Contact Info Sheet</h1>
        <p style={styles.subtitle}>Please share your contact details so our team can reach you.</p>
      </header>

      <form onSubmit={handleSubmit} style={styles.formCard} className="glass-card animate-fade-in">
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}><User size={18} /> First Contact</h3>
          {renderContactFields(primary, updatePrimary, 'primary', true)}
        </section>

        <section style={styles.section}>
          <label style={styles.toggleRow} className="toggle-row">
            <input type="checkbox" checked={hasSecondary}
              onChange={() => setHasSecondary((v) => !v)} style={styles.checkboxLg} />
            <span style={styles.toggleLabel}><UserPlus size={16} /> Add a secondary contact</span>
          </label>
          {hasSecondary && (
            <div style={styles.secondaryWrap} className="animate-fade-in">
              <h3 style={styles.sectionTitle}><User size={18} /> Secondary Contact</h3>
              {renderContactFields(secondary, updateSecondary, 'secondary', false)}
            </div>
          )}
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}><Phone size={18} /> Contact Method</h3>
          <p style={styles.sectionSubtitle}>Check all that apply.</p>
          <label style={styles.checkRow} className="check-row">
            <input type="checkbox" checked={contactMethods.phone}
              onChange={() => toggleMethod('phone')} style={styles.checkbox} />
            <span>Phone &mdash; best time to call</span>
            {contactMethods.phone && (
              <input style={styles.inlineInput} value={bestTimeToCall}
                onChange={(e) => setBestTimeToCall(e.target.value)} placeholder="e.g. weekday mornings" />
            )}
          </label>
          <label style={styles.checkRow} className="check-row">
            <input type="checkbox" checked={contactMethods.text}
              onChange={() => toggleMethod('text')} style={styles.checkbox} />
            <span>Text message</span>
          </label>
          <label style={styles.checkRow} className="check-row">
            <input type="checkbox" checked={contactMethods.email}
              onChange={() => toggleMethod('email')} style={styles.checkbox} />
            <span>Email</span>
          </label>
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}><MessageSquare size={18} /> Notes</h3>
          <textarea style={styles.textarea} value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else you'd like us to know..." rows={4} />
        </section>

        <button type="submit" style={styles.submitBtn} className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : (<><Send size={18} /> Submit</>)}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { width: '100%', maxWidth: 760, margin: '0 auto', padding: '40px 20px' },
  header: { textAlign: 'center', marginBottom: 32 },
  logoContainer: { display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  logoImg: { height: 64, width: 'auto', maxWidth: '240px' },
  logoTextCircle: { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-red) 0%, var(--brand-red-alt) 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' },
  logoText: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' },
  title: { fontSize: '2rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-main)' },
  subtitle: { fontSize: '1rem', color: 'var(--text-muted)', margin: 0 },
  formCard: { padding: '32px', borderRadius: 'var(--radius-md)' },
  section: { paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--card-border)' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px' },
  sectionSubtitle: { fontSize: '0.85rem', color: 'var(--text-muted)', margin: '-10px 0 14px' },
  row: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 },
  row3: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 },
  col: { flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column' },
  fieldGroup: { display: 'flex', flexDirection: 'column', marginBottom: 16 },
  label: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 },
  req: { color: 'var(--danger)' },
  input: { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', color: 'var(--text-main)', fontSize: '0.95rem', fontFamily: 'var(--font-family)', outline: 'none', width: '100%', boxSizing: 'border-box' },
  inputError: { borderColor: 'var(--danger)' },
  errorText: { color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4 },
  textarea: { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', color: 'var(--text-main)', fontSize: '0.95rem', fontFamily: 'var(--font-family)', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical' },
  inlineRadios: { display: 'flex', gap: 18, marginTop: 8 },
  inlineRadioLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 0' },
  toggleLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' },
  checkboxLg: { width: 20, height: 20, accentColor: 'var(--primary)', cursor: 'pointer' },
  secondaryWrap: { marginTop: 20, paddingTop: 20, borderTop: '1px dashed var(--card-border)' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 0', fontSize: '0.95rem', color: 'var(--text-main)', cursor: 'pointer' },
  checkbox: { width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' },
  inlineInput: { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-main)', fontSize: '0.9rem', fontFamily: 'var(--font-family)', outline: 'none', marginLeft: 'auto', minWidth: 200 },
  submitBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 700, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff', marginTop: 8, background: 'linear-gradient(135deg, var(--brand-red) 0%, var(--brand-red-alt) 100%)' },
  successContainer: { width: '100%', maxWidth: 560, margin: '0 auto', padding: '60px 20px' },
  successCard: { padding: '48px 32px', borderRadius: 'var(--radius-md)', textAlign: 'center' },
  checkmarkWrapper: { marginBottom: 20 },
  successTitle: { fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px' },
  successText: { fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 28px' },
  resetBtn: { padding: '12px 24px', fontSize: '0.95rem', fontWeight: 600, borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-main)' }
};
