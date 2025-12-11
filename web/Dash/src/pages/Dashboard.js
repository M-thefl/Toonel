import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const navigate = useNavigate();

  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (!token) {
      navigate('/login'); 
      return;
    }

    axios.get('http://localhost:8000/user', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      setUser(response.data.user);
      setGuilds(response.data.guilds); 
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      navigate('/login');
    });
  }, [token, navigate]);

  return (
    <div className="dashboard">
      {user ? (
        <div>
          <h1>Welcome, {user.username}!</h1>
          <h2>Your Servers:</h2>
          <ul>
            {guilds.map((guild) => (
              <li key={guild.id}>
                <h3>{guild.name}</h3>
                <img src={guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : ''} alt={guild.name} width="50" />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Dashboard;
