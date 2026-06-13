document.addEventListener("DOMContentLoaded", () => {
const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");
const spinSound = document.getElementById("spinSound");
const winSound = document.getElementById("winSound");
const params = new URLSearchParams(window.location.search);
const firebaseConfig = {
  apiKey: "AIzaSyDWxXeQHPmtnX06JKvRdlHIvtWpqldEUIQ",
  authDomain: "ruleta-pokemon-a3292.firebaseapp.com",
  projectId: "ruleta-pokemon-a3292",
  storageBucket: "ruleta-pokemon-a3292.firebasestorage.app",
  messagingSenderId: "874560597734",
  appId: "1:874560597734:web:421718f8dc997aef7ad527",
  measurementId: "G-601DGGRMXJ"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function getUserId() {
    let id = localStorage.getItem("ruletaUserId");
    if (!id) {
        id = Math.random().toString(36).substring(2, 10);
        localStorage.setItem("ruletaUserId", id);
    }
    return id;
}

const userId = getUserId();

document.addEventListener("click", (e) => {

    const btnImagen = e.target.closest(".btnImagen");

    if (!btnImagen) return;
    participanteSeleccionado = 
       Number(btnImagen.dataset.index);

    document
      .getElementById("fileInput")
      .click();    
    
});

const participantesOriginales = [
    { nombre: "Ali", imagen: null },
    { nombre: "Beatriz", imagen: null },
    { nombre: "Charles", imagen: null },
    { nombre: "Diya", imagen: null },
    { nombre: "Eric", imagen: null },
    { nombre: "Fatima", imagen: null },
    { nombre: "Gabriel", imagen: null },
    { nombre: "Hanna", imagen: null }
];



const colores = [
    "#4285F4",
    "#EA4335",
    "#FBBC05",
    "#34A853",
    "#4285F4",
    "#EA4335",
    "#FBBC05",
    "#34A853"
];

let participantes =
    [...participantesOriginales];
let anguloActual = 0;
let participanteSeleccionado = null;

const data = params.get("data");

function inicializar(participantesCargados) {
    participantes = participantesCargados;

    renderLista();
    dibujarRuleta();
}

// 🔵 CASO 1: URL
if (data) {

    try {
        inicializar(
            JSON.parse(
                LZString.decompressFromEncodedURIComponent(data)
            )
        );

    } catch (e) {
        alert("Link roto");
    }

// 🔵 CASO 2: Firebase
} else {
    db.collection("ruletas")
      .doc(userId)
      .get()
      .then((doc) => {
          if (doc.exists) {
              inicializar(doc.data().participantes || []);
          } else {
              inicializar(participantesOriginales);
          }
      });
}

function dibujarRuleta() {
    const total = participantes.length;

    if (total === 0) {
        ctx.clearRect(0, 0, 600, 600);
        return;
    }

    const angulo = (2 * Math.PI) / total;

    // Precargar todas las imágenes primero
    const promesas = participantes.map(p => {
        if (!p.imagen) return Promise.resolve(null);
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = p.imagen;
        });
    });

    Promise.all(promesas).then(imagenes => {

        ctx.clearRect(0, 0, 600, 600);

        participantes.forEach((participante, i) => {

            const inicio = i * angulo;
            const fin = inicio + angulo;

            ctx.beginPath();
            ctx.moveTo(300, 300);
            ctx.arc(300, 300, 280, inicio, fin);
            ctx.fillStyle = colores[i % colores.length];
            ctx.fill();

            ctx.save();
            ctx.translate(300, 300);
            ctx.rotate(inicio + angulo / 2);

            ctx.fillStyle = "white";
            ctx.font = "24px Arial";
            ctx.textAlign = "right";
            ctx.fillText(participante?.nombre ?? "Sin nombre", 240, 10);

            // Dibujar imagen si existe, ya cargada
            if (imagenes[i]) {
                ctx.drawImage(imagenes[i], 150, -20, 40, 40);
            }

            ctx.restore();
        });

        // Centro blanco
        ctx.beginPath();
        ctx.arc(300, 300, 60, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
    });
}

function guardarEnFirebase() {
    db.collection("ruletas")
      .doc(userId)
      .set({ participantes: participantes });
}

const btnAgregar = document.getElementById("actualizar");
const panelAgregar = document.getElementById("panelAgregar");

if (btnAgregar && panelAgregar) {
    btnAgregar.addEventListener("click", () => {
        panelAgregar.classList.toggle("activo");
        if(panelAgregar.classList.contains("activo")) {
            renderLista();
        }
    });
}

const btnAgregarUno = document.getElementById("agregarUno");
const inputNombre = document.getElementById("nuevoNombre");
const btnEliminar = document.getElementById("eliminarSeleccionados");

if (btnEliminar) {
    btnEliminar.addEventListener("click", () => {
        eliminarSeleccionados();
    });
}

if (btnAgregarUno) {
    btnAgregarUno.addEventListener("click", () => {

        const nombre = inputNombre.value.trim();

        if (nombre === "") return;

        if (!participantes.some(p => p.nombre === nombre)) {
            participantes.push({
                nombre: nombre,
                imagen: null
            })
        }

        guardarEnFirebase();

        inputNombre.value = "";

        renderLista();
        dibujarRuleta();

        guardarParticipantes();
    });
}

const rueda = document.getElementById("ruleta");

document.getElementById("girar").addEventListener("click", () => {

     if (rueda.classList.contains("girando")) return;
     rueda.classList.add("girando");

     spinSound.pause();
     spinSound.currentTime = 0;
     spinSound.play().catch(() => {});

    const vueltas = 5 + Math.random()*5;
    const extra = Math.random()*360;

    const giro = vueltas*360 + extra;

    anguloActual += giro;

    rueda.style.transition = "transform 5s ease-out";
    rueda.style.transform = `rotate(${anguloActual}deg)`;

    setTimeout(() => {


        spinSound.currentTime = 0;

        const grados = anguloActual % 360;

        const gradosPorSector = 360 / participantes.length;

        
        const indice = Math.floor(
             ((360 - grados + 90) % 360) / gradosPorSector
        ) % participantes.length;

        if(!participantes[indice]) return;

        document.getElementById("resultado").textContent =
            "Ganador: " + participantes[indice].nombre;
            mostrarPopupGanador(
             participantes[indice]
            );
             agregarAlHistorial(participantes[indice]);
             spinSound.pause();

            winSound.currentTime = 0;
            winSound.play();

        lanzarConfeti();

         rueda.classList.remove("girando");

    },5000);

});


function lanzarConfeti() {
  const duration = 2500;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 4,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

function mostrarPopupGanador(participante){

    const popup = document.getElementById("popupGanador");
    const nombre = document.getElementById("nombreGanador");
    const imagen = document.getElementById("imagenGanador");

    nombre.textContent = participante.nombre;

    if(participante.imagen){

        imagen.src = participante.imagen;
        imagen.style.display = "block";

    }else{

        imagen.style.display = "none";

    }

    popup.classList.remove("oculto");
}

document
.getElementById("cerrarPopup")
.addEventListener("click", () => {

    document
    .getElementById("popupGanador")
    .classList.add("oculto");

});

document
.getElementById("volverAGirar")
.addEventListener("click", () => {

    document
    .getElementById("popupGanador")
    .classList.add("oculto");

    document
    .getElementById("girar")
    .click();

});

const btnOpciones = document.getElementById("btnOpciones");
const panelOpciones = document.getElementById("panelOpciones");

if (btnOpciones && panelOpciones) {
    btnOpciones.addEventListener("click", () => {
        panelOpciones.classList.toggle("oculto");
    });
}

const btnExportar =
    document.getElementById("exportarRuleta");

const btnImportar =
    document.getElementById("importarRuleta");

function exportarRuleta() {

    const datos =
        JSON.stringify(
            participantes,
            null,
            2
        );

    const blob =
        new Blob(
            [datos],
            { type: "application/json" }
        );

    const url =
        URL.createObjectURL(blob);

    const enlace =
        document.createElement("a");

    enlace.href = url;

    let nombreArchivo = prompt(
    "Nombre del archivo (sin extensión):",
    "mi-ruleta"
);

if (!nombreArchivo) {
    nombreArchivo = "mi-ruleta";
}

enlace.download = nombreArchivo + ".json";

    enlace.click();

    URL.revokeObjectURL(url);

}

if (btnExportar) {

    btnExportar.addEventListener(
        "click",
        exportarRuleta
    );

}

if (btnImportar) {

    btnImportar.addEventListener(
        "click",
        () => {

            document
            .getElementById("importFile")
            .click();

        }
    );

}

const btnResetear =
    document.getElementById("resetearRuleta");
    if (btnResetear) {

    btnResetear.addEventListener("click", () => {

        if (!confirm("¿Restaurar la ruleta original?")) {
            return;
        }

        participantes =
            structuredClone(participantesOriginales);

        guardarParticipantes();

        renderLista();
        dibujarRuleta();

    });

}

const barajarBtn = document.getElementById("barajar");

if (barajarBtn) {
    barajarBtn.addEventListener("click", () => {

        participantes.sort(() => Math.random() - 0.5);
        renderLista();
        dibujarRuleta();
        guardarParticipantes();
        guardarEnFirebase();
    });
}

const ordenarBtn = document.getElementById("ordenar");

if (ordenarBtn) {
    ordenarBtn.addEventListener("click", () => {
        participantes.sort((a, b) =>
            a.nombre.localeCompare(b.nombre)
        );
        renderLista();
        dibujarRuleta();
        guardarParticipantes();
        guardarEnFirebase();
    });
}




function renderLista() {

    const cont = document.getElementById("listaParticipantes");

    if(!cont) return;
    cont.innerHTML = "";

    participantes.forEach((participante, index) => {

        const div = document.createElement("div");
        div.className = "participante-item";

        div.innerHTML = `
            <label>
                <input type="checkbox" class="chk" value="${participante.nombre}">
                ${participante.nombre}
            </label>

            <button class="btnImagen" data-index="${index}">
            🖼️ 
            </button>
        `;

        cont.appendChild(div);
    });
}

function eliminarSeleccionados() {

    console.log("ELIMINAR FUNCIONA");

    const checks = document.querySelectorAll(".chk");

    const nombresAEliminar = [];

    checks.forEach(chk => {
        if (chk.checked) {
            nombresAEliminar.push(chk.value);
        }
    });

    console.log(nombresAEliminar);

    if (nombresAEliminar.length === 0) {
        alert("No has seleccionado nada");
        return;
    }

    // eliminar del array
    nombresAEliminar.forEach(nombre => {
        const index = participantes.findIndex(
            p => p.nombre === nombre
        );
        if (index !== -1) {
            participantes.splice(index, 1);
        }
    });

    guardarEnFirebase();
    // 🔥 ESTO ES LO IMPORTANTE
    renderLista();               // ← actualiza checkboxes
    dibujarRuleta();            // ← actualiza ruleta

    guardarParticipantes();
}

const fileInput = document.getElementById("fileInput");

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ruleta1");

    fetch("https://api.cloudinary.com/v1_1/dr8i88vt5/image/upload", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        const imgURL = data.secure_url;

        if (participanteSeleccionado !== null) {
            participantes[participanteSeleccionado].imagen = imgURL;
        }

        renderLista();
        dibujarRuleta();
        guardarParticipantes();
    })
    .catch(err => console.error("Error subiendo imagen:", err));
});

const importFile =
    document.getElementById("importFile");

importFile.addEventListener(
    "change",
    (e) => {

        const file =
            e.target.files[0];

        if (!file) return;

        const reader =
            new FileReader();

        reader.onload =
            function(event) {

                try {

                    participantes =
                        JSON.parse(
                            event.target.result
                        );

                    guardarParticipantes();
                    guardarEnFirebase();

                    renderLista();

                    dibujarRuleta();

                    alert(
                        "Ruleta cargada correctamente"
                    );

                } catch {

                    alert(
                        "Archivo inválido"
                    );

                }

            };

        reader.readAsText(file);

    }
);

function generarID() {
    return Math.random().toString(36).substring(2, 8);
}

document.getElementById("compartirRuleta")
.addEventListener("click", compartirConLink);

function compartirConLink() {

    const json =
        JSON.stringify(participantes);

    const encoded =
        LZString.compressToEncodedURIComponent(json);

    const url =
        window.location.origin +
        window.location.pathname +
        "?data=" + encoded;

    navigator.clipboard.writeText(url);

    alert("Link copiado ✔");
}

function guardarParticipantes() {
    guardarEnFirebase();
}

let historial = [];

function agregarAlHistorial(participante) {
    historial.push({
        nombre: participante.nombre,
        imagen: participante.imagen || null
    });
    guardarHistorialFirebase();
    renderHistorial();
}

function renderHistorial() {
    const lista = document.getElementById("listaHistorial");
    lista.innerHTML = "";
    historial.slice().reverse().forEach(item => {
        const div = document.createElement("div");
        div.className = "historial-item";
        if (item.imagen) {
            div.innerHTML = `<img src="${item.imagen}"><span>${item.nombre}</span>`;
        } else {
            div.innerHTML = `<div class="sin-imagen">👤</div><span>${item.nombre}</span>`;
        }
        lista.appendChild(div);
    });
}

function guardarHistorialFirebase() {
    db.collection("ruletas")
      .doc(userId)
      .set({ historial: historial }, { merge: true });
}

function cargarHistorialFirebase() {
    db.collection("ruletas")
      .doc(userId)
      .get()
      .then(doc => {
          if (doc.exists && doc.data().historial) {
              historial = doc.data().historial;
              renderHistorial();
          }
      });
}

document.getElementById("borrarHistorial")
.addEventListener("click", () => {
    if (!confirm("¿Borrar el historial?")) return;
    historial = [];
    guardarHistorialFirebase();
    renderHistorial();
});

cargarHistorialFirebase();

});