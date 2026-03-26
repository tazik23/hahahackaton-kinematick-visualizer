// src/main.tsx   ← можно оставить .tsx, это не страшно
import { Visualizer } from './visualizer/Visualizer';
import type { AnimationData } from './visualizer/types';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100vh;">
    <div id="toolbar" style="padding:12px;background:#1a1a1a;color:white;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
      <h1 style="margin:0;font-size:18px;">🚂 Wagon Visualizer — 3D</h1>
      
      <button id="btn-body">Загрузить кузов</button>
      <button id="btn-w1">Загрузить КП1</button>
      <button id="btn-w2">Загрузить КП2</button>
      
      <button id="btn-test">▶ Запустить тестовую траекторию (5 сек)</button>
      <button id="btn-traj">📈 Траектория</button>
      
      <button id="play">▶ Play</button>
      <button id="pause">⏸ Pause</button>
      
      <button id="front">Спереди</button>
      <button id="side">Сбоку</button>
      <button id="top">Сверху</button>
      <button id="iso">Изометрия</button>
      
      <span style="margin-left:auto;">
        Следить за: 
        <select id="follow">
          <option value="">— центр —</option>
          <option value="Car body">Кузов</option>
          <option value="Wheelset1">Wheelset1</option>
        </select>
      </span>

      <!-- Ползунок времени -->
      <div style="display:flex;align-items:center;gap:8px;margin-left:20px;">
        <span style="font-size:14px;white-space:nowrap;">Время:</span>
        <input type="range" id="timeline" min="0" max="100" value="0" step="0.1" 
               style="width:300px; accent-color:#e63946;">
        <span id="time-display" style="font-family:monospace; min-width:60px;">0.00s</span>
      </div>
    </div>
    <div id="canvas" style="flex:1;background:#111;"></div>
  </div>
`;

const container = document.getElementById('canvas')!;
const visualizer = new Visualizer(container);
// === Обработчики UI ===

document.getElementById('btn-test')!.onclick = () => {
  test();                    // запускает нашу 5-секундную тестовую траекторию
};

document.getElementById('play')!.onclick = () => visualizer.play();
document.getElementById('pause')!.onclick = () => visualizer.pause();

document.getElementById('front')!.onclick = () => visualizer.setView('front');
document.getElementById('side')!.onclick = () => visualizer.setView('side');
document.getElementById('top')!.onclick = () => visualizer.setView('top');
document.getElementById('iso')!.onclick = () => visualizer.setView('isometric');

// Следить за деталью
(document.getElementById('follow') as HTMLSelectElement).onchange = (e) => {
  visualizer.toggleFollow((e.target as HTMLSelectElement).value || null);
};

// === Ползунок времени (работает в обе стороны) ===
const timeline = document.getElementById('timeline') as HTMLInputElement;
const timeDisplay = document.getElementById('time-display')!;

let isDragging = false;

// При изменении ползунка вручную — сразу применяем время
timeline.addEventListener('input', () => {
  if (!visualizer['animationData']) return;
  
  isDragging = true;
  const progress = parseFloat(timeline.value) / 100;           // 0.0 → 1.0
  const maxTime = visualizer['animationData'].times.at(-1) || 5;
  const targetTime = progress * maxTime;

  visualizer.setTime(targetTime);                             // ← ключевой вызов
  timeDisplay.textContent = targetTime.toFixed(2) + 's';
});

// Когда отпускаем ползунок — снимаем флаг
timeline.addEventListener('change', () => {
  isDragging = false;
});

// Обновление ползунка только во время автоматического воспроизведения
const originalAnimate = visualizer['animate'].bind(visualizer);
// =============================================
// ЛИНИЯ ТРАЕКТОРИИ ДВИЖЕНИЯ
// =============================================

let trajectoryLine: THREE.Line | null = null;
let trajectoryVisible = false;

function createTrajectoryLine() {
  if (!visualizer['animationData'] || !visualizer['animationData'].parts['Car body']) {
    console.warn('Нет данных для траектории');
    return;
  }

  const positions = visualizer['animationData'].parts['Car body'].positions;
  
  if (positions.length < 2) return;

  // Создаём точки линии (смещаем по высоте кузова, примерно +0.8м от центра)
  const points: THREE.Vector3[] = positions.map(pos => 
    new THREE.Vector3(pos[0], pos[1], pos[2] + 0.8)   // 0.8м — примерно середина высоты кузова
  );

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  const material = new THREE.LineBasicMaterial({ 
    color: 0xff0000,      // ярко-красный
    linewidth: 4 
  });

  // Удаляем старую линию, если была
  if (trajectoryLine) {
    visualizer['scene'].remove(trajectoryLine);
  }

  trajectoryLine = new THREE.Line(geometry, material);
  visualizer['scene'].add(trajectoryLine);
  
  console.log(`✅ Линия траектории создана (${points.length} точек)`);
}

function toggleTrajectory() {
  trajectoryVisible = !trajectoryVisible;

  if (trajectoryVisible) {
    createTrajectoryLine();
  } else if (trajectoryLine) {
    visualizer['scene'].remove(trajectoryLine);
    trajectoryLine = null;
  }

  console.log(`Траектория: ${trajectoryVisible ? 'включена' : 'выключена'}`);
}

// Обработчик кнопки
document.getElementById('btn-traj')!.onclick = toggleTrajectory;

visualizer['animate'] = function () {
  originalAnimate.call(this);

  if (visualizer['isPlaying'] && visualizer['animationData'] && !isDragging) {
    const elapsed = ((Date.now() - visualizer['playbackStartTime']) / 1000) * visualizer['currentSpeed'];
    const maxTime = visualizer['animationData'].times.at(-1) || 5;
    const clampedTime = Math.min(elapsed, maxTime);
    const progress = (clampedTime / maxTime) * 100;

    timeline.value = progress.toString();
    timeDisplay.textContent = clampedTime.toFixed(2) + 's';
  }
};
// Обработчики кнопок
document.getElementById('btn-body')!.onclick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.stl';
  input.onchange = e => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) visualizer.loadSTL(file, 'Car body');
  };
  input.click();
};

document.getElementById('btn-w1')!.onclick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.stl';
  input.onchange = e => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) visualizer.loadSTL(file, 'Wheelset1.WSet');
  };
  input.click();
};

document.getElementById('btn-w2')!.onclick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.stl';
  input.onchange = e => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) visualizer.loadSTL(file, 'Wheelset2.WSet');
  };
  input.click();
};

document.getElementById('play')!.onclick = () => visualizer.play();
document.getElementById('pause')!.onclick = () => visualizer.pause();

document.getElementById('front')!.onclick = () => visualizer.setView('front');
document.getElementById('side')!.onclick = () => visualizer.setView('side');
document.getElementById('top')!.onclick = () => visualizer.setView('top');
document.getElementById('iso')!.onclick = () => visualizer.setView('isometric');

(document.getElementById('follow') as HTMLSelectElement).onchange = (e) => {
  visualizer.toggleFollow((e.target as HTMLSelectElement).value || null);
};



// === ЛЕГЕНДА ОСЕЙ (видна всегда, особенно полезна в изометрии) ===
const legend = document.createElement('div');
legend.style.cssText = `
  position: absolute; 
  bottom: 15px; 
  right: 15px; 
  background: rgba(0,0,0,0.85); 
  color: white; 
  padding: 10px 14px; 
  border-radius: 6px; 
  font-size: 13px; 
  line-height: 1.5; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  z-index: 100;
  pointer-events: none;
`;
legend.innerHTML = `
  <strong>ЛСК:</strong>

  <span style="color:#ff4444">●</span> X — по ходу движения

  <span style="color:#44ff44">●</span> Y — влево

  <span style="color:#4488ff">●</span> Z — вверх
`;
document.body.appendChild(legend);
// === ДИАГНОСТИКА ПОЛОЖЕНИЯ ===
console.log('Текущие позиции деталей:');
for (const [name, mesh] of visualizer['meshes']) {
  console.log(name, mesh.position);
}
// === РАСШИРЕННАЯ ТЕСТОВАЯ ТРАЕКТОРИЯ (5 секунд) ===
const testTrajectory = {
  "time": [
    0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45,
    0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95,
    1.0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45,
    1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95,
    2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4, 2.45,
    2.5, 2.55, 2.6, 2.65, 2.7, 2.75, 2.8, 2.85, 2.9, 2.95,
    3.0, 3.05, 3.1, 3.15, 3.2, 3.25, 3.3, 3.35, 3.4, 3.45,
    3.5, 3.55, 3.6, 3.65, 3.7, 3.75, 3.8, 3.85, 3.9, 3.95,
    4.0, 4.05, 4.1, 4.15, 4.2, 4.25, 4.3, 4.35, 4.4, 4.45,
    4.5, 4.55, 4.6, 4.65, 4.7, 4.75, 4.8, 4.85, 4.9, 4.95, 5.0
  ],
  "details": {
    "detail_1": {
      "name": "Car body",
      "position": [
        [0.0, 0, 0], [0.1, 0, 0], [0.2, 0, 0], [0.3, 0, 0], [0.4, 0, 0],
        [0.5, 0, 0], [0.6, 0, 0], [0.7, 0, 0], [0.8, 0, 0], [0.9, 0, 0],
        [1.0, 0, 0], [1.1, 0, 0], [1.2, 0, 0], [1.3, 0, 0], [1.4, 0, 0],
        [1.5, 0, 0], [1.6, 0, 0], [1.7, 0, 0], [1.8, 0, 0], [1.9, 0, 0],
        [2.0, 0, 0], [2.1, 0, 0], [2.2, 0, 0], [2.3, 0, 0], [2.4, 0, 0],
        [2.5, 0, 0], [2.6, 0, 0], [2.7, 0, 0], [2.8, 0, 0], [2.9, 0, 0],
        [3.0, 0, 0], [3.1, 0, 0], [3.2, 0, 0], [3.3, 0, 0], [3.4, 0, 0],
        [3.5, 0, 0], [3.6, 0, 0], [3.7, 0, 0], [3.8, 0, 0], [3.9, 0, 0],
        [4.0, 0, 0], [4.1, 0, 0], [4.2, 0, 0], [4.3, 0, 0], [4.4, 0, 0],
        [4.5, 0, 0], [4.6, 0, 0], [4.7, 0, 0], [4.8, 0, 0], [4.9, 0, 0],
        [5.0, 0, 0], [5.1, 0, 0], [5.2, 0, 0], [5.3, 0, 0], [5.4, 0, 0],
        [5.5, 0, 0], [5.6, 0, 0], [5.7, 0, 0], [5.8, 0, 0], [5.9, 0, 0],
        [6.0, 0, 0], [6.1, 0, 0], [6.2, 0, 0], [6.3, 0, 0], [6.4, 0, 0],
        [6.5, 0, 0], [6.6, 0, 0], [6.7, 0, 0], [6.8, 0, 0], [6.9, 0, 0],
        [7.0, 0, 0], [7.1, 0, 0], [7.2, 0, 0], [7.3, 0, 0], [7.4, 0, 0],
        [7.5, 0, 0], [7.6, 0, 0], [7.7, 0, 0], [7.8, 0, 0], [7.9, 0, 0],
        [8.0, 0, 0], [8.1, 0, 0], [8.2, 0, 0], [8.3, 0, 0], [8.4, 0, 0],
        [8.5, 0, 0], [8.6, 0, 0], [8.7, 0, 0], [8.8, 0, 0], [8.9, 0, 0],
        [9.0, 0, 0], [9.1, 0, 0], [9.2, 0, 0], [9.3, 0, 0], [9.4, 0, 0],
        [9.5, 0, 0], [9.6, 0, 0], [9.7, 0, 0], [9.8, 0, 0], [9.9, 0, 0],
        [10.0, 0, 0]
      ],
      "angles": [
        [0, 0, 0], [0, 0.001, 0], [0, 0.002, 0], [0, 0.003, 0], [0, 0.004, 0],
        [0, 0.005, 0], [0, 0.006, 0], [0, 0.007, 0], [0, 0.008, 0], [0, 0.009, 0],
        [0, 0.01, 0], [0, 0.011, 0], [0, 0.012, 0], [0, 0.013, 0], [0, 0.014, 0],
        [0, 0.015, 0], [0, 0.016, 0], [0, 0.017, 0], [0, 0.018, 0], [0, 0.019, 0],
        [0, 0.02, 0], [0, 0.021, 0], [0, 0.022, 0], [0, 0.023, 0], [0, 0.024, 0],
        [0, 0.025, 0], [0, 0.026, 0], [0, 0.027, 0], [0, 0.028, 0], [0, 0.029, 0],
        [0, 0.03, 0], [0, 0.031, 0], [0, 0.032, 0], [0, 0.033, 0], [0, 0.034, 0],
        [0, 0.035, 0], [0, 0.036, 0], [0, 0.037, 0], [0, 0.038, 0], [0, 0.039, 0],
        [0, 0.04, 0], [0, 0.041, 0], [0, 0.042, 0], [0, 0.043, 0], [0, 0.044, 0],
        [0, 0.045, 0], [0, 0.046, 0], [0, 0.047, 0], [0, 0.048, 0], [0, 0.049, 0],
        [0, 0.05, 0], [0, 0.051, 0], [0, 0.052, 0], [0, 0.053, 0], [0, 0.054, 0],
        [0, 0.055, 0], [0, 0.056, 0], [0, 0.057, 0], [0, 0.058, 0], [0, 0.059, 0],
        [0, 0.06, 0], [0, 0.061, 0], [0, 0.062, 0], [0, 0.063, 0], [0, 0.064, 0],
        [0, 0.065, 0], [0, 0.066, 0], [0, 0.067, 0], [0, 0.068, 0], [0, 0.069, 0],
        [0, 0.07, 0], [0, 0.071, 0], [0, 0.072, 0], [0, 0.073, 0], [0, 0.074, 0],
        [0, 0.075, 0], [0, 0.076, 0], [0, 0.077, 0], [0, 0.078, 0], [0, 0.079, 0],
        [0, 0.08, 0], [0, 0.081, 0], [0, 0.082, 0], [0, 0.083, 0], [0, 0.084, 0],
        [0, 0.085, 0], [0, 0.086, 0], [0, 0.087, 0], [0, 0.088, 0], [0, 0.089, 0],
        [0, 0.09, 0], [0, 0.091, 0], [0, 0.092, 0], [0, 0.093, 0], [0, 0.094, 0],
        [0, 0.095, 0], [0, 0.096, 0], [0, 0.097, 0], [0, 0.098, 0], [0, 0.099, 0],
        [0, 0.1, 0]
      ]
    },
    "detail_2": {
      "name": "Wheelset1",
      "position": [
        [0.0, 0, 0.525], [0.1, 0, 0.525], [0.2, 0, 0.525], [0.3, 0, 05], [0.4, 0, 0.525],
        [0.5, 0, 0.525], [0.6, 0, 0.525], [0.7, 0, 0.525], [0.8, 0, 0.525], [0.9, 0, 0.525],
        [1.0, 0, 0.525], [1.1, 0, 0.525], [1.2, 0, 0.525], [1.3, 0, 0.525], [1.4, 0, 0.525],
        [1.5, 0, 0.525], [1.6, 0, 0.525], [1.7, 0, 0.525], [1.8, 0, 0.525], [1.9, 0, 0.525],
        [2.0, 0, 0.525], [2.1, 0, 0.525], [2.2, 0, 0.525], [2.3, 0, 0.525], [2.4, 0, 0.525],
        [2.5, 0, 0.525], [2.6, 0, 0.525], [2.7, 0, 0.525], [2.8, 0, 0.525], [2.9, 0, 0.525],
        [3.0, 0, 0.525], [3.1, 0, 0.525], [3.2, 0, 0.525], [3.3, 0, 0.525], [3.4, 0, 0.525],
        [3.5, 0, 0.525], [3.6, 0, 0.525], [3.7, 0, 0.525], [3.8, 0, 0.525], [3.9, 0, 0.525],
        [4.0, 0, 0.525], [4.1, 0, 0.525], [4.2, 0, 0.525], [4.3, 0, 0.525], [4.4, 0, 0.525],
        [4.5, 0, 0.525], [4.6, 0, 0.525], [4.7, 0, 0.525], [4.8, 0, 0.525], [4.9, 0, 0.525],
        [5.0, 0, 0.525], [5.1, 0, 0.525], [5.2, 0, 0.525], [5.3, 0, 0.525], [5.4, 0, 0.525],
        [5.5, 0, 0.525], [5.6, 0, 0.525], [5.7, 0, 0.525], [5.8, 0, 0.525], [5.9, 0, 0.525],
        [6.0, 0, 0.525], [6.1, 0, 0.525], [6.2, 0, 0.525], [6.3, 0, 0.525], [6.4, 0, 0.525],
        [6.5, 0, 0.525], [6.6, 0, 0.525], [6.7, 0, 0.525], [6.8, 0, 0.525], [6.9, 0, 0.525],
        [7.0, 0, 0.525], [7.1, 0, 0.525], [7.2, 0, 0.525], [7.3, 0, 0.525], [7.4, 0, 0.525],
        [7.5, 0, 0.525], [7.6, 0, 0.525], [7.7, 0, 0.525], [7.8, 0, 0.525], [7.9, 0, 0.525],
        [8.0, 0, 0.525], [8.1, 0, 0.525], [8.2, 0, 0.525], [8.3, 0, 0.525], [8.4, 0, 0.525],
        [8.5, 0, 0.525], [8.6, 0, 0.525], [8.7, 0, 0.525], [8.8, 0, 0.525], [8.9, 0, 0.525],
        [9.0, 0, 0.525], [9.1, 0, 0.525], [9.2, 0, 0.525], [9.3, 0, 0.525], [9.4, 0, 0.525],
        [9.5, 0, 0.525], [9.6, 0, 0.525], [9.7, 0, 0.525], [9.8, 0, 0.525], [9.9, 0, 0.525],
        [10.0, 0, 0.525]
      ],
      "angles": [
        [0, 1.25, 0], [1.25, 0, 0], [2.5, 0, 0], [3.75, 0, 0], [5.0, 0, 0],
        [6.25, 0, 0], [7.5, 0, 0], [8.75, 0, 0], [10.0, 0, 0], [11.25, 0, 0],
        [12.5, 0, 0], [13.75, 0, 0], [15.0, 0, 0], [16.25, 0, 0], [17.5, 0, 0],
        [18.75, 0, 0], [20.0, 0, 0], [21.25, 0, 0], [22.5, 0, 0], [23.75, 0, 0],
        [25.0, 0, 0], [26.25, 0, 0], [27.5, 0, 0], [28.75, 0, 0], [30.0, 0, 0],
        [31.25, 0, 0], [32.5, 0, 0], [33.75, 0, 0], [35.0, 0, 0], [36.25, 0, 0],
        [37.5, 0, 0], [38.75, 0, 0], [40.0, 0, 0], [41.25, 0, 0], [42.5, 0, 0],
        [43.75, 0, 0], [45.0, 0, 0], [46.25, 0, 0], [47.5, 0, 0], [48.75, 0, 0],
        [50.0, 0, 0], [51.25, 0, 0], [52.5, 0, 0], [53.75, 0, 0], [55.0, 0, 0],
        [56.25, 0, 0], [57.5, 0, 0], [58.75, 0, 0], [60.0, 0, 0], [61.25, 0, 0],
        [62.5, 0, 0], [63.75, 0, 0], [65.0, 0, 0], [66.25, 0, 0], [67.5, 0, 0],
        [68.75, 0, 0], [70.0, 0, 0], [71.25, 0, 0], [72.5, 0, 0], [73.75, 0, 0],
        [75.0, 0, 0], [76.25, 0, 0], [77.5, 0, 0], [78.75, 0, 0], [80.0, 0, 0],
        [81.25, 0, 0], [82.5, 0, 0], [83.75, 0, 0], [85.0, 0, 0], [86.25, 0, 0],
        [87.5, 0, 0], [88.75, 0, 0], [90.0, 0, 0], [91.25, 0, 0], [92.5, 0, 0],
        [93.75, 0, 0], [95.0, 0, 0], [96.25, 0, 0], [97.5, 0, 0], [98.75, 0, 0],
        [100.0, 0, 0], [101.25, 0, 0], [102.5, 0, 0], [103.75, 0, 0], [105.0, 0, 0],
        [106.25, 0, 0], [107.5, 0, 0], [108.75, 0, 0], [110.0, 0, 0], [111.25, 0, 0],
        [112.5, 0, 0], [113.75, 0, 0], [115.0, 0, 0], [116.25, 0, 0], [117.5, 0, 0],
        [118.75, 0, 0], [120.0, 0, 0], [121.25, 0, 0], [122.5, 0, 0], [123.75, 0, 0],
        [125.0, 0, 0]
      ]
    }
  }
};

// =============================================
// УПРОЩЁННЫЙ ЗАПУСК ТЕСТОВОЙ ТРАЕКТОРИИ
// =============================================

(window as any).test = () => {
  if (typeof testTrajectory === 'undefined') {
    console.error('❌ testTrajectory не найден. Убедись, что данные траектории объявлены выше.');
    return;
  }
  visualizer.setTrajectory(testTrajectory);
  visualizer.play();
  console.log('🚀 Тестовая траектория на 5 секунд запущена');
};

// Для загрузки реальных данных от бэкенда
(window as any).loadTrajectory = (json: any) => {
  visualizer.setTrajectory(json);
  visualizer.play();
  console.log('✅ Загружена траектория от бэкенда');
};