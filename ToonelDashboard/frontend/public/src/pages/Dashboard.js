import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [botStatus, setBotStatus] = useState(null);
  const [commandUsage, setCommandUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const [statusRes, commandsRes] = await Promise.all([
          axios.get('/api/bot/status', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/bot/commands', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setBotStatus(statusRes.data);
        setCommandUsage(commandsRes.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchData();
  }, [navigate]);

  const commandChartData = {
    labels: commandUsage.map(cmd => cmd.name),
    datasets: [
      {
        label: 'Command Usage',
        data: commandUsage.map(cmd => cmd.count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-8">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Bot Dashboard</h1>
      
      {botStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Status</h3>
            <p className={`text-2xl ${botStatus.online ? 'text-green-500' : 'text-red-500'}`}>
              {botStatus.online ? 'Online' : 'Offline'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Ping</h3>
            <p className="text-2xl">{botStatus.ping} ms</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Servers</h3>
            <p className="text-2xl">{botStatus.guilds}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Users</h3>
            <p className="text-2xl">{botStatus.users}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Command Usage</h2>
          <div className="h-64">
            <Bar data={commandChartData} options={{ responsive: true }} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {commandUsage.slice(0, 5).map((cmd, index) => (
              <div key={index} className="border-b pb-2">
                <div className="flex justify-between">
                  <span className="font-medium">/{cmd.name}</span>
                  <span className="text-gray-500">{cmd.count} uses</span>
                </div>
                <div className="text-sm text-gray-500">
                  Last used: {new Date(cmd.last_used).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;