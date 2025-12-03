// pages/404.js
import Link from 'next/link';

export default function Custom404() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        padding: '0 20px',
      }}
    >
      <h1 style={{ fontSize: '8rem', margin: 0, color: '#333', animation: 'pulse 2s infinite' }}>
        404
      </h1>
      <h2 style={{ fontSize: '2rem', margin: '20px 0', color: '#555' }}>
        Oops! Page Not Found
      </h2>
      <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '400px' }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link href="/">
        <a
          style={{
            marginTop: '30px',
            padding: '12px 24px',
            backgroundColor: '#4f46e5',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={e => {
            e.currentTarget.style.backgroundColor = '#6366f1';
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = '#4f46e5';
          }}
        >
          Go Back Home
        </a>
      </Link>

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            color: #333;
          }
          50% {
            transform: scale(1.1);
            color: #4f46e5;
          }
          100% {
            transform: scale(1);
            color: #333;
          }
        }
      `}</style>
    </div>
  );
}
