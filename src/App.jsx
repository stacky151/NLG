import { useState, useEffect } from 'react';
import './App.css';

// --- Helper URLs ---
const loginUrl = 'http://node.qwartie.org:2002/auth/discord';
const logoutUrl = 'http://node.qwartie.org:2002/auth/logout';
const userApiUrl = 'http://node.qwartie.org:2002/api/user';
const guildsApiUrl = 'http://node.qwartie.org:2002/api/guilds';
const announcementApiUrl = 'http://node.qwartie.org:2002/api/announcement';

// --- Live Preview Component ---
function LivePreview({ message, pages, activePage, buttonLabel, buttonUrl }) {
  const currentPage = pages[activePage] || { embedTitle: '', embedDescription: '' };

  return (
    <div className="preview-container">
      <h3>Live Preview</h3>
      <div className="discord-mock">
        <div className="discord-message">
          <div className="avatar"></div>
          <div className="message-content">
            <div className="username">Announcement Bot</div>
            <div className="text-content">{message}</div>
            <div className="embed">
              <div className="embed-title">{currentPage.embedTitle || 'Embed Title'}</div>
              <div className="embed-description">{currentPage.embedDescription || 'Embed Description will appear here...'}</div>
            </div>
            {buttonLabel && buttonUrl && (
              <div className="discord-button">{buttonLabel}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- The Main Dashboard Component ---
function Dashboard({ user }) {
  const [guilds, setGuilds] = useState([]);
  const [isLoadingGuilds, setIsLoadingGuilds] = useState(true);
  const [channelId, setChannelId] = useState('');
  const [message, setMessage] = useState('');
  const [pages, setPages] = useState([{ embedTitle: '', embedDescription: '' }]);
  const [activePage, setActivePage] = useState(0);
  const [buttonLabel, setButtonLabel] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetch(guildsApiUrl, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setGuilds(data);
        setIsLoadingGuilds(false);
      })
      .catch(err => {
        console.error("Failed to fetch guilds", err);
        setIsLoadingGuilds(false);
      });
  }, []);

  const handlePageChange = (index, field, value) => {
    const newPages = [...pages];
    newPages[index][field] = value;
    setPages(newPages);
  };

  const addPage = () => {
    setPages([...pages, { embedTitle: '', embedDescription: '' }]);
    setActivePage(pages.length);
  };

  const removePage = (index) => {
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    setActivePage(Math.max(0, activePage - 1));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage('Sending...');

    const announcementData = {
      channelId,
      message,
      pages: pages.map(p => ({ ...p, buttonLabel, buttonUrl }))
    };
    
    fetch(announcementApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcementData),
      credentials: 'include'
    })
    .then(res => res.text().then(text => ({ ok: res.ok, text })))
    .then(({ok, text}) => {
       setStatusMessage(ok ? 'Announcement posted successfully!' : `Error: ${text}`);
    })
    .catch(() => setStatusMessage('Error: Network request failed.'));
  };

  return (
    <div className="dashboard-layout">
      <div className="form-container">
        <h2>Welcome, {user.username}!</h2>
        <p>Create a new announcement below.</p>
        
        <form onSubmit={handleSubmit} className="dashboard-form">
          <label htmlFor="channel">Select a Channel:</label>
          <select id="channel" value={channelId} onChange={(e) => setChannelId(e.target.value)} required>
            <option value="" disabled>{isLoadingGuilds ? 'Loading servers...' : '-- Please choose a channel --'}</option>
            {guilds.map(guild => (
              <optgroup label={guild.name} key={guild.id}>
                {guild.channels.map(channel => (
                  <option value={channel.id} key={channel.id}>{channel.name}</option>
                ))}
              </optgroup>
            ))}
          </select>

          <label htmlFor="message">Main Message (optional, appears on first page):</label>
          <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Text to appear above the embed..."></textarea>
          
          <hr />
          <h3>Pages</h3>
          {pages.map((page, index) => (
            <div key={index} className="page-editor">
              <h4>Page {index + 1}</h4>
              <label htmlFor={`embedTitle-${index}`}>Embed Title:</label>
              <input type="text" id={`embedTitle-${index}`} value={page.embedTitle} onChange={(e) => handlePageChange(index, 'embedTitle', e.target.value)} required />
              <label htmlFor={`embedDescription-${index}`}>Embed Description:</label>
              <textarea id={`embedDescription-${index}`} value={page.embedDescription} onChange={(e) => handlePageChange(index, 'embedDescription', e.target.value)} required></textarea>
              {pages.length > 1 && <button type="button" onClick={() => removePage(index)}>Remove Page</button>}
            </div>
          ))}
          <button type="button" onClick={addPage}>Add Page</button>
          <hr />

          <label htmlFor="buttonLabel">Button Label (optional, same for all pages):</label>
          <input type="text" id="buttonLabel" value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} />

          <label htmlFor="buttonUrl">Button URL (optional):</label>
          <input type="url" id="buttonUrl" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="https://example.com" />
          
          <button type="submit">Send Announcement</button>
        </form>

        {statusMessage && <p className="status-message">{statusMessage}</p>}
        <a href={logoutUrl}><button className="logout-button">Logout</button></a>
      </div>
      <LivePreview message={message} pages={pages} activePage={activePage} buttonLabel={buttonLabel} buttonUrl={buttonUrl} />
    </div>
  );
}

// --- The Main App Component ---
function App() {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('Checking login status...');

  useEffect(() => {
    fetch(userApiUrl, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) setUser(data);
        else setAuthStatus('You are not logged in. Please click the button below.');
      })
      .catch(() => setAuthStatus('Error: Could not connect to the server.'));
  }, []);

  return (
    <>
      <h1>Announcement Dashboard</h1>
      <div className="card">
        {user ? (
          <Dashboard user={user} />
        ) : (
          <div>
            <p>{authStatus}</p>
            <a href={loginUrl}><button>Login with Discord</button></a>
          </div>
        )}
      </div>
    </>
  );
}

export default App;