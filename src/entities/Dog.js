// src/entities/Dog.js
// "El Chato": Compañero canino criollo callejero de Bogotá
import * as THREE from 'three';

export class Dog {
  constructor(scene, position = new THREE.Vector3(26, 0, 32)) {
    this.scene = scene;
    this.kind = 'dog';
    this.title = 'El Chato';
    this.isFriend = false;
    this.time = 0;
    this._barkTimer = 0;
    this._lastBarkTime = -99999;

    this.position = position.clone();
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this._buildModel();
    scene.add(this.group);
  }

  _buildModel() {
    const coatColor = 0x965a28; // Marrón dorado criollo
    const darkColor = 0x2c1a0e;
    const mat = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true });

    // 1. Cuerpo
    const bodyGeo = new THREE.BoxGeometry(0.35, 0.32, 0.65);
    this.body = new THREE.Mesh(bodyGeo, mat(coatColor));
    this.body.position.y = 0.38;
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.group.add(this.body);

    // 2. Cuello y Pañuelo rojo bogotano
    const collarGeo = new THREE.BoxGeometry(0.36, 0.08, 0.14);
    const collarMat = mat(0xd63031); // Rojo intenso
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 0.44, 0.28);
    this.group.add(collar);

    // 3. Cabeza
    const headGeo = new THREE.BoxGeometry(0.26, 0.24, 0.28);
    this.head = new THREE.Mesh(headGeo, mat(coatColor));
    this.head.position.set(0, 0.54, 0.38);
    this.head.castShadow = true;
    this.group.add(this.head);

    // Hocico y nariz
    const snoutGeo = new THREE.BoxGeometry(0.16, 0.12, 0.18);
    const snout = new THREE.Mesh(snoutGeo, mat(0xb07038));
    snout.position.set(0, 0.48, 0.54);
    this.group.add(snout);

    const noseGeo = new THREE.BoxGeometry(0.08, 0.06, 0.06);
    const nose = new THREE.Mesh(noseGeo, mat(darkColor));
    nose.position.set(0, 0.52, 0.64);
    this.group.add(nose);

    // Orejas caídas
    const earGeo = new THREE.BoxGeometry(0.06, 0.16, 0.1);
    this.leftEar = new THREE.Mesh(earGeo, mat(darkColor));
    this.leftEar.position.set(0.14, 0.6, 0.36);
    this.leftEar.rotation.z = -0.3;
    this.group.add(this.leftEar);

    this.rightEar = new THREE.Mesh(earGeo, mat(darkColor));
    this.rightEar.position.set(-0.14, 0.6, 0.36);
    this.rightEar.rotation.z = 0.3;
    this.group.add(this.rightEar);

    // 4. Cola curva y juguetona
    const tailGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.32, 6);
    this.tail = new THREE.Mesh(tailGeo, mat(coatColor));
    this.tail.position.set(0, 0.52, -0.38);
    this.tail.rotation.x = -Math.PI / 3;
    this.group.add(this.tail);

    // 5. Cuatro patas
    const legGeo = new THREE.BoxGeometry(0.09, 0.26, 0.09);
    const legMat = mat(coatColor);

    this.legFL = new THREE.Mesh(legGeo, legMat);
    this.legFL.position.set(0.13, 0.13, 0.22);
    this.group.add(this.legFL);

    this.legFR = new THREE.Mesh(legGeo, legMat);
    this.legFR.position.set(-0.13, 0.13, 0.22);
    this.group.add(this.legFR);

    this.legBL = new THREE.Mesh(legGeo, legMat);
    this.legBL.position.set(0.13, 0.13, -0.22);
    this.group.add(this.legBL);

    this.legBR = new THREE.Mesh(legGeo, legMat);
    this.legBR.position.set(-0.13, 0.13, -0.22);
    this.group.add(this.legBR);
  }

  befriend() {
    this.isFriend = true;
    this._barkTimer = 0;
  }

  pet() {
    // Reacciona agitando la cola
    this.time += 2;
  }

  bark(reason = '¡Guau!') {
    const now = performance.now();
    if (now - this._lastBarkTime < 7000) return;
    this._lastBarkTime = now;

    window.dispatchEvent(new CustomEvent('toast', {
      detail: { text: `🐕 El Chato: ${reason}`, type: 'info' }
    }));
  }

  update(dt, playerPosition, pickups = []) {
    this.time += dt;

    // Movimiento de cola
    const tailSpeed = this.isFriend ? 14 : 6;
    const tailAngle = Math.sin(this.time * tailSpeed) * (this.isFriend ? 0.45 : 0.2);
    this.tail.rotation.z = tailAngle;

    if (!playerPosition) return;

    const dx = playerPosition.x - this.position.x;
    const dz = playerPosition.z - this.position.z;
    const dist = Math.hypot(dx, dz);

    if (this.isFriend) {
      const stopDist = 2.4;
      const followSpeed = dist > 6 ? 4.8 : 3.4;

      if (dist > stopDist) {
        // Rotar y caminar hacia el jugador
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - this.group.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.group.rotation.y += diff * Math.min(1, 10 * dt);

        const moveDist = followSpeed * dt;
        this.position.x += (dx / dist) * moveDist;
        this.position.z += (dz / dist) * moveDist;
        this.group.position.copy(this.position);

        // Animación de patas al caminar
        const legSwing = Math.sin(this.time * 14) * 0.4;
        this.legFL.rotation.x = legSwing;
        this.legBR.rotation.x = legSwing;
        this.legFR.rotation.x = -legSwing;
        this.legBL.rotation.x = -legSwing;
      } else {
        // En reposo: mirar al jugador
        const targetAngle = Math.atan2(dx, dz);
        this.group.rotation.y = targetAngle;
        this.legFL.rotation.x = 0;
        this.legFR.rotation.x = 0;
        this.legBL.rotation.x = 0;
        this.legBR.rotation.x = 0;
      }

      // Olfato / Alerta de canecas con comida o cosas útiles
      this._barkTimer += dt;
      if (this._barkTimer > 10) {
        this._barkTimer = 0;
        const nearLoot = pickups.some((p) => p.position && p.position.distanceTo(this.position) < 8.5);
        if (nearLoot) {
          this.bark('¡Olfatea algo valioso en la basura cercana!');
        }
      }
    } else {
      // Si aún no es amigo: merodeo tranquilo
      const wander = Math.sin(this.time * 0.8) * 0.4;
      this.group.rotation.y += wander * dt;
    }
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
