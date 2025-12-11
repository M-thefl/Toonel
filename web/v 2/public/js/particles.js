document.addEventListener('DOMContentLoaded', function() {
    particlesJS('particles-js', {
        "particles": {
            "number": {
                "value": 80,
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": "#6C5CE7"
            },
            "shape": {
                "type": "circle",
                "stroke": {
                    "width": 0,
                    "color": "#000000"
                },
                "polygon": {
                    "nb_sides": 5
                }
            },
            "opacity": {
                "value": 0.5,
                "random": true,
                "anim": {
                    "enable": true,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
                }
            },
            "size": {
                "value": 3,
                "random": true,
                "anim": {
                    "enable": true,
                    "speed": 2,
                    "size_min": 0.1,
                    "sync": false
                }
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": "#6C5CE7",
                "opacity": 0.2,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 1,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                    "enable": true,
                    "rotateX": 600,
                    "rotateY": 1200
                }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": true,
                    "mode": "grab"
                },
                "onclick": {
                    "enable": true,
                    "mode": "push"
                },
                "resize": true
            },
            "modes": {
                "grab": {
                    "distance": 140,
                    "line_linked": {
                        "opacity": 0.5
                    }
                },
                "push": {
                    "particles_nb": 4
                }
            }
        },
        "retina_detect": true
    });

    createFloatingElements();
});

function createFloatingElements() {
    const container = document.getElementById('particles-js');
    
    for (let i = 0; i < 5; i++) {
        const orb = document.createElement('div');
        orb.className = 'glow';
        orb.style.width = `${Math.random() * 100 + 50}px`;
        orb.style.height = orb.style.width;
        orb.style.left = `${Math.random() * 100}%`;
        orb.style.top = `${Math.random() * 100}%`;
        container.appendChild(orb);
        
        animateOrb(orb);
    }
}

function animateOrb(orb) {
    let x = parseFloat(orb.style.left);
    let y = parseFloat(orb.style.top);
    let xSpeed = (Math.random() - 0.5) * 0.2;
    let ySpeed = (Math.random() - 0.5) * 0.2;
    
    function move() {
        x += xSpeed;
        y += ySpeed;
        
        if (x < 0 || x > 100) {
            xSpeed *= -1;
            x = x < 0 ? 0 : 100;
        }
        if (y < 0 || y > 100) {
            ySpeed *= -1;
            y = y < 0 ? 0 : 100;
        }
        
        orb.style.left = `${x}%`;
        orb.style.top = `${y}%`;
        
        requestAnimationFrame(move);
    }
    
    move();
}