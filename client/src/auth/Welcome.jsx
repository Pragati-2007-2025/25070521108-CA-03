import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';

export default function Welcome() {
  const navigate = useNavigate();
  let user = { name: 'there', email: '' };
  try {
    user = JSON.parse(sessionStorage.getItem('nexoraUser')) || user;
  } catch {
    // A missing session profile returns to the sign-in page.
  }

  function signOut() {
    sessionStorage.removeItem('nexoraToken');
    sessionStorage.removeItem('nexoraUser');
    navigate('/login', { replace: true });
  }

  return (
    <AuthLayout mode="login">
      <div className="form-heading welcome-heading">
        <span className="eyebrow">YOU’RE SIGNED IN</span>
        <h2>Welcome to<br /><span>NEXORA, {user.name.split(' ')[0]}.</span></h2>
        <p>Your account is ready. This is the starting point for your NEXORA experience.</p>
      </div>
      <div className="welcome-card"><span className="welcome-icon">N</span><div><strong>{user.name}</strong><span>{user.email}</span></div><span className="verified-dot" title="Signed in" /></div>
      <button className="primary-button signout-button" type="button" onClick={signOut}>Sign out<span aria-hidden="true">↗</span></button>
    </AuthLayout>
  );
}
