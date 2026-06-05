import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Home, 
  Calendar, 
  DollarSign, 
  Users, 
  MapPin, 
  PawPrint, 
  MessageSquare, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import { saveLead } from '../firebase';

export default function IntakeForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    contactMethod: 'Email',
    propertyOfInterest: '',
    moveInDate: '',
    budget: '',
    currentAddress: '',
    occupants: '1 Adult',
    hasPets: 'No',
    petDetails: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Input validator
  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s-()]{7,15}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }
    
    if (currentStep === 2) {
      if (!formData.propertyOfInterest.trim()) {
        newErrors.propertyOfInterest = 'Property or location of interest is required';
      }
      if (!formData.moveInDate) {
        newErrors.moveInDate = 'Desired move-in date is required';
      }
      if (!formData.budget) {
        newErrors.budget = 'Please select or enter your budget range';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    try {
      await saveLead(formData);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was a problem submitting your form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div style={styles.successContainer} className="animate-fade-in">
        <div style={styles.successCard} className="glass-card">
          <div style={styles.checkmarkWrapper}>
            <CheckCircle size={80} color="var(--accent)" />
          </div>
          <h2 style={styles.successTitle}>Inquiry Submitted!</h2>
          <p style={styles.successText}>
            Thank you, <strong>{formData.firstName}</strong>. Your information has been securely recorded. 
            We will review your details and reach out to you via <strong>{formData.contactMethod}</strong> shortly.
          </p>
          <div style={styles.divider} />
          <div style={styles.summaryBox}>
            <h4 style={styles.summaryTitle}>Summary of details:</h4>
            <p style={styles.summaryItem}><strong>Preferred Property:</strong> {formData.propertyOfInterest}</p>
            <p style={styles.summaryItem}><strong>Move-In Target:</strong> {formData.moveInDate}</p>
            <p style={styles.summaryItem}><strong>Preferred Contact:</strong> {formData.phone} ({formData.contactMethod})</p>
          </div>
          <button 
            onClick={() => {
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                contactMethod: 'Email',
                propertyOfInterest: '',
                moveInDate: '',
                budget: '',
                currentAddress: '',
                occupants: '1 Adult',
                hasPets: 'No',
                petDetails: '',
                notes: ''
              });
              setStep(1);
              setIsSubmitted(false);
            }} 
            className="btn btn-primary"
            style={{ marginTop: 24, width: '100%' }}
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoContainer} className="logo-hover-effect">
          {!logoError ? (
            <img 
              src="logo.svg" 
              alt="5RG Realty Logo" 
              style={styles.logoImg} 
              onError={() => setLogoError(true)}
            />
          ) : (
            <div style={styles.logoTextCircle}>5RG</div>
          )}
          <span style={styles.logoText}>5RG Realty</span>
        </div>
        <h1 style={styles.title}>Client Connection Portal</h1>
        <p style={styles.subtitle}>Let us know your preferences so we can guide you to your next home.</p>
      </header>

      {/* Progress Stepper */}
      <div style={styles.stepperContainer}>
        <div style={styles.stepIndicator}>
          <div style={{...styles.stepCircle, ...(step >= 1 ? styles.stepCircleActive : {})}}>
            {step > 1 ? <CheckCircle size={18} /> : '1'}
          </div>
          <span style={{...styles.stepLabel, ...(step === 1 ? styles.stepLabelActive : {})}}>Contact</span>
        </div>
        <div style={{...styles.stepLine, ...(step >= 2 ? styles.stepLineActive : {})}} />
        <div style={styles.stepIndicator}>
          <div style={{...styles.stepCircle, ...(step >= 2 ? styles.stepCircleActive : {})}}>
            {step > 2 ? <CheckCircle size={18} /> : '2'}
          </div>
          <span style={{...styles.stepLabel, ...(step === 2 ? styles.stepLabelActive : {})}}>Preferences</span>
        </div>
        <div style={{...styles.stepLine, ...(step >= 3 ? styles.stepLineActive : {})}} />
        <div style={styles.stepIndicator}>
          <div style={{...styles.stepCircle, ...(step >= 3 ? styles.stepCircleActive : {})}}>3</div>
          <span style={{...styles.stepLabel, ...(step === 3 ? styles.stepLabelActive : {})}}>Details</span>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} style={styles.formCard} className="glass-card animate-fade-in pulse-border">
        
        {/* STEP 1: CONTACT INFO */}
        {step === 1 && (
          <div style={styles.stepSection} className="animate-fade-in">
            <h3 style={styles.sectionTitle}>1. Basic Contact Info</h3>
            <p style={styles.sectionSubtitle}>Please share how we can reach you.</p>

            <div style={styles.row}>
              <div style={styles.col} className="form-group">
                <label className="form-label">
                  <User size={14} /> First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="e.g. Jane"
                  className="form-input"
                  required
                />
                {errors.firstName && <span className="form-error">{errors.firstName}</span>}
              </div>
              <div style={styles.col} className="form-group">
                <label className="form-label">
                  <User size={14} /> Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="e.g. Doe"
                  className="form-input"
                  required
                />
                {errors.lastName && <span className="form-error">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mail size={14} /> Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="jane.doe@example.com"
                className="form-input"
                required
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                <Phone size={14} /> Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(555) 000-0000"
                className="form-input"
                required
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                <MessageCircle size={14} /> Preferred Contact Method
              </label>
              <div style={styles.radioGroup}>
                {['Email', 'Phone Call', 'Text'].map((method) => (
                  <label 
                    key={method} 
                    style={{
                      ...styles.radioLabel, 
                      ...(formData.contactMethod === method ? styles.radioLabelActive : {})
                    }}
                  >
                    <input
                      type="radio"
                      name="contactMethod"
                      value={method}
                      checked={formData.contactMethod === method}
                      onChange={handleInputChange}
                      style={styles.radioInput}
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: RENTAL PREFERENCES */}
        {step === 2 && (
          <div style={styles.stepSection} className="animate-fade-in">
            <h3 style={styles.sectionTitle}>2. Housing Preferences</h3>
            <p style={styles.sectionSubtitle}>Help us find the right fit for your needs.</p>

            <div className="form-group">
              <label className="form-label">
                <Home size={14} /> Property or Location of Interest *
              </label>
              <input
                type="text"
                name="propertyOfInterest"
                value={formData.propertyOfInterest}
                onChange={handleInputChange}
                placeholder="e.g. Sunset Heights, Oakwood Apts, or City Centre"
                className="form-input"
                required
              />
              {errors.propertyOfInterest && <span className="form-error">{errors.propertyOfInterest}</span>}
            </div>

            <div style={styles.row}>
              <div style={styles.col} className="form-group">
                <label className="form-label">
                  <Calendar size={14} /> Target Move-In Date *
                </label>
                <input
                  type="date"
                  name="moveInDate"
                  value={formData.moveInDate}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
                {errors.moveInDate && <span className="form-error">{errors.moveInDate}</span>}
              </div>
              <div style={styles.col} className="form-group">
                <label className="form-label">
                  <DollarSign size={14} /> Desired Rent Budget *
                </label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Select Rent Budget...</option>
                  <option value="Under $1,500">Under $1,500</option>
                  <option value="$1,500 - $2,000">$1,500 - $2,000</option>
                  <option value="$2,000 - $2,500">$2,000 - $2,500</option>
                  <option value="$2,500 - $3,000">$2,500 - $3,000</option>
                  <option value="$3,000 - $4,000">$3,000 - $4,000</option>
                  <option value="$4,000+">$4,000+</option>
                </select>
                {errors.budget && <span className="form-error">{errors.budget}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Users size={14} /> Number of Occupants
              </label>
              <select
                name="occupants"
                value={formData.occupants}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="1 Adult">1 Adult</option>
                <option value="2 Adults">2 Adults</option>
                <option value="2 Adults + Children">2 Adults + Children</option>
                <option value="1 Adult + Children">1 Adult + Children</option>
                <option value="3+ Adults">3+ Adults</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: ADDITIONAL DETAILS */}
        {step === 3 && (
          <div style={styles.stepSection} className="animate-fade-in">
            <h3 style={styles.sectionTitle}>3. Final Details</h3>
            <p style={styles.sectionSubtitle}>Any other details you want to share with us?</p>

            <div className="form-group">
              <label className="form-label">
                <MapPin size={14} /> Current Address (Optional)
              </label>
              <input
                type="text"
                name="currentAddress"
                value={formData.currentAddress}
                onChange={handleInputChange}
                placeholder="123 Main St, City, State, Zip"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <PawPrint size={14} /> Do you have any pets?
              </label>
              <div style={styles.radioGroup}>
                {['No', 'Yes'].map((option) => (
                  <label 
                    key={option} 
                    style={{
                      ...styles.radioLabel, 
                      ...(formData.hasPets === option ? styles.radioLabelActive : {})
                    }}
                  >
                    <input
                      type="radio"
                      name="hasPets"
                      value={option}
                      checked={formData.hasPets === option}
                      onChange={handleInputChange}
                      style={styles.radioInput}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {formData.hasPets === 'Yes' && (
              <div className="form-group animate-fade-in">
                <label className="form-label">Pet Breed & Weight Info</label>
                <input
                  type="text"
                  name="petDetails"
                  value={formData.petDetails}
                  onChange={handleInputChange}
                  placeholder="e.g. Golden Retriever (45 lbs), Cat (10 lbs)"
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <MessageSquare size={14} /> Additional Notes / Special Requests
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Write any questions, features of interest (e.g., parking, pool, gym), or details about your search here..."
                className="form-input"
                style={{ minHeight: 100, resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {/* Form Footer Action Buttons */}
        <div style={styles.formActions}>
          {step > 1 ? (
            <button 
              type="button" 
              onClick={handleBack} 
              className="btn btn-secondary"
              style={styles.actionBtn}
            >
              <ArrowLeft size={18} /> Back
            </button>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {step < 3 ? (
            <button 
              type="button" 
              onClick={handleNext} 
              className="btn btn-primary"
              style={styles.actionBtn}
            >
              Next <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-accent"
              style={styles.actionBtn}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// Scoped React Styles for Clean Grid Layout
const styles = {
  container: {
    maxWidth: 640,
    width: '100%',
    margin: '0 auto',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  header: {
    textAlign: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoImg: {
    height: 48,
    width: 48,
    borderRadius: '50%',
    objectFit: 'contain',
    background: '#fff',
    padding: 2,
    border: '2px solid var(--primary)',
    transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  logoTextCircle: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.95rem',
    border: '2px solid rgba(255, 255, 255, 0.1)',
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    background: 'linear-gradient(135deg, #fff 30%, var(--text-muted) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  title: {
    fontSize: '2rem',
    marginBottom: 8,
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '1rem',
  },
  stepperContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
  },
  stepIndicator: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
  },
  stepCircleActive: {
    background: 'var(--primary)',
    borderColor: 'var(--primary-hover)',
    color: '#fff',
    boxShadow: '0 0 12px var(--primary-light)',
  },
  stepLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  stepLabelActive: {
    color: 'var(--text-main)',
  },
  stepLine: {
    flex: 1,
    height: 2,
    background: 'rgba(255,255,255,0.08)',
    marginHorizontal: 8,
    marginTop: -22, // Align horizontally with circle centers
    transition: 'all 0.3s ease',
  },
  stepLineActive: {
    background: 'var(--primary)',
  },
  formCard: {
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  stepSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  sectionTitle: {
    fontSize: '1.25rem',
  },
  sectionSubtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.88rem',
    marginTop: -16,
  },
  row: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  col: {
    flex: 1,
    minWidth: 240,
  },
  radioGroup: {
    display: 'flex',
    gap: 12,
  },
  radioLabel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  },
  radioLabelActive: {
    background: 'var(--primary-light)',
    borderColor: 'var(--primary-hover)',
    color: '#fff',
  },
  radioInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: 24,
  },
  actionBtn: {
    flex: 1,
    maxWidth: 200,
  },
  successContainer: {
    maxWidth: 500,
    width: '100%',
    margin: '80px auto',
    padding: '0 20px',
  },
  successCard: {
    padding: '40px 32px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  checkmarkWrapper: {
    background: 'var(--accent-light)',
    borderRadius: '50%',
    padding: 12,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: '1.8rem',
  },
  successText: {
    fontSize: '0.98rem',
    color: 'var(--text-muted)',
  },
  divider: {
    width: '100%',
    height: 1,
    background: 'rgba(255, 255, 255, 0.08)',
    margin: '8px 0',
  },
  summaryBox: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 'var(--radius-md)',
    padding: 16,
    width: '100%',
    textAlign: 'left',
    fontSize: '0.88rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  summaryTitle: {
    fontSize: '0.95rem',
    marginBottom: 4,
  },
  summaryItem: {
    color: 'var(--text-muted)',
  }
};
