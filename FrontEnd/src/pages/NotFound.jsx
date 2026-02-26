import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '72px', margin: '0', color: '#333' }}>404</h1>
      <h2 style={{ color: '#666', marginTop: '10px' }}>Page Not Found</h2>
      <p style={{ color: '#999', fontSize: '16px' }}>The page you're looking for doesn't exist.</p>
      <Link to="/" style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px'
      }}>
        Go Home
      </Link>
    </div>
  );
}

export default NotFound;
