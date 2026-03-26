const API = "http://localhost:5000/api";

// Добавление детали
async function addDetail() {
    const fileInput = document.getElementById("stl");
    if (fileInput.files.length === 0) {
        alert("Выберите STL файл!");
        return;
    }

    const file = fileInput.files[0];
    const name = file.name; // имя детали берём из файла

    const lsk = {
        x: +document.getElementById("x").value,
        y: +document.getElementById("y").value,
        z: +document.getElementById("z").value,
        rx: +document.getElementById("rx").value,
        ry: +document.getElementById("ry").value,
        rz: +document.getElementById("rz").value
    };

    // Отправляем только имя и координаты
    const res = await fetch(API + "/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, lsk })
    });

    const data = await res.json();
    console.log("Добавлено:", data);

    // Сохраняем STL локально
    saveFileLocally(file);

    loadDetails();
}

// Сохраняем файл локально для другого фронта
function saveFileLocally(file) {
    // В простом случае можно сохранять через ссылку для скачивания
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
}

// Получение деталей
async function loadDetails() {
    const res = await fetch(API + "/details");
    const details = await res.json();

    const container = document.getElementById("details");
    container.innerHTML = "";

    details.forEach(d => {
        const div = document.createElement("div");
        div.innerHTML = `
            <b>${d.name}</b><br>
            (${d.lsk.x}, ${d.lsk.y}, ${d.lsk.z}, ${d.lsk.rx}, ${d.lsk.ry}, ${d.lsk.rz})<br>
            <button onclick="updateDetail('${d.id}')">Отправить</button>
            <button onclick="deleteDetail('${d.id}')">Удалить</button>
        `;
        container.appendChild(div);
    });
}

// Обновление детали (только координаты)
async function updateDetail(id) {
    const lsk = {
        x: +prompt("x", "0"),
        y: +prompt("y", "0"),
        z: +prompt("z", "0"),
        rx: +prompt("rx", "0"),
        ry: +prompt("ry", "0"),
        rz: +prompt("rz", "0")
    };

    await fetch(`${API}/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lsk })
    });

    loadDetails();
}

// Удаление
async function deleteDetail(id) {
    await fetch(`${API}/details/${id}`, { method: "DELETE" });
    loadDetails();
}

// Загрузка VAR + SGR
async function uploadData() {
    const varFile = document.getElementById("varFile").files[0];
    const sgrFile = document.getElementById("sgrFile").files[0];

    if (!varFile || !sgrFile) {
        alert("Выберите оба файла!");
        return;
    }

    const formData = new FormData();
    formData.append("var_file", varFile);
    formData.append("sgr_file", sgrFile);

    const res = await fetch(`${API}/data`, {
        method: "POST",
        body: formData
    });

    const data = await res.json();
    console.log("VAR+SGR ответ:", data);
}

// Старт
loadDetails();