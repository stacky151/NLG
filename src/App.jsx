import { useState, useEffect } from 'react';
import './App.css';

// --- Helper URLs ---
const loginUrl = 'http://node.qwartie.org:2002/auth/discord';
const logoutUrl = 'http://node.qwartie.org:2002/auth/logout';
const userApiUrl = 'http://node.qwartie.org:2002/api/user';
const announcementApiUrl = 'http://node.qwartie.org:2002/api/announcement';


// --- The Main Dashboard Component ---
function Dashboard({ user }) {
  const [channelId, setChannelId] = useState('');
  const [message, setMessage] = useState('');
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedDescription, setEmbedDescription] = useState('');
  const [buttonLabel, setButtonLabel] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage('Sending...');

    const announcementData = {
      channelId,
      message,
      embedTitle,
      embedDescription,
      buttonLabel,
      buttonUrl,
    };
    
    // Send the data to our backend API, including credentials
    fetch(announcementApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcementData),
      credentials: 'include' // Important for protected routes
    })
    .then(res => {
      if (res.ok) {
        setStatusMessage('Announcement posted successfully!');
      } else {
        res.text().then(text => setStatusMessage(`Error: ${text}`));
      }
    })
    .catch(() => setStatusMessage('Error: Network request failed.'));
  };

  return (
    <div>
      <h2>Welcome, {user.username}!</h2>
      <p>Create a new announcement below.</p>
      
      <form onSubmit={handleSubmit} className="dashboard-form">
        <label htmlFor="channel">Select a Channel:</label>
        <select id="channel" value={channelId} onChange={(e) => setChannelId(e.target.value)} required>
          <option value="" disabled>-- Please choose a channel --</option>
          {/* TODO: Populate this with the user's guilds */}
          <option value="YOUR_TEST_CHANNEL_ID">Test Channel</option> 
        </select>

        <label htmlFor="message">Message (optional):</label>
        <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Text to appear above the embed..."></textarea>
        
        <label htmlFor="embedTitle">Embed Title:</label>
        <input type="text" id="embedTitle" value={embedTitle} onChange={(e) => setEmbedTitle(e.target.value)} required />

        <label htmlFor="embedDescription">Embed Description:</label>
        <textarea id="embedDescription" value={embedDescription} onChange={(e) => setEmbedDescription(e.target.value)} required placeholder="Main content of the announcement..."></textarea>

        <label htmlFor="buttonLabel">Button Label:</label>
        <input type="text" id="buttonLabel" value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} required />

        <label htmlFor="buttonUrl">Button URL:</label>
        <input type="url" id="buttonUrl" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} required placeholder="https://example.com" />
        
        <button type="submit">Send Announcement</button>
      </form>

      {statusMessage && <p className="status-message">{statusMessage}</p>}
      <a href={logoutUrl}><button className="logout-button">Logout</button></a>
    </div>
  );
}


// --- The Main App Component ---
function App() {
  const [user, setUser] = useState(null);
  // NEW: State to show what's happening during login check
  const [authStatus, setAuthStatus] = useState('Checking login status...');

  useEffect(() => {
    fetch(userApiUrl, { credentials: 'include' })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        // If the response is not OK (e.g., 401 Unauthorized)
        setAuthStatus('You are not logged in. Please click the button below.');
        return null;
      })
      .then((data) => {
        if (data) {
          setUser(data);
        }
      })
      .catch(err => {
        console.error(err);
        setAuthStatus('Error: Could not connect to the server. Please make sure it is running.');
      });
  }, []);

  return (
    <>
      <h1>Announcement Dashboard</h1>
      <div className="card">
        {user ? (
          // If user is found, show the dashboard
          <Dashboard user={user} />
        ) : (
          // If no user, show the status message and login button
          <div>
            <p>{authStatus}</p>
            <a href={loginUrl}>
              <button>Login with Discord</button>
            </a>
          </div>
        )}
      </div>
    </>
  );
}

export default App;