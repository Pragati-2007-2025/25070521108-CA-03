import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Those passwords do not match yet.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not create your account.');
      navigate('/login', { state: { email: form.email.trim() }, replace: true });
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch' ? 'Could not reach the NEXORA API. Check that the API server is running.' : requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout mode="register">
      <div className="form-heading">
        <span className="eyebrow">YOUR JOURNEY STARTS HERE</span>
        <h2>Create your<br /><span>NEXORA account.</span></h2>
        <p>Get closer to the technology you love.</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" autoComplete="name" placeholder="e.g. Alex Morgan" value={form.name} onChange={update} minLength={2} maxLength={80} required />
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={update} required />
        <div className="field-row">
          <div><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" placeholder="8 characters minimum" value={form.password} onChange={update} minLength={8} maxLength={72} required /></div>
          <div><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat password" value={form.confirmPassword} onChange={update} minLength={8} maxLength={72} required /></div>
        </div>
        {error && <p className="form-message error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Creating your account…' : 'Create account'}<span aria-hidden="true">↗</span></button>
      </form>
      <p className="switch-auth">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}

