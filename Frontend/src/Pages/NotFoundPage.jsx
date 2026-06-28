import React from 'react'
import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '100px', color: 'white' }}>
      <h1 style={{ fontSize: '5rem', marginBottom: '10px' }}>404</h1>
      <h2>Oops! Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
        The page you are looking for does not exist.
      </p>
      {/* A nice button to take them back home */}
      <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
        Go Back Home
      </Link>
    </div>
  )
}
export default NotFoundPage