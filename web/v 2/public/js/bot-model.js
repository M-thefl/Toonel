function initBotModel() {
    const container = document.getElementById('interactive-bot');
    if (!container) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Add 
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xA569BD, 2, 20);
    pointLight.position.set(0, 3, 5);
    scene.add(pointLight);
    
    const geometry = new THREE.SphereGeometry(2, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: 0x5D3FD3,
        emissive: 0x2A1B3D,
        specular: 0xA569BD,
        shininess: 50,
        transparent: true,
        opacity: 0.9
    });
    
    const botModel = new THREE.Mesh(geometry, material);
    scene.add(botModel);
    
    const ringGeometry = new THREE.TorusGeometry(3, 0.1, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xA569BD, 
        transparent: true, 
        opacity: 0.6 
    });
    
    const rings = [];
    for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = i * 0.5 - 0.5;
        rings.push(ring);
        scene.add(ring);
    }
    
    camera.position.z = 8;
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        botModel.rotation.x += 0.005;
        botModel.rotation.y += 0.01;
        
        rings.forEach((ring, i) => {
            ring.rotation.z += 0.005 * (i + 1);
            ring.position.y = Math.sin(Date.now() * 0.001 + i) * 0.5 + (i * 0.5 - 0.5);
        });
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
        const y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
        
        pointLight.position.x = x * 5;
        pointLight.position.y = y * 5;
    });
}

document.addEventListener('DOMContentLoaded', initBotModel);