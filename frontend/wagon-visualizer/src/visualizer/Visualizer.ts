import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Visualizer {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  private renderer = new THREE.WebGLRenderer({ antialias: true });
  private controls: OrbitControls;
  private clock = new THREE.Clock();

  private meshes = new Map<string, THREE.Mesh>();
  private lskHelpers = new Map<string, THREE.AxesHelper>();
  private animationData: AnimationData | null = null;
  private isPlaying = false;
  private playbackStartTime = 0;
  private currentSpeed = 1;
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

    this.camera.position.set(10, -15, 8);
    this.camera.lookAt(0, 0, 2.5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;

    this.addLights();
    this.addGSCAxes();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  private addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, -10, 15);
    this.scene.add(dirLight);
  }

  private addGSCAxes() {
    const axes = new THREE.AxesHelper(5);
    this.scene.add(axes);
  }

  // === ШАГ 4. Загрузка STL (вызывается из UI) ===
  async loadSTL(file: File, partName: string): Promise<void> {
    const url = URL.createObjectURL(file);
    const loader = new STLLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (geometry) => {
          const material = new THREE.MeshPhongMaterial({
            color: partName === 'Car body' ? 0xff4444 : 0x666666,
            shininess: 30,
            flatShading: true,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.scale.setScalar(0.001); // STL в мм → метры
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Начальная позиция по ЛСК
          const initPos = this.initialLSKPositions[partName];
          if (initPos) mesh.position.copy(initPos);

          this.scene.add(mesh);
          this.meshes.set(partName, mesh);

          // ЛСК-осей (по умолчанию скрыты)
          const axes = new THREE.AxesHelper(1.5);
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

  // === ШАГ 5. Приём данных анимации от backend ===
  setAnimationData(data: AnimationData) {
    this.animationData = data;

    // Применяем первый кадр сразу
    if (data.times.length > 0) {
      this.applyFrame(0);
    }
  }

  private applyFrame(index: number) {
    if (!this.animationData) return;

    const clampIndex = Math.min(Math.max(index, 0), this.animationData.times.length - 1);

    for (const [partName, mesh] of this.meshes) {
      const part = this.animationData.parts[partName as keyof AnimationData['parts']];
      if (!part) continue;

      const pos = part.positions[clampIndex];
      const rot = part.rotations[clampIndex];

      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.rotation.set(rot[0], rot[1], rot[2]); // Euler XYZ — соответствует описанию в ТЗ
    }
  }

  // === ШАГ 6. Система анимации ===
  play() {
    if (!this.animationData) return;
    this.isPlaying