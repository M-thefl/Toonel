import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function Login() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (code) {
      axios
        .post("http://localhost:8000/auth/discord", { code })
        .then((res) => {
          setUser(res.data.user);
          setGuilds(res.data.guilds);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Auth Error:", err);
          setLoading(false);
        });
    }
  }, [code]);

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold">Logging in with Discord...</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold">Login Failed. Try again!</h1>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Welcome, {user.username}!</h1>
      <h2 className="mt-4">Your Servers:</h2>
      <ul>
        {guilds.map((guild) => (
          <li key={guild.id}>
            <h3>{guild.name}</h3>
            <img
              src={
                guild.icon
                  ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                  : ""
              }
              alt={guild.name}
              width="50"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}