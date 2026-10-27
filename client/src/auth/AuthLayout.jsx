import { Link } from 'react-router-dom';
import './Auth.css';
import './auth-noir.css';

export default function AuthLayout({ children, mode }) {
  return (
    <main className="auth-page">
      <div className="auth-aurora" aria-hidden="true" />
      <header className="site-header">
        <Link className="brand" to="/" aria-label="NEXORA home">
          <span className="brand-mark">N</span>
          <span>NEXORA</span>
        </Link>
        <span className="header-note">OBJECTS FOR THE NEXT ERA</span>
      </header>

      <section className="auth-shell">
        <aside className="auth-story">
          <div className="story-aurora" aria-hidden="true" />
          <div className="story-orbit orbit-one" />
          <div className="story-orbit orbit-two" />
          <div className="story-copy">
            <span className="story-kicker">A NEW WAY TO DISCOVER TECH</span>
            <h1>Objects for<br />the <em>next era.</em></h1>
            <p>Step into a showroom of considered technology, built to make every day feel a little more extraordinary.</p>
          </div>
          <div className="story-footer"><span>01</span><span className="story-line" /><span>BEYOND THE ORDINARY</span></div>
        </aside>

        <section className="auth-form-side">
          <div className="form-wrap">
            <div className="step-indicator"><span className={mode === 'register' ? 'step active' : 'step complete'}>{mode === 'register' ? '01' : '01 ✓'}</span><span className="step-connector" /><span className={mode === 'login' ? 'step active' : 'step'}>02</span><span className="step-label">{mode === 'register' ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</span></div>
            {children}
            <p className="secure-note"><span aria-hidden="true">◇</span> Your details are encrypted and kept private.</p>
          </div>
        </section>
      </section>

      <footer className="page-footer"><span>© 2026 NEXORA</span><span>OBJECTS FOR THE NEXT ERA.</span></footer>
    </main>
  );
}
