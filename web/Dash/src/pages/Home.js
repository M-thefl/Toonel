export default function Home() {
    const clientId = "1357122067782176799";
    const redirectUri = "http://localhost:3000/login";
    const scopes = ["identify", "guilds"].join(" ");
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scopes)}`;
  
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h1 className="text-4xl font-bold mb-6">Welcome to MyBot Dashboard</h1>
        <a
          href={discordAuthUrl}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow"
        >
          Login with Discord
        </a>
      </div>
    );
  }
  