import React from 'react';
import { useRouter } from 'next/router';

function ErrorPage({ statusCode }) {
  const router = useRouter();
  
  return (
    <div className="error-page">
      <h1>{statusCode || 'Error'}</h1>
      <p>Something went wrong</p>
      <button onClick={() => router.push('/')}>Return Home</button>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;