const API = "http://localhost:5000"; // поменяй если надо

// ======================
// Добавление детали
// ======================
async function addDetail() {
    const file = document.getElementById("stl").files[0];

    const stlBase64 = await toBase64(file);

    const lsk = {
        x: +document.getElementById("x").value,
        y: +document.getElementById("y").value,
        z: +document.getElementById("z").value,
        rx: +document.getElementById("rx").value,
        ry: +document.getElementById("ry").value,
        rz: +document.getElementById("rz").value
    };

    const res = await fetch(API + "/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: document.getElementById("name").value,
            stl_file: stlBase64,
            lsk: lsk
        })
    });

    const data = await res.json();
    loadDetails();
}

// ======================
// Получение деталей
// ======================
async function loadDetails() {
    const res = await fetch(API + "/details");
    const details = await res.json();

    const container = document.getElementById("details");
    container.innerHTML = "";

    details.forEach(d => {
        const div = document.createElement("div");

        div.innerHTML = `
            <b>${d.name}</b><br>
            (${d.lsk.x}, ${d.lsk.y}, ${d.lsk.z})<br>

            <button onclick="deleteDetail('${d.id}')">Удалить</button>
        `;

        container.appendChild(div);
    });
}

// ======================
// Удаление
// ======================
async function deleteDetail(id) {
    await fetch(API + "/details/" + id, {
        method: "DELETE"
    });

    loadDetails();
}

// ======================
// Загрузка VAR + SGR
// ======================
async function uploadData() {
    const formData = new FormData();

    formData.append("var_file", document.getElementById("varFile").files[0]);
    formData.append("sgr_file", document.getElementById("sgrFile").files[0]);

    const res = await fetch(API + "/data", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    console.log("Ответ:", data);
}

// ======================
// Base64 helper
// ======================
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}

// старт
loadDetails();