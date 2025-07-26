import { useState, useEffect } from 'react';
import './App.css';

// --- Helper URLs ---
const loginUrl = 'http://node.qwartie.org:2002/auth/discord';
const logoutUrl = 'http://node.qwartie.org:2002/auth/logout';
const userApiUrl = 'http://node.qwartie.org:2002/api/user';
const guildsApiUrl = 'http://node.qwartie.org:2002/api/guilds';
const announcementApiUrl = 'http://node.qwartie.org:2002/api/announcement';

// --- Live Preview Component ---
function LivePreview({ message, pages, activePage }) { /* ... same as before ... */ }

// --- Announcement Form Component ---
function AnnouncementForm({ selectedGuild, onBack }) { /* ... form logic ... */ }

// --- Plugin Menu Component ---
function PluginMenu({ selectedGuild, onSelectPlugin, onBack }) {
  return (
    <div className="plugin-menu">
      <div className="plugin-header">
        <h2>{selectedGuild.name}</h2>
        <button onClick={onBack} className="back-button">← Back to Servers</button>
      </div>
      <h3>Plugins</h3>
      <div className="plugin-list">
        <div className="plugin-card" onClick={() => onSelectPlugin('announcer')}>
          <h4>📢 Announcement Maker</h4>
          <p>Create and schedule rich announcements.</p>
        </div>
      </div>
    </div>
  );
}

// --- Guild Selector Component ---
function GuildSelector({ guilds, onSelectGuild, isLoading }) { /* ... same as before ... */ }

// --- Main App Component ---
function App() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { /* ... same as before ... */ }, []);

  const goToServerSelection = () => {
      setSelectedPlugin(null);
      setSelectedGuild(null);
  };

  const goToPluginSelection = () => {
      setSelectedPlugin(null);
  }

  let content;
  if (user) {
    if (selectedGuild && selectedPlugin === 'announcer') {
      content = <AnnouncementForm selectedGuild={selectedGuild} onBack={goToPluginSelection} />;
    } else if (selectedGuild) {
      content = <PluginMenu selectedGuild={selectedGuild} onSelectPlugin={setSelectedPlugin} onBack={goToServerSelection} />;
    } else {
      content = <GuildSelector guilds={guilds} onSelectGuild={setSelectedGuild} isLoading={isLoading} />;
    }
  } else {
    content = (
      <div>
        {isLoading ? <p>Checking login status...</p> : <a href={loginUrl}><button>Login with Discord</button></a>}
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1>Bot Dashboard</h1>
      <div className="card">
        {content}
      </div>
    </div>
  );
}

// You would paste the full component code for LivePreview, AnnouncementForm, etc. here
export default App;