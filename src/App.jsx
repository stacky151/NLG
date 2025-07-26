import { useState, useEffect } from 'react';
import './App.css';

// --- Helper URLs ---
const loginUrl = 'http://node.qwartie.org:2002/auth/discord';
const logoutUrl = 'http://node.qwartie.org:2002/auth/logout';
const userApiUrl = 'http://node.qwartie.org:2002/api/user';
const guildsApiUrl = 'http://node.qwartie.org:2002/api/guilds';
const announcementApiUrl = 'http://node.qwartie.org:2002/api/announcement';

// --- Live Preview Component ---
function LivePreview({ message, pages, activePage }) {
  const currentPage = pages[activePage] || {};
  return (
    <div className="preview-container">
      <h3>Live Preview</h3>
      <div className="discord-mock">
        <div className="discord-message">
          <div className="avatar"></div>
          <div className="message-content">
            <div className="username">Announcement Bot <span className="bot-tag">BOT</span></div>
            <div className="text-content">{message}</div>
            <div className="embed">
              <div className="embed-title">{currentPage.embedTitle || 'Embed Title'}</div>
              <div className="embed-description">{currentPage.embedDescription || 'Description will appear here...'}</div>
            </div>
            {currentPage.buttonLabel && currentPage.buttonUrl && (
              <div className="discord-button">{currentPage.buttonLabel}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- NEW: Guild Selector Component ---
function GuildSelector({ guilds, onSelectGuild, isLoading }) {
  if (isLoading) {
    return <p>Loading servers...</p>;
  }
  return (
    <div className="guild-selector">
      <h2>Select a Server</h2>
      <p>Choose a server to create an announcement in.</p>
      <div className="guild-list">
        {guilds.length > 0 ? guilds.map(guild => (
          <button key={guild.id} onClick={() => onSelectGuild(guild)} className="guild-card">
            {guild.name}
          </button>
        )) : <p>No mutual servers found. Please make sure the bot has been invited to a server that you are in.</p>}
      </div>
      <a href={logoutUrl}><button className="logout-button">Logout</button></a>
    </div>
  );
}

// --- The Main Dashboard Component ---
function Dashboard({ user, selectedGuild, onBack }) {
  const [channelId, setChannelId] = useState('');
  const [message, setMessage] = useState('');
  const [pages, setPages] = useState([{ embedTitle: '', embedDescription: '', buttonLabel: '', buttonUrl: '' }]);
  const [activePage, setActivePage] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const handlePageChange = (index, field, value) => {
    const newPages = [...pages];
    newPages[index][field] = value;
    setPages(newPages);
  };

  const addPage = () => {
    setPages([...pages, { embedTitle: '', embedDescription: '', buttonLabel: '', buttonUrl: '' }]);
    setActivePage(pages.length);
  };
  
  const removePage = (index) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    setActivePage(Math.max(0, activePage - 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage('Sending...');
    fetch(announcementApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, message, pages }),
      credentials: 'include'
    })
    .then(res => res.text().then(text => ({ ok: res.ok, text })))
    .then(({ ok, text }) => {
       setStatusMessage(ok ? 'Announcement posted successfully!' : `Error: ${text}`);
    })
    .catch(() => setStatusMessage('Error: Network request failed.'));
  };

  return (
    <div className="dashboard-layout">
      <div className="form-container">
        <div className="dashboard-header">
          <h2>New Announcement for: {selectedGuild.name}</h2>
          <button onClick={onBack} className="back-button">← Change Server</button>
        </div>
        
        <form onSubmit={handleSubmit} className="dashboard-form">
          <label htmlFor="channel">Select a Channel:</label>
          <select id="channel" value={channelId} onChange={(e) => setChannelId(e.target.value)} required>
            <option value="" disabled>-- Please choose a channel --</option>
            {selectedGuild.channels.map(channel => (
              <option value={channel.id} key={channel.id}>{channel.name}</option>
            ))}
          </select>

          <label htmlFor="message">Main Message (optional):</label>
          <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Text to appear above the embeds..."></textarea>
          <hr />

          <h3>Pages</h3>
          <div className="page-tabs">
            {pages.map((_, index) => (
              <button key={index} type="button" className={activePage === index ? 'active' : ''} onClick={() => setActivePage(index)}>Page {index + 1}</button>
            ))}
             <button type="button" onClick={addPage} className="add-page-btn">+</button>
          </div>

          <div className="page-editor">
            <h4>Editing Page {activePage + 1}</h4>
            <label htmlFor={`embedTitle-${activePage}`}>Embed Title:</label>
            <input type="text" id={`embedTitle-${activePage}`} value={pages[activePage].embedTitle} onChange={(e) => handlePageChange(activePage, 'embedTitle', e.target.value)} required />
            
            <label htmlFor={`embedDescription-${activePage}`}>Embed Description:</label>
            <textarea id={`embedDescription-${activePage}`} value={pages[activePage].embedDescription} onChange={(e) => handlePageChange(activePage, 'embedDescription', e.target.value)} required></textarea>
            
            <label htmlFor={`buttonLabel-${activePage}`}>Button Label (optional):</label>
            <input type="text" id={`buttonLabel-${activePage}`} value={pages[activePage].buttonLabel} onChange={(e) => handlePageChange(activePage, 'buttonLabel', e.target.value)} />

            <label htmlFor={`buttonUrl-${activePage}`}>Button URL (optional):</label>
            <input type="url" id={`buttonUrl-${activePage}`} value={pages[activePage].buttonUrl} onChange={(e) => handlePageChange(activePage, 'buttonUrl', e.target.value)} placeholder="https://example.com" />

            {pages.length > 1 && <button type="button" className="remove-page-btn" onClick={() => removePage(activePage)}>Remove Page {activePage + 1}</button>}
          </div>
          
          <button type="submit">Send Announcement</button>
        </form>

        {statusMessage && <p className="status-message">{statusMessage}</p>}
        <a href={logoutUrl}><button className="logout-button">Logout</button></a>
      </div>
      <LivePreview message={message} pages={pages} activePage={activePage} />
    </div>
  );
}

// --- The Main App Component ---
function App() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(userApiUrl, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setUser(data);
          // If user is logged in, fetch their guilds
          fetch(guildsApiUrl, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
              setGuilds(data);
              setIsLoading(false);
            })
            .catch(err => {
              console.error("Failed to fetch guilds", err);
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => setIsLoading(false));
  }, []);

  let content;
  if (user && selectedGuild) {
    content = <Dashboard user={user} selectedGuild={selectedGuild} onBack={() => setSelectedGuild(null)} />;
  } else if (user) {
    content = <GuildSelector guilds={guilds} onSelectGuild={setSelectedGuild} isLoading={isLoading} />;
  } else {
    content = (
      <div>
        {isLoading ? <p>Checking login status...</p> : <a href={loginUrl}><button>Login with Discord</button></a>}
      </div>
    );
  }

  return (
    <>
      <h1>Announcement Dashboard</h1>
      <div className="card">
        {content}
      </div>
    </>
  );
}

export default App;