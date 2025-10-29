import React from 'react';

function App() {
  const [message, setMessage] = React.useState('Loading...');

  React.useEffect(() => {
    // Fetch the message from our API endpoint
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage('Failed to fetch from API'));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Hello from the React Frontend!</h1>
      <p>Message from backend: <strong>{message}</strong></p>
    </div>
  );
}

export default App;
