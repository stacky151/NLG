import './App.css';

function App() {
  // The full URL to your backend's login route
  const backendUrl = 'http://node.qwartie.org:2002/auth/discord';

  return (
    <>
      <h1>Announcement Dashboard</h1>
      <div className="card">
        <a href={backendUrl}>
          <button>
            Login with Discord
          </button>
        </a>
      </div>
    </>
  );
}

export default App;