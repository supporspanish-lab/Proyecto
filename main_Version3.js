// Configuración básica de Three.js para vista superior
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight * 0.8;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

// Cámara vista cenital
const camera = new THREE.OrthographicCamera(
    WIDTH / -2, WIDTH / 2, HEIGHT / 2, HEIGHT / -2, 0.1, 1000
);
camera.position.set(0, 200, 0); // Arriba mirando hacia abajo
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(WIDTH, HEIGHT);
document.getElementById('game-container').appendChild(renderer.domElement);

// Añadir "jugador" (un cubo verde)
const jugadorGeometry = new THREE.BoxGeometry(30, 10, 30);
const jugadorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const jugador = new THREE.Mesh(jugadorGeometry, jugadorMaterial);
jugador.position.set(0, 5, 0);
scene.add(jugador);

// Suelo
const sueloGeometry = new THREE.PlaneGeometry(400, 400);
const sueloMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
const suelo = new THREE.Mesh(sueloGeometry, sueloMaterial);
suelo.rotation.x = -Math.PI / 2;
scene.add(suelo);

// Zombis básicos
let zombis = [];
function crearZombi() {
    const geometry = new THREE.BoxGeometry(20, 10, 20);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const zombi = new THREE.Mesh(geometry, material);
    // Aparece en un borde aleatorio
    let x = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random()*40);
    let z = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random()*40);
    zombi.position.set(x, 5, z);
    scene.add(zombi);
    zombis.push(zombi);
}
setInterval(() => {
    if (zombis.length < 10) crearZombi();
}, 2000);

// Disparos
let balas = [];
function disparar() {
    const geometry = new THREE.SphereGeometry(5, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bala = new THREE.Mesh(geometry, material);
    bala.position.set(jugador.position.x, 5, jugador.position.z);
    bala.userData = {
        dx: direccion.x,
        dz: direccion.z
    };
    scene.add(bala);
    balas.push(bala);
}

// Dirección de disparo (por defecto hacia arriba)
let direccion = { x: 0, z: -1 };
// Cambiar dirección según teclas (WASD)
window.addEventListener('keydown', (e) => {
    if (e.key === "ArrowUp" || e.key === "w") { movimiento.arriba = true; direccion.x = 0; direccion.z = -1; }
    if (e.key === "ArrowDown" || e.key === "s") { movimiento.abajo = true; direccion.x = 0; direccion.z = 1; }
    if (e.key === "ArrowLeft" || e.key === "a") { movimiento.izquierda = true; direccion.x = -1; direccion.z = 0; }
    if (e.key === "ArrowRight" || e.key === "d") { movimiento.derecha = true; direccion.x = 1; direccion.z = 0; }
    if (e.key === " ") disparar();
});
window.addEventListener('keyup', (e) => {
    if (e.key === "ArrowUp" || e.key === "w") movimiento.arriba = false;
    if (e.key === "ArrowDown" || e.key === "s") movimiento.abajo = false;
    if (e.key === "ArrowLeft" || e.key === "a") movimiento.izquierda = false;
    if (e.key === "ArrowRight" || e.key === "d") movimiento.derecha = false;
});

// Movimiento táctil (básico)
let movimiento = { arriba: false, abajo: false, izquierda: false, derecha: false };
let startX, startY;
renderer.domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }
}, false);
renderer.domElement.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        movimiento.izquierda = dx < -30;
        movimiento.derecha = dx > 30;
        movimiento.arriba = dy < -30;
        movimiento.abajo = dy > 30;

        // Cambia dirección de disparo según swipe
        if (movimiento.arriba) direccion = {x: 0, z: -1};
        if (movimiento.abajo) direccion = {x: 0, z: 1};
        if (movimiento.izquierda) direccion = {x: -1, z: 0};
        if (movimiento.derecha) direccion = {x: 1, z: 0};
    }
}, false);
renderer.domElement.addEventListener('touchend', (e) => {
    movimiento = { arriba: false, abajo: false, izquierda: false, derecha: false };
    // Dispara al soltar el dedo
    disparar();
}, false);

// Movimiento del jugador
function moverJugador() {
    const velocidad = 2;
    if (movimiento.arriba) jugador.position.z -= velocidad;
    if (movimiento.abajo) jugador.position.z += velocidad;
    if (movimiento.izquierda) jugador.position.x -= velocidad;
    if (movimiento.derecha) jugador.position.x += velocidad;
    // Limita el movimiento al área del suelo
    jugador.position.x = Math.max(-180, Math.min(180, jugador.position.x));
    jugador.position.z = Math.max(-180, Math.min(180, jugador.position.z));
}

// Mover zombis hacia el jugador
function moverZombis() {
    zombis.forEach((zombi, i) => {
        const dx = jugador.position.x - zombi.position.x;
        const dz = jugador.position.z - zombi.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist > 3) {
            zombi.position.x += (dx/dist)*0.5;
            zombi.position.z += (dz/dist)*0.5;
        } else {
            // Colisión con jugador
            vidas--;
            scene.remove(zombi);
            zombis.splice(i, 1);
        }
    });
}

// Mover balas y detectar colisión con zombis
function moverBalas() {
    balas.forEach((bala, i) => {
        bala.position.x += bala.userData.dx * 5;
        bala.position.z += bala.userData.dz * 5;
        // Si sale de los límites, eliminar
        if (Math.abs(bala.position.x) > 200 || Math.abs(bala.position.z) > 200) {
            scene.remove(bala);
            balas.splice(i, 1);
            return;
        }
        // Colisión con zombis
        zombis.forEach((zombi, j) => {
            const dx = bala.position.x - zombi.position.x;
            const dz = bala.position.z - zombi.position.z;
            if (Math.sqrt(dx*dx + dz*dz) < 15) {
                scene.remove(zombi);
                zombis.splice(j, 1);
                scene.remove(bala);
                balas.splice(i, 1);
                puntos += 10;
            }
        });
    });
}

// UI
let vidas = 3;
let puntos = 0;
let ui = document.createElement('div');
ui.id = "ui";
document.body.appendChild(ui);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    moverJugador();
    moverZombis();
    moverBalas();
    ui.innerHTML = `Vidas: ${vidas} <br> Puntos: ${puntos}`;
    if (vidas <= 0) {
        ui.innerHTML += "<br><b>¡Has perdido!</b>";
        return;
    }
    renderer.render(scene, camera);
}
animate();