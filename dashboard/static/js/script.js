document.addEventListener('DOMContentLoaded', async () => {
    const authButtons = document.getElementById('auth-buttons');
    
    try {
        const response = await fetch('/auth/check');
        if (response.ok) {
            const user = await response.json();
            authButtons.innerHTML = `
                <div class="flex items-center space-x-4">
                    <img src="${user.avatar}" alt="User Avatar" class="w-8 h-8 rounded-full">
                    <span>${user.username}</span>
                    <a href="/logout" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Logout</a>
                </div>
            `;
            loadDashboardData();
        } else {
            authButtons.innerHTML = `
                <a href="/auth/login" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                    Login with Discord
                </a>
            `;
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }

    async function loadDashboardData() {
        try {
            const statsResponse = await fetch('/api/bot-stats');
            const stats = await statsResponse.json();
            
            document.getElementById('uptime').textContent = stats.uptime;
            document.getElementById('guild-count').textContent = stats.guilds;
            document.getElementById('command-count').textContent = stats.commands;
            
            const guildsResponse = await fetch('/api/guilds');
            const guilds = await guildsResponse.json();
            renderGuilds(guilds);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    function renderGuilds(guilds) {
        const guildsContainer = document.getElementById('guilds');
        guildsContainer.innerHTML = guilds.map(guild => `
            <div class="guild-card bg-gray-700 rounded-lg p-4">
                <div class="flex items-center space-x-3">
                    <img src="${guild.icon}" alt="${guild.name}" class="w-12 h-12 rounded-full">
                    <div>
                        <h3 class="font-semibold">${guild.name}</h3>
                        <p class="text-gray-400 text-sm">${guild.member_count} members</p>
                    </div>
                </div>
                <div class="mt-4">
                    <div class="flex justify-between text-sm mb-1">
                        <span>Bot Permissions:</span>
                        <span>${guild.permissions}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${guild.usage_percentage}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    const socket = new WebSocket(`ws://${window.location.host}/ws`);
    
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'stats_update') {
            document.getElementById('command-count').textContent = data.command_count;
            document.getElementById('guild-count').textContent = data.guild_count;
        }
    };
});