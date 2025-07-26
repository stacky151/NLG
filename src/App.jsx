import { useState, useEffect } from 'react';
import './App.css';

// --- Helper URLs ---
const API_BASE = 'http://node.qwartie.org:2002';
const loginUrl = `${API_BASE}/auth/discord`;
const logoutUrl = `${API_BASE}/auth/logout`;

// --- The Main App Component ---
function App() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [view, setView] = useState('loading'); // loading, login, servers, plugins, form, scheduled
  const [postToEdit, setPostToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
              setIsLoading(false);
            }).catch(() => setIsLoading(false));
        } else {
          setView('login');
          setIsLoading(false);
        }
      })
      .catch(() => {
        setView('login');
        setIsLoading(false);
      });
  }, []);

  const handleEditPost = (post) => {
    setPostToEdit(post);
    setView('form');
  };
  
  const renderContent = () => {
    switch(view) {
      case 'servers':
        return <GuildSelector guilds={guilds} onSelect={g => { setSelectedGuild(g); setView('plugins'); }} isLoading={isLoading} />;
      case 'plugins':
        return <PluginMenu guild={selectedGuild} onBack={() => { setSelectedGuild(null); setView('servers'); }} onSelect={plugin => setView(plugin)} />;
      case 'form':
        return <AnnouncementForm guild={selectedGuild} onBack={() => setView('plugins')} postToEdit={postToEdit} onFormSubmit={() => { setPostToEdit(null); setView('scheduled'); }} />;
      case 'scheduled':
        return <ScheduledPostsList guild={selectedGuild} onBack={() => setView('plugins')} onEdit={handleEditPost} />;
      default:
        return (
          <div className="login-view">
            <h2>Welcome to the Dashboard</h2>
            {isLoading ? <p>Loading...</p> : <a href={loginUrl}><button>Login with Discord</button></a>}
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


// --- ################# COMPONENTS ################# ---

function Header({ user, onServersClick }) {
  return (
    <header className="app-header">
      <h2>📢 Announcement Bot</h2>
      <nav>
        {user && <button onClick={onServersClick}>My Servers</button>}
        {user && <a href={logoutUrl}><button className="logout-button">Logout</button></a>}
      </nav>
    </header>
  );
}

function GuildSelector({ guilds, onSelect, isLoading }) {
  if (isLoading) return <p>Loading servers...</p>;
  return (
    <div className="guild-selector">
      <h2>Select a Server</h2>
      <p>Choose a server to configure.</p>
      <div className="guild-list">
        {guilds.length > 0 ? guilds.map(guild => (
          <div key={guild.id} className="guild-card" onClick={() => onSelect(guild)}>
            <img 
              src={guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : './default-icon.png'} 
              alt={`${guild.name} icon`} 
              className="guild-icon" 
              onError={(e) => { e.target.onerror = null; e.target.src="./default-icon.png"}}
            />
            <span>{guild.name}</span>
          </div>
        )) : <p>No mutual servers found. Make sure your bot is in a server that you are in and has permissions to view channels.</p>}
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
         <div className="plugin-card" onClick={() => onSelect('scheduled')}>
          <h4>🗓️ Scheduled Posts</h4>
          <p>View, edit, or delete upcoming announcements.</p>
        </div>
      </div>
    </div>
  );
}

function AnnouncementForm({ guild, onBack, postToEdit, onFormSubmit }) {
  const [roles, setRoles] = useState([]);
  const [roleId, setRoleId] = useState(postToEdit?.roleId || '');
  const [channelId, setChannelId] = useState(postToEdit?.channelId || '');
  const [message, setMessage] = useState(postToEdit?.message || '');
  const [pages, setPages] = useState(postToEdit?.pages || [{ embedTitle: '', embedDescription: '', buttonLabel: '', buttonUrl: '', embedColor: '#0099ff' }]);
  const [scheduleDate, setScheduleDate] = useState(postToEdit?.scheduleDate ? new Date(postToEdit.scheduleDate).toISOString().slice(0, 16) : '');
  const [statusMessage, setStatusMessage] = useState('');
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    // Fetch roles for the selected guild
    fetch(`${API_BASE}/api/guilds/${guild.id}/roles`, { credentials: 'include' })
      .then(res => res.json())
      .then(setRoles)
      .catch(err => console.error("Failed to fetch roles", err));
  }, [guild.id]);

  const handlePageChange = (index, field, value) => {
    const newPages = [...pages];
    newPages[index][field] = value;
    setPages(newPages);
  };

  const addPage = () => {
    setPages([...pages, { embedTitle: '', embedDescription: '', buttonLabel: '', buttonUrl: '', embedColor: '#0099ff' }]);
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
    setStatusMessage('Saving...');
    
    const url = postToEdit ? `${API_BASE}/api/scheduled/${postToEdit.id}` : `${API_BASE}/api/announcement`;
    const method = postToEdit ? 'PUT' : 'POST';
    const payload = { guildId: guild.id, channelId, message, pages, scheduleDate, roleId };

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    })
    .then(res => res.text().then(text => ({ ok: res.ok, text })))
    .then(({ ok, text }) => {
       setStatusMessage(ok ? `Announcement ${postToEdit ? 'updated' : 'scheduled'} successfully!` : `Error: ${text}`);
       if (ok) setTimeout(() => onFormSubmit(), 1500);
    })
    .catch(() => setStatusMessage('Error: Network request failed.'));
  };
  
  return (
     <div className="dashboard-layout">
        <div className="form-container">
          <div className="dashboard-header">
            <h2>{postToEdit ? 'Edit Announcement' : '📢 New Announcement'} for: {guild.name}</h2>
            <button onClick={onBack} className="back-button">← Back to Plugins</button>
          </div>
          <form onSubmit={handleSubmit} className="dashboard-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Channel</label>
                  <select value={channelId} onChange={e => setChannelId(e.target.value)} required>
                    <option value="" disabled>-- Select a Channel --</option>
                    {guild.channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mention Role (optional)</label>
                  <select value={roleId} onChange={e => setRoleId(e.target.value)}>
                    <option value="">-- No Role --</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              <label>Main Message (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Text above embed..."></textarea>
              <hr/>

              <h3>Pages</h3>
              <div className="page-tabs">
                  {pages.map((_, index) => (
                    <button key={index} type="button" className={activePage === index ? 'active' : ''} onClick={() => setActivePage(index)}>Page {index + 1}</button>
                  ))}
                  <button type="button" onClick={addPage} className="add-page-btn">+</button>
              </div>

              {pages.length > 0 && (
                <div className="page-editor">
                  <div className="page-header">
                    <h4>Editing Page {activePage + 1}</h4>
                    {pages.length > 1 && <button type="button" className="remove-page-btn" onClick={() => removePage(activePage)}>Remove Page</button>}
                  </div>
                  <label>Embed Title:</label>
                  <input type="text" value={pages[activePage].embedTitle} onChange={(e) => handlePageChange(activePage, 'embedTitle', e.target.value)} required />
                  <label>Embed Description:</label>
                  <textarea value={pages[activePage].embedDescription} onChange={(e) => handlePageChange(activePage, 'embedDescription', e.target.value)} required></textarea>
                  <label>Button Label (optional):</label>
                  <input type="text" value={pages[activePage].buttonLabel} onChange={(e) => handlePageChange(activePage, 'buttonLabel', e.target.value)} />
                  <label>Button URL (optional):</label>
                  <input type="url" value={pages[activePage].buttonUrl} onChange={(e) => handlePageChange(activePage, 'buttonUrl', e.target.value)} placeholder="https://example.com" />
                </div>
              )}
              <hr/>

              <label>Schedule Post Time</label>
              <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} required />
              <p className="field-explanation">The bot will post at the specified time.</p>
              
              <button type="submit">{postToEdit ? 'Update Announcement' : 'Schedule Announcement'}</button>
              {statusMessage && <p className="status-message">{statusMessage}</p>}
          </form>
        </div>
        <LivePreview message={message} pages={pages} activePage={activePage} roleId={roleId} roles={roles} />
     </div>
  );
}

function ScheduledPostsList({ guild, onBack, onEdit }) {
    const [posts, setPosts] = useState([]);
    const [status, setStatus] = useState('Loading scheduled posts...');

    const fetchPosts = () => {
        fetch(`${API_BASE}/api/scheduled/${guild.id}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setPosts(data);
                if (data.length === 0) {
                    setStatus('No announcements are currently scheduled for this server.');
                }
            })
            .catch(() => setStatus('Failed to load scheduled posts.'));
    };

    useEffect(() => {
        fetchPosts();
    }, [guild.id]);

    const handleDelete = (id) => {
        if (!window.confirm('Are you sure you want to delete this scheduled announcement?')) return;

        fetch(`${API_BASE}/api/scheduled/${id}`, { method: 'DELETE', credentials: 'include' })
            .then(res => {
                if (res.ok) {
                    fetchPosts(); // Refresh the list
                } else {
                    alert('Failed to delete the post.');
                }
            });
    };
    
    return (
        <div className="scheduled-posts">
            <div className="plugin-header">
                <h2>🗓️ Scheduled Posts for: {guild.name}</h2>
                <button onClick={onBack} className="back-button">← Back to Plugins</button>
            </div>
            <div className="posts-list">
                {posts.length > 0 ? posts.map(post => (
                    <div key={post.id} className="post-item">
                        <div className="post-details">
                            <span className="post-title">{post.pages[0].embedTitle}</span>
                            <span className="post-channel">Channel: #{guild.channels.find(c => c.id === post.channelId)?.name || 'Unknown'}</span>
                            <span className="post-time">Scheduled for: {new Date(post.scheduleDate).toLocaleString()}</span>
                        </div>
                        <div className="post-actions">
                             <button className="edit-btn" onClick={() => onEdit(post)}>Edit</button>
                             <button className="delete-btn" onClick={() => handleDelete(post.id)}>Delete</button>
                        </div>
                    </div>
                )) : <p>{status}</p>}
            </div>
        </div>
    );
}

function LivePreview({ message, pages, activePage, roleId, roles }) {
  const currentPage = pages[activePage] || {};
  const selectedRole = roles.find(r => r.id === roleId);

  return (
    <div className="preview-container">
      <h3>Live Preview</h3>
      <div className="discord-mock">
        <div className="discord-message">
          <div className="avatar"></div>
          <div className="message-content">
            <div className="username">Announcement Bot <span className="bot-tag">BOT</span></div>
            <div className="text-content">
              {selectedRole && <span className="role-mention">{selectedRole.name}</span>}
              {' '}{message}
            </div>
            <div className="embed" style={{ borderColor: currentPage.embedColor || '#0099ff' }}>
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

export default App;