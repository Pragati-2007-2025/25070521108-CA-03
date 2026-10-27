import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    // Browsers may autofill credentials without firing React's onChange handler.
    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get('email') || '').trim();
    const submittedPassword = String(formData.get('password') || '');
    setEmail(submittedEmail);
    setPassword(submittedPassword);
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: submittedEmail, password: submittedPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Could not sign in.');
      if (!result.token || !result.user) throw new Error('The API did not return a valid sign-in session. Restart the NEXORA server and try again.');
      sessionStorage.setItem('nexoraToken', result.token);
      sessionStorage.setItem('nexoraUser', JSON.stringify(result.user));
      navigate('/shop', { replace: true });
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch' ? 'Could not reach the NEXORA API. Check that the API server is running.' : requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout mode="login">
      <div className="form-heading">
        <span className="eyebrow">GOOD TO HAVE YOU BACK</span>
        <h2>Welcome<br /><span>back.</span></h2>
        <p>Sign in to continue to your NEXORA account.</p>
      </div>
      <form className="auth-form login-form" onSubmit={submit}>
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <p className="form-message error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Signing you in…' : 'Sign in'}<span aria-hidden="true">↗</span></button>
      </form>
      <p className="switch-auth">New to NEXORA? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  );
}


