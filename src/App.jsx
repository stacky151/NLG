import { useState, useEffect } from 'react';
import './App.css';

// --- Helper URLs ---
// (Defined globally for easy access)
const API_BASE = 'http://node.qwartie.org:2002';
const loginUrl = `${API_BASE}/auth/discord`;
const logoutUrl = `${API_BASE}/auth/logout`;

// --- The Main App Component ---
function App() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [view, setView] = useState('loading'); // loading, servers, plugins, form, scheduled

  // Fetch user and guild data on initial load
  useEffect(() => {
    fetch(`${API_BASE}/api/user`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((userData) => {
        if (userData) {
          setUser(userData);
          fetch(`${API_BASE}/api/guilds`, { credentials: 'include' })
            .then(res => res.json())
            .then(guildData => {
              setGuilds(guildData);
              setView('servers');
            });
        } else {
          setView('login');
        }
      })
      .catch(() => setView('login'));
  }, []);

  // --- View Rendering Logic ---
  const renderContent = () => {
    switch(view) {
      case 'servers':
        return <GuildSelector guilds={guilds} onSelect={g => { setSelectedGuild(g); setView('plugins'); }} />;
      case 'plugins':
        return <PluginMenu guild={selectedGuild} onBack={() => setView('servers')} onSelect={plugin => setView(plugin)} />;
      case 'form':
        return <AnnouncementForm guild={selectedGuild} onBack={() => setView('plugins')} />;
      // Add case for 'scheduled' later
      default: // loading or login
        return (
          <div>
            {view === 'loading' ? <p>Loading...</p> : <a href={loginUrl}><button>Login with Discord</button></a>}
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <Header user={user} onServersClick={() => { setView('servers'); setSelectedGuild(null); }} />
      <div className="card">
        {renderContent()}
      </div>
    </div>
  );
}

// --- Components ---

function Header({ user, onServersClick }) {
  return (
    <header className="app-header">
      <h2>📢 Announcement Bot</h2>
      <nav>
        {user && <button onClick={onServersClick}>My Servers</button>}
        {user && <a href={logoutUrl}><button>Logout</button></a>}
      </nav>
    </header>
  );
}

function GuildSelector({ guilds, onSelect }) {
  return (
    <div className="guild-selector">
      <h2>Select a Server</h2>
      <p>Choose a server to configure.</p>
      <div className="guild-list">
        {guilds.length > 0 ? guilds.map(guild => (
          <div key={guild.id} className="guild-card" onClick={() => onSelect(guild)}>
            <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt={`${guild.name} icon`} className="guild-icon" />
            <span>{guild.name}</span>
          </div>
        )) : <p>No mutual servers found. Make sure the bot is in a server that you are in.</p>}
      </div>
    </div>
  );
}

function PluginMenu({ guild, onBack, onSelect }) {
  return (
    <div className="plugin-menu">
      <div className="plugin-header">
        <h2>{guild.name}</h2>
        <button onClick={onBack} className="back-button">← Back to Servers</button>
      </div>
      <h3>Plugins</h3>
      <div className="plugin-list">
        <div className="plugin-card" onClick={() => onSelect('form')}>
          <h4>📝 New Announcement</h4>
          <p>Create and schedule a new rich announcement.</p>
        </div>
         <div className="plugin-card disabled">
          <h4>🗓️ Scheduled Posts</h4>
          <p>View, edit, or delete upcoming announcements. (Coming Soon!)</p>
        </div>
      </div>
    </div>
  );
}

function AnnouncementForm({ guild, onBack }) {
  // ... state for form fields (channelId, message, pages, etc.)
  const [channelId, setChannelId] = useState('');
  const [message, setMessage] = useState('');
  const [pages, setPages] = useState([{ embedTitle: '', embedDescription: '' }]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // ... handlers for form changes and submission
  const handleSubmit = (e) => { /* ... form submission logic ... */ };
  
  return (
     <div className="dashboard-layout">
        <div className="form-container">
          <div className="dashboard-header">
            <h2>New Announcement for: {guild.name}</h2>
            <button onClick={onBack} className="back-button">← Back to Plugins</button>
          </div>
          <form onSubmit={handleSubmit} className="dashboard-form">
              {/* Dropdown for channels */}
              <label>Channel</label>
              <select value={channelId} onChange={e => setChannelId(e.target.value)} required>
                <option value="" disabled>-- Select a Channel --</option>
                {guild.channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>

              {/* Textarea for message */}
              <label>Main Message (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Text above embed..."></textarea>
              
              {/* Pages logic */}
              {/* ... pages UI ... */}

              {/* Scheduling Input */}
              <label>Schedule Post Time (optional)</label>
              <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
              <p className="field-explanation">Leave blank to post immediately. Otherwise, the bot will post at the specified time.</p>
              
              <button type="submit">Schedule Announcement</button>
              {statusMessage && <p>{statusMessage}</p>}
          </form>
        </div>
        {/* <LivePreview ... /> component here */}
     </div>
  );
}


export default App;