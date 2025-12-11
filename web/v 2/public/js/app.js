document.addEventListener('DOMContentLoaded', function() {
    initFeatures();
    
    setupCommandExplorer();
    
    initInteractiveElements();
    
    createFloatingOrbs();
    
    setupThemeToggle();
    
    setupFAQAccordion();
    
    setupDashboardInteractivity();
});

function initFeatures() {
    const featuresData = {
        vpn: [
            {
                icon: 'fa-network-wired',
                title: 'Multi-Server Configs',
                description: 'Generate configurations for multiple server locations with a single command',
                premium: false
            },
            {
                icon: 'fa-bolt',
                title: 'Fast Connection',
                description: 'Optimized configurations for maximum speed and reliability',
                premium: false
            },
            {
                icon: 'fa-globe',
                title: 'Global Locations',
                description: 'Access servers in 15+ countries worldwide',
                premium: true
            },
            {
                icon: 'fa-wifi',
                title: 'Custom Protocols',
                description: 'Support for VMess, VLESS, Trojan, and Shadowsocks',
                premium: true
            }
        ],
        security: [
            {
                icon: 'fa-lock',
                title: 'End-to-End Encryption',
                description: 'Military-grade encryption for all your connections',
                premium: false
            },
            {
                icon: 'fa-user-shield',
                title: 'IP Protection',
                description: 'Hide your real IP address with our secure servers',
                premium: false
            },
            {
                icon: 'fa-fingerprint',
                title: 'TLS 1.3 Support',
                description: 'Latest security protocols for maximum protection',
                premium: true
            },
            {
                icon: 'fa-shield-alt',
                title: 'Anti-DPI',
                description: 'Bypass deep packet inspection with advanced obfuscation',
                premium: true
            }
        ],
        automation: [
            {
                icon: 'fa-robot',
                title: 'Auto-Renewal',
                description: 'Configurations automatically renew before expiration',
                premium: true
            },
            {
                icon: 'fa-sync',
                title: 'Load Balancing',
                description: 'Automatically switch to fastest available server',
                premium: true
            },
            {
                icon: 'fa-history',
                title: 'Usage Reports',
                description: 'Get weekly reports of your connection usage',
                premium: false
            },
            {
                icon: 'fa-bell',
                title: 'Notifications',
                description: 'Get alerts for configuration changes and updates',
                premium: false
            }
        ],
        management: [
            {
                icon: 'fa-users',
                title: 'Multi-User',
                description: 'Manage configurations for your entire team',
                premium: true
            },
            {
                icon: 'fa-tags',
                title: 'Tagging System',
                description: 'Organize configurations with custom tags',
                premium: false
            },
            {
                icon: 'fa-download',
                title: 'Bulk Export',
                description: 'Export multiple configurations at once',
                premium: true
            },
            {
                icon: 'fa-stopwatch',
                title: 'Usage Limits',
                description: 'Set data limits for team members',
                premium: true
            }
        ],
        premium: [
            {
                icon: 'fa-crown',
                title: 'Priority Support',
                description: '24/7 dedicated support for premium users',
                premium: true
            },
            {
                icon: 'fa-rocket',
                title: 'Premium Servers',
                description: 'Access to high-performance exclusive servers',
                premium: true
            },
            {
                icon: 'fa-magic',
                title: 'Custom Domains',
                description: 'Use your own domains for configurations',
                premium: true
            },
            {
                icon: 'fa-gem',
                title: 'VIP Features',
                description: 'Early access to new features and betas',
                premium: true
            }
        ]
    };

    const tabs = document.querySelectorAll('.features-tabs .tab');
    const contentContainer = document.querySelector('.features-content');

    function loadFeatures(category) {
        const features = featuresData[category] || [];
        contentContainer.innerHTML = features.map(feature => `
            <div class="feature-card ${feature.premium ? 'premium-feature' : ''}">
                <i class="fas ${feature.icon}"></i>
                <h3>${feature.title}</h3>
                <p>${feature.description}</p>
                ${feature.premium ? '<span class="premium-badge">Premium</span>' : ''}
            </div>
        `).join('');
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.features-tabs .tab.active')?.classList.remove('active');
            tab.classList.add('active');
            loadFeatures(tab.dataset.tab);
        });
    });

    loadFeatures('vpn');
}

function setupCommandExplorer() {
    const commandsData = [
        {
            name: 'config create',
            description: 'Create a new V2Ray configuration',
            category: 'vpn',
            usage: '/config create [location]',
            premium: false
        },
        {
            name: 'config list',
            description: 'List all your configurations',
            category: 'vpn',
            usage: '/config list',
            premium: false
        },
        {
            name: 'config delete',
            description: 'Delete a configuration',
            category: 'vpn',
            usage: '/config delete [id]',
            premium: false
        },
        {
            name: 'server status',
            description: 'Check server status and load',
            category: 'utility',
            usage: '/server status',
            premium: false
        },
        {
            name: 'premium activate',
            description: 'Activate premium features',
            category: 'premium',
            usage: '/premium activate [code]',
            premium: true
        },
        {
            name: 'speed test',
            description: 'Test connection speed',
            category: 'utility',
            usage: '/speed test',
            premium: false
        },
        {
            name: 'security check',
            description: 'Run security check on config',
            category: 'security',
            usage: '/security check [id]',
            premium: true
        },
        {
            name: 'auto renew',
            description: 'Set up auto-renewal for config',
            category: 'automation',
            usage: '/auto renew [id] [on/off]',
            premium: true
        },
        {
            name: 'team add',
            description: 'Add user to your team',
            category: 'management',
            usage: '/team add [user]',
            premium: true
        },
        {
            name: 'help',
            description: 'Show help information',
            category: 'utility',
            usage: '/help',
            premium: false
        },
        {
            name: 'protocol change',
            description: 'Change protocol for config',
            category: 'vpn',
            usage: '/protocol change [id] [protocol]',
            premium: true
        },
        {
            name: 'location list',
            description: 'List available server locations',
            category: 'vpn',
            usage: '/location list',
            premium: false
        }
    ];

    const searchInput = document.getElementById('command-search');
    const categorySelect = document.getElementById('command-category');
    const commandsGrid = document.querySelector('.commands-grid');

    function filterCommands() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categorySelect.value;
        
        const filtered = commandsData.filter(cmd => {
            const matchesSearch = cmd.name.toLowerCase().includes(searchTerm) || 
                                cmd.description.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || cmd.category === category;
            return matchesSearch && matchesCategory;
        });
        
        renderCommands(filtered);
    }

    function renderCommands(commands) {
        commandsGrid.innerHTML = commands.map(cmd => `
            <div class="command-card ${cmd.premium ? 'premium-command' : ''}">
                <div class="command-header">
                    <h3>/${cmd.name}</h3>
                    <span class="command-category ${cmd.category}">${cmd.category}</span>
                </div>
                <p class="command-description">${cmd.description}</p>
                <div class="command-footer">
                    <code class="command-usage">${cmd.usage}</code>
                    ${cmd.premium ? '<span class="premium-badge">Premium</span>' : ''}
                </div>
            </div>
        `).join('');
    }

    searchInput.addEventListener('input', filterCommands);
    categorySelect.addEventListener('change', filterCommands);

    filterCommands();
}

function initInteractiveElements() {
    const cards = document.querySelectorAll('.feature-card, .stat-card, .command-card, .tier-card, .tutorial-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
        
        if (card.classList.contains('tier-card')) {
            card.addEventListener('click', () => {
                document.querySelector('.tier-card.selected')?.classList.remove('selected');
                card.classList.add('selected');
            });
        }
    });
}

function createFloatingOrbs() {
    const colors = ['purple', 'pink', 'blue', 'teal', 'orange'];
    const container = document.getElementById('floating-elements');
    
    for (let i = 0; i < 12; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 20 + 10;
        const orb = document.createElement('div');
        orb.className = `floating-orb ${color}`;
        orb.style.width = `${size}px`;
        orb.style.height = `${size}px`;
        orb.style.left = `${Math.random() * 100}%`;
        orb.style.top = `${Math.random() * 100}%`;
        orb.style.animationDuration = `${Math.random() * 15 + 5}s`;
        orb.style.animationDelay = `${Math.random() * 10}s`;
        container.appendChild(orb);
    }
}

function setupThemeToggle() {
    const toggle = document.querySelector('.theme-toggle');
    const html = document.documentElement;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        html.classList.add('dark-theme');
        const icon = toggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
    
    toggle.addEventListener('click', () => {
        html.classList.toggle('dark-theme');
        const icon = toggle.querySelector('i');
        
        // Save preference
        if (html.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            localStorage.setItem('theme', 'light');
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
}

function setupFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            
            // Close all items first
            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-answer').style.maxHeight = '0';
                i.querySelector('.faq-question i').className = 'fas fa-chevron-down';
            });
            
            // Open current if it was closed
            if (!isOpen) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                question.querySelector('i').className = 'fas fa-chevron-up';
            }
        });
    });
}

function setupDashboardInteractivity() {
    const serverItems = document.querySelectorAll('.server-item');
    
    setInterval(() => {
        serverItems.forEach(item => {
            const loadElement = item.querySelector('.server-load');
            if (loadElement) {
                const currentLoad = parseInt(loadElement.textContent);
                const change = Math.floor(Math.random() * 10) - 4;
                let newLoad = currentLoad + change;
                newLoad = Math.max(5, Math.min(95, newLoad));
                loadElement.textContent = newLoad + '%';
                
                if (newLoad > 70) {
                    loadElement.style.color = '#ff4757';
                } else if (newLoad > 40) {
                    loadElement.style.color = '#eccc68';
                } else {
                    loadElement.style.color = '#2ed573';
                }
            }
        });
    }, 3000);
    
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    dashboardCards.forEach(card => {
        card.addEventListener('click', () => {
            dashboardCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });
}