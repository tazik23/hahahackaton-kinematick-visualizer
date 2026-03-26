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
          <option value="Wheelset1.WSet">КП1</option>
          <option value="Wheelset2.WSet">КП2</option>
        </select>
      </span>
    </div>
    <div id="canvas" style="flex:1;background:#111;"></div>
  </div>
`;

const container = document.getElementById('canvas')!;
const visualizer = new Visualizer(container);

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

// Для быстрого теста анимации (позже)
(window as any).testAnim = (data: AnimationData) => {
  visualizer.setAnimationData(data);
};