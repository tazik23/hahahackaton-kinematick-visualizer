import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AnimationData, ViewType } from './types';

export class Visualizer {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(60, 800 / 600, 0.1, 1000);
  private renderer = new THREE.WebGLRenderer({ antialias: true });
  private controls: OrbitControls;

  private meshes = new Map<string, THREE.Mesh>();
  private lskHelpers = new Map<string, THREE.AxesHelper>();
  private animationData: AnimationData | null = null;

  private isPlaying = false;
  private playbackStartTime = 0;
  private currentSpeed = 1.0;
  private followPart: string | null = null;

  private readonly initialLSKPositions: Record<string, THREE.Vector3> = {
    'Car body': new THREE.Vector3(0, 0, 0),
    'Wheelset1.WSet': new THREE.Vector3(3.29, 0, 0.525),
    'Wheelset2.WSet': new THREE.Vector3(-3.71, 0, 0.525),
  };

  constructor(container: HTMLElement) {
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.camera.position.set(12, -18, 10);
    this.camera.lookAt(0, 0, 2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;

    this.addLights();
    this.addGlobalAxes();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  private addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(15, -10, 20);
    this.scene.add(dirLight);
  }

  private addGlobalAxes() {
    const axes = new THREE.AxesHelper(8);
    this.scene.add(axes);
  }

  // Загрузка STL
  async loadSTL(file: File, partName: string): Promise<void> {
    const url = URL.createObjectURL(file);
    const loader = new STLLoader();

    return new Promise((resolve, reject) => {
      loader.load(url,
        (geometry) => {
          const material = new THREE.MeshPhongMaterial({
            color: partName === 'Car body' ? 0xe63946 : 0x2a2a2a,
            shininess: 40,
            flatShading: true,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.scale.setScalar(0.001); // мм → метры
          const initPos = this.initialLSKPositions[partName];
          if (initPos) mesh.position.copy(initPos);

          this.scene.add(mesh);
          this.meshes.set(partName, mesh);

          const axes = new THREE.AxesHelper(2);
          mesh.add(axes);
          this.lskHelpers.set(partName, axes);
          axes.visible = false;

          URL.revokeObjectURL(url);
          resolve();
        },
        undefined,
        reject
      );
    });
  }

  // Приём данных анимации
  setAnimationData(data: AnimationData) {
    this.animationData = data;
    if (data.times.length > 0) this.applyFrame(0);
  }

  private applyFrame(index: number) {
    if (!this.animationData) return;
    const clamped = Math.min(Math.max(index, 0), this.animationData.times.length - 1);

    for (const [partName, mesh] of this.meshes) {
      const part = this.animationData.parts[partName as keyof AnimationData['parts']];
      if (!part) continue;

      const pos = part.positions[clamped];
      const rot = part.rotations[clamped];

      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.rotation.set(rot[0], rot[1], rot[2]);
    }
  }

  // Управление анимацией
  play() { this.isPlaying = true; this.playbackStartTime = Date.now(); }
  pause() { this.isPlaying = false; }
  setSpeed(speed: number) { this.currentSpeed = speed; }

  setTime(seconds: number) {
    if (!this.animationData) return;
    const index = this.findClosestFrame(seconds);
    this.applyFrame(index);
  }

  private findClosestFrame(seconds: number): number {
    if (!this.animationData) return 0;
    let low = 0, high = this.animationData.times.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.animationData.times[mid] < seconds) low = mid + 1;
      else high = mid;
    }
    return low;
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();

    if (this.isPlaying && this.animationData) {
      const elapsed = ((Date.now() - this.playbackStartTime) / 1000) * this.currentSpeed;
      const index = this.findClosestFrame(elapsed);
      this.applyFrame(index);

      if (this.followPart) {
        const mesh = this.meshes.get(this.followPart);
        if (mesh) this.controls.target.copy(mesh.position);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  // Управление камерой
  setView(view: ViewType) {
    this.controls.reset();
    switch (view) {
      case 'front': this.camera.position.set(25, 0, 8); this.camera.lookAt(0, 0, 2.5); break;
      case 'side':  this.camera.position.set(0, -30, 8); this.camera.lookAt(0, 0, 2.5); break;
      case 'top':   this.camera.position.set(0, 0, 35); this.camera.lookAt(0, 0, 0); break;
      case 'isometric': this.camera.position.set(18, -18, 18); this.camera.lookAt(0, 0, 2.5); break;
    }
    this.camera.updateProjectionMatrix();
  }

  toggleFollow(partName: string | null) {
    this.followPart = partName;
    if (!partName) this.controls.target.set(0, 0, 2.5);
  }

  toggleLSK(partName: string, visible: boolean) {
    const helper = this.lskHelpers.get(partName);
    if (helper) helper.visible = visible;
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    this.meshes.forEach(m => this.scene.remove(m));
  }
  // === УНИВЕРСАЛЬНЫЙ МЕТОД ДЛЯ ЛЮБОЙ ТРАЕКТОРИИ ===
  setTrajectory(rawData: TrajectoryData) {
    const normalized: AnimationData = {
      times: rawData.time,
      parts: {}
    };

    // Преобразуем детали по полю "name"
    for (const detail of Object.values(rawData.details)) {
      const partName = detail.name;                    // "Car body", "Wheelset1" и т.д.

      normalized.parts[partName] = {
        positions: detail.position,
        rotations: detail.angles
      };
    }

    this.animationData = normalized;

    // Применяем первый кадр сразу
    if (normalized.times.length > 0) {
      this.applyFrame(0);
    }

    console.log(`✅ Загружена траектория с ${Object.keys(normalized.parts).length} деталями`);
    console.log('Детали:', Object.keys(normalized.parts));
  }
} 