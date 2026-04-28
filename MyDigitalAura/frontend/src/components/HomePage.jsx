import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../ThemeContext';
import { authAPI } from '../api';
import './HomePage.css';

// ─── Text-based CAPTCHA ───────────────────────────────────────────────────────
const CAPTCHA_WORDS = [
  'secure', 'portal', 'student', 'login', 'verify', 'access',
  'campus', 'digital', 'aura', 'profile', 'project', 'submit',
  'review', 'grade', 'mentor', 'skill', 'intern', 'badge',
];

function generateCaptcha() {
  const word = CAPTCHA_WORDS[Math.floor(Math.random() * CAPTCHA_WORDS.length)];
  return { word };
}
// ─────────────────────────────────────────────────────────────────────────────

function HomePage({ onLogin }) {
  const { theme, toggleTheme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login | register | forgot
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', middleName: '',
    lastName: '', confirmPassword: '', role: 'student'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Text CAPTCHA state ──
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // ── Registration OTP state ──
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const timerRef = useRef(null);

  // ── MFA login state ──
  // loginStep: 'credentials' | 'mfa'
  const [loginStep, setLoginStep] = useState('credentials');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaTimer, setMfaTimer] = useState(0);
  const mfaTimerRef = useRef(null);

  // ── Forgot password state ──
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=otp+newpass
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    if (otpTimer > 0) {
      timerRef.current = setTimeout(() => setOtpTimer(t => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [otpTimer]);

  useEffect(() => {
    if (mfaTimer > 0) {
      mfaTimerRef.current = setTimeout(() => setMfaTimer(t => t - 1), 1000);
    }
    return () => clearTimeout(mfaTimerRef.current);
  }, [mfaTimer]);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError('');
  };

  // ── Registration OTP handlers ──
  const handleSendOTP = async () => {
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Enter a valid email to receive OTP.');
      return;
    }
    setOtpLoading(true);
    try {
      await authAPI.sendOtp(formData.email);
      setOtpSent(true);
      setOtpTimer(60);
      setOtpError('');
      setError('');
      setSuccess('OTP sent to ' + formData.email);
    } catch (err) {
      const msg = err.response?.data?.error || '';
      if (msg.includes('already registered')) {
        setError('This email is already registered. Please login.');
      } else {
        setError(msg || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput.trim()) { setOtpError('Enter the OTP.'); return; }
    setOtpLoading(true);
    try {
      await authAPI.verifyOtp(formData.email, otpInput.trim());
      setOtpVerified(true);
      setOtpError('');
      setSuccess('✅ Email verified successfully!');
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      await authAPI.sendOtp(formData.email);
      setOtpTimer(60);
      setOtpInput('');
      setOtpError('');
      setSuccess('OTP resent to ' + formData.email);
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Forgot password handlers ──
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) { setError('Enter your registered email.'); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(formData.email);
      setForgotStep(2);
      setOtpTimer(60);
      setSuccess('OTP sent to ' + formData.email);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Email not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim()) { setError('Enter the OTP.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(formData.email, forgotOtp, newPassword);
      setSuccess('✅ Password reset successfully! Please login.');
      setAuthMode('login');
      setForgotStep(1);
      setForgotOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── MFA login handlers ──
  const handleLoginSendMfa = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim()) { setError('Email is required!'); return; }
    if (!formData.password.trim()) { setError('Password is required!'); return; }

    // Validate text CAPTCHA
    if (captchaInput.trim() === '') {
      setCaptchaError('Please type the word shown above.');
      return;
    }
    if (captchaInput.trim().toLowerCase() !== captcha.word.toLowerCase()) {
      setCaptchaError('❌ Incorrect word. Please try again.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      await authAPI.loginSendOtp({ email: formData.email, password: formData.password });
      setLoginStep('mfa');
      setMfaTimer(120);
      setMfaCode('');
      setMfaError('');
      setSuccess('🔐 MFA code sent to your registered email. Check your inbox.');
      setError('');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setError('Invalid email or password.');
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      }
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleLoginVerifyMfa = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) { setMfaError('Please enter the MFA code.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.loginVerifyOtp(formData.email, mfaCode.trim());
      const { token, role, userId, name, email } = res.data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem(`token_${role}`, token);
      sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('role', role);
      onLogin({ token, role, userId, name, email });
    } catch (err) {
      setMfaError(err.response?.data?.error || 'Invalid or expired MFA code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendMfa = async () => {
    setLoading(true);
    try {
      await authAPI.loginSendOtp({ email: formData.email, password: formData.password });
      setMfaTimer(120);
      setMfaCode('');
      setMfaError('');
      setSuccess('MFA code resent to ' + formData.email);
    } catch (err) {
      setMfaError(err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Register submit ──
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.firstName.trim()) { setError('First name is required!'); setLoading(false); return; }
    if (!formData.lastName.trim()) { setError('Last name is required!'); setLoading(false); return; }
    if (!formData.email.trim()) { setError('Email is required!'); setLoading(false); return; }
    if (!/\S+@\S+\.\S+/.test(formData.email)) { setError('Enter a valid email!'); setLoading(false); return; }
    if (!formData.password.trim()) { setError('Password is required!'); setLoading(false); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters!'); setLoading(false); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match!'); setLoading(false); return; }
    if (!otpSent) { setError('Please send OTP to verify your email first.'); setLoading(false); return; }
    if (!otpVerified) { setError('Please verify your email OTP before registering.'); setLoading(false); return; }

    try {
      const res = await authAPI.register({
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      const { token, role, userId, name, email } = res.data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem(`token_${role}`, token);
      sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('role', role);
      onLogin({ token, role, userId, name, email });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleOpenAuth = (mode) => {
    setShowAuth(true);
    setAuthMode(mode);
    setError('');
    setSuccess('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpInput('');
    setCaptchaInput('');
    setCaptchaError('');
    setForgotStep(1);
    setForgotOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setLoginStep('credentials');
    setMfaCode('');
    setMfaError('');
    refreshCaptcha();
    setFormData({ email: '', password: '', firstName: '', middleName: '', lastName: '', confirmPassword: '', role: 'student' });
  };

  const switchToLogin = () => {
    setAuthMode('login');
    setError('');
    setSuccess('');
    setLoginStep('credentials');
    setMfaCode('');
    setMfaError('');
    refreshCaptcha();
  };

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="logo">🎓 MyDigitalAura</div>
        <div className="nav-buttons">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => handleOpenAuth('login')}>Login</button>
          <button onClick={() => handleOpenAuth('register')}>Register</button>
        </div>
      </nav>

      <div className="hero">
        <h1>Build Your Academic Portfolio</h1>
        <p>Showcase your projects, track progress, and get feedback from educators</p>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">👨🎓</div>
          <h3>Student Dashboard</h3>
          <p>Upload projects, track milestones, and view feedback</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👩🏫</div>
          <h3>Admin Dashboard</h3>
          <p>Review submissions, provide feedback, and approve projects</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Progress Tracking</h3>
          <p>Monitor your academic journey with detailed analytics</p>
        </div>
      </div>

      {showAuth && (
        <div className="auth-modal" onClick={() => setShowAuth(false)}>
          <div className="auth-container" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAuth(false)}>×</button>
            <div style={{ flex: 1 }}>

              {/* ── Forgot Password ── */}
              {authMode === 'forgot' && (
                <div>
                  <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>🔑 Reset Password</h3>
                  {error && <div className="auth-alert auth-alert-error">{error}</div>}
                  {success && <div className="auth-alert auth-alert-success">{success}</div>}

                  {forgotStep === 1 ? (
                    <form onSubmit={handleForgotSendOtp}>
                      <div className="form-group">
                        <label>Registered Email</label>
                        <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
                      </div>
                      <button type="submit" className="submit-btn" disabled={loading}>{loading ? '⏳ Sending...' : 'Send OTP'}</button>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotReset}>
                      <div className="form-group">
                        <label>OTP</label>
                        <input type="text" placeholder="Enter 6-digit OTP" value={forgotOtp} onChange={e => { setForgotOtp(e.target.value); setError(''); }} maxLength={6} />
                      </div>
                      <div className="form-group">
                        <label>New Password</label>
                        <input type="password" placeholder="Min 6 characters" value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(''); }} />
                      </div>
                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" placeholder="Re-enter new password" value={confirmNewPassword} onChange={e => { setConfirmNewPassword(e.target.value); setError(''); }} />
                      </div>
                      <button type="submit" className="submit-btn" disabled={loading}>{loading ? '⏳ Resetting...' : 'Reset Password'}</button>
                    </form>
                  )}
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <span onClick={() => { setAuthMode('login'); setError(''); setSuccess(''); setForgotStep(1); setLoginStep('credentials'); }} style={{ color: '#667eea', cursor: 'pointer', fontWeight: '600' }}>← Back to Login</span>
                  </div>
                </div>
              )}

              {/* ── Login / Register tabs ── */}
              {authMode !== 'forgot' && (
                <div className="auth-tabs">
                  <button
                    className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                    onClick={switchToLogin}
                  >🔐 Login</button>
                  <button
                    className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                    onClick={() => { setAuthMode('register'); setError(''); setSuccess(''); setOtpSent(false); setOtpVerified(false); setOtpInput(''); }}
                  >📝 Register</button>
                </div>
              )}

              {/* ── LOGIN ── */}
              {authMode === 'login' && (
                <>
                  {error && <div className="auth-alert auth-alert-error">{error}</div>}
                  {success && <div className="auth-alert auth-alert-success">{success}</div>}

                  {/* Step 1 — Credentials + CAPTCHA */}
                  {loginStep === 'credentials' && (
                    <form className="auth-form" onSubmit={handleLoginSendMfa}>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required />
                      </div>

                      {/* Text CAPTCHA */}
                      <div className="captcha-section">
                        <div className="captcha-header">🔒 Security Check</div>
                        <div className="captcha-box text-captcha-box">
                          <span className="captcha-word">{captcha.word}</span>
                          <button type="button" className="captcha-refresh" onClick={refreshCaptcha} title="Refresh">🔄</button>
                        </div>
                        <input
                          type="text"
                          placeholder="Type the word above"
                          value={captchaInput}
                          onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError(''); }}
                          className="captcha-input"
                          autoComplete="off"
                        />
                        {captchaError && <p className="captcha-error">{captchaError}</p>}
                      </div>

                      <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? '⏳ Verifying...' : '🔐 Continue'}
                      </button>

                      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#6c757d' }}>
                        <p>
                          Don't have an account?{' '}
                          <span onClick={() => { setAuthMode('register'); setError(''); setSuccess(''); }} style={{ color: '#667eea', cursor: 'pointer', fontWeight: '600' }}>Register</span>
                          <br />
                          <span onClick={() => { setAuthMode('forgot'); setError(''); setSuccess(''); setForgotStep(1); }} style={{ color: '#667eea', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>Forgot Password?</span>
                        </p>
                      </div>
                    </form>
                  )}

                  {/* Step 2 — MFA OTP */}
                  {loginStep === 'mfa' && (
                    <form className="auth-form" onSubmit={handleLoginVerifyMfa}>
                      <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📧</div>
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Enter MFA Code</h4>
                        <p style={{ color: '#6c757d', fontSize: '0.88rem' }}>
                          A 6-digit verification code was sent to<br />
                          <strong style={{ color: 'var(--text-primary)' }}>{formData.email}</strong>
                        </p>
                      </div>

                      <div className="form-group">
                        <label>MFA Code</label>
                        <input
                          type="text"
                          placeholder="Enter 6-digit MFA code"
                          value={mfaCode}
                          onChange={(e) => { setMfaCode(e.target.value); setMfaError(''); }}
                          maxLength={6}
                          className="otp-input-large"
                          autoFocus
                        />
                        {mfaError && <p className="otp-error" style={{ marginTop: '0.4rem' }}>{mfaError}</p>}
                      </div>

                      <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? '⏳ Verifying...' : '✅ Verify & Login'}
                      </button>

                      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        {mfaTimer > 0
                          ? <span className="otp-timer">Resend code in {mfaTimer}s</span>
                          : <button type="button" className="otp-resend-btn" onClick={handleResendMfa} disabled={loading}>🔄 Resend MFA Code</button>
                        }
                      </div>
                      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                        <span
                          onClick={() => { setLoginStep('credentials'); setMfaCode(''); setMfaError(''); setError(''); setSuccess(''); refreshCaptcha(); }}
                          style={{ color: '#667eea', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600' }}
                        >← Back to Login</span>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* ── REGISTER ── */}
              {authMode === 'register' && (
                <form className="auth-form" onSubmit={handleRegisterSubmit}>
                  {error && <div className="auth-alert auth-alert-error">{error}</div>}
                  {success && <div className="auth-alert auth-alert-success">{success}</div>}

                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" name="firstName" placeholder="Enter your first name" value={formData.firstName} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Middle Name</label>
                    <input type="text" name="middleName" placeholder="Optional" value={formData.middleName} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" name="lastName" placeholder="Enter your last name" value={formData.lastName} onChange={handleChange} required />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
                  </div>

                  {/* Registration email OTP */}
                  <div className="otp-section">
                    <div className="otp-header">
                      <span>📧 Email Verification</span>
                      {otpVerified && <span className="otp-verified-badge">✅ Verified</span>}
                    </div>
                    {!otpVerified && (
                      <>
                        {!otpSent ? (
                          <button type="button" className="otp-send-btn" onClick={handleSendOTP} disabled={otpLoading}>
                            {otpLoading ? 'Sending...' : 'Send OTP to Email'}
                          </button>
                        ) : (
                          <div className="otp-input-row">
                            <input type="text" placeholder="Enter 6-digit OTP" value={otpInput}
                              onChange={(e) => { setOtpInput(e.target.value); setOtpError(''); }}
                              maxLength={6} className="otp-input" />
                            <button type="button" className="otp-verify-btn" onClick={handleVerifyOTP} disabled={otpLoading}>
                              {otpLoading ? '...' : 'Verify'}
                            </button>
                          </div>
                        )}
                        {otpError && <p className="otp-error">{otpError}</p>}
                        {otpSent && !otpVerified && (
                          <div className="otp-resend-row">
                            {otpTimer > 0
                              ? <span className="otp-timer">Resend OTP in {otpTimer}s</span>
                              : <button type="button" className="otp-resend-btn" onClick={handleResendOTP} disabled={otpLoading}>🔄 Resend OTP</button>
                            }
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input type="password" name="confirmPassword" placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleChange} required />
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <select name="role" value={formData.role} onChange={handleChange}>
                      <option value="student">👨🎓 Student</option>
                      <option value="admin">👩🏫 Admin (Teacher/Institution)</option>
                    </select>
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? '⏳ Please wait...' : '📝 Create Account'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '1rem', color: '#6c757d' }}>
                    <p>Already have an account?{' '}
                      <span onClick={switchToLogin} style={{ color: '#667eea', cursor: 'pointer', fontWeight: '600' }}>Login</span>
                    </p>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>© Copyright {new Date().getFullYear()} Swetha, Poojitha, Mohitha</p>
      </footer>
    </div>
  );
}

export default HomePage;
