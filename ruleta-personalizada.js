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
    if (btnImagen) {
        participanteSeleccionado = Number(btnImagen.dataset.index);
        document.getElementById("fileInput").value = "";
        document.getElementById("fileInput").click();
        return;
    }

    const btnEditar = e.target.closest(".btnEditar");
    if (btnEditar) {
        indexEditando = Number(btnEditar.dataset.index);
        document.getElementById("popupEditar").classList.remove("oculto");
        return;
    }

});

function editarNombre(index) {
    const span = document.querySelector(`.nombre-texto[data-index="${index}"]`);
    if (!span) return;

    const valorActual = participantes[index].nombre;
    const input = document.createElement("input");
    input.type = "text";
    input.value = valorActual;
    input.className = "input-editar";
    input.maxLength = 20;

    span.replaceWith(input);
    input.focus();
    input.select();

    function guardarEdicion() {
        const nuevoNombre = input.value.trim();

        const nombreDuplicado = nuevoNombre !== "" &&
            nuevoNombre !== valorActual &&
            participantes.some(p => p.nombre === nuevoNombre);

        if (nombreDuplicado) {
            document.getElementById("mensajeError").textContent = "⚠️ Ya existe un participante con ese nombre.";
            document.getElementById("popupError").classList.remove("oculto");
            renderLista();
            return;
        }

        participantes[index].nombre = nuevoNombre;
        guardarEnFirebase();
        renderLista();
        dibujarRuleta();
    }

    input.addEventListener("blur", guardarEdicion);
    input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") input.blur();
    });
}

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
let indexEditando = null;
let animacionFondo = null;

function obtenerAnguloRenderizado(elemento) {
    const style = window.getComputedStyle(elemento);
    const matrix = style.transform;
    if (matrix === "none") return 0;
    const valores = matrix.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);
    const a = valores[0];
    const b = valores[1];
    let angulo = Math.atan2(b, a) * (180 / Math.PI);
    if (angulo < 0) angulo += 360;
    return angulo;
}

function obtenerAnguloFlecha() {
    const canvasRect = rueda.getBoundingClientRect();
    const flechaEl = document.querySelector('.flecha');
    const flechaRect = flechaEl.getBoundingClientRect();

    const cx = canvasRect.left + canvasRect.width / 2;
    const cy = canvasRect.top + canvasRect.height / 2;
    const fx = flechaRect.left + flechaRect.width / 2;
    const fy = flechaRect.top + flechaRect.height / 2;

    let angulo = Math.atan2(fy - cy, fx - cx) * (180 / Math.PI);
    if (angulo < 0) angulo += 360;
    return angulo;
}

function animarFondo() {
    if (rueda.classList.contains("girando")) return;
    anguloActual += 0.1;
    if(anguloActual >= 360) anguloActual -= 360;
    rueda.style.transition = "none";
    rueda.style.transform = `rotate(${anguloActual}deg)`;
    animacionFondo = requestAnimationFrame(animarFondo);
}

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

function dibujarCentroCirco(ctx) {
    const img = new Image();
    img.src = "Assets/logo-circo.png";
    img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(400, 400, 80, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 320, 320, 160, 160);
        ctx.restore();
    };
    img.src = "Assets/logo-circo.png?" + Date.now();
    
}

function dibujarBordeCirco(ctx) {
    const numLuces = 24;
    const radioLuces = 390;
    const coloresLuces = ["#ffd700", "#e74c3c", "#ffffff"];

    for (let i = 0; i < numLuces; i++) {
        const angulo = (2 * Math.PI / numLuces) * i;
        const x = 400 + radioLuces * Math.cos(angulo);
        const y = 400 + radioLuces * Math.sin(angulo);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = coloresLuces[i % coloresLuces.length];
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

function dibujarBordeCasino(ctx) {
    const numCasillas = 36;
    const radioExterior = 398;
    const radioInterior = 370;
    const coloresCasillas = ["#c0392b", "#111111"];

    for (let i = 0; i < numCasillas; i++) {
        const inicio = (2 * Math.PI / numCasillas) * i - Math.PI / 2;
        const fin = inicio + (2 * Math.PI / numCasillas);

        ctx.beginPath();
        ctx.moveTo(400 + radioInterior * Math.cos(inicio), 400 + radioInterior * Math.sin(inicio));
        ctx.arc(400, 400, radioExterior, inicio, fin);
        ctx.arc(400, 400, radioInterior, fin, inicio, true);
        ctx.closePath();
        ctx.fillStyle = coloresCasillas[i % 2];
        ctx.fill();
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Borde dorado exterior
    ctx.beginPath();
    ctx.arc(400, 400, radioExterior, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Borde dorado interior
    ctx.beginPath();
    ctx.arc(400, 400, radioInterior, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.stroke();
}

function dibujarBordeSafari(ctx) {
    const radioExterior = 398;
    const radioInterior = 365;
    const cx = 400, cy = 400;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radioExterior, 0, Math.PI * 2);
    ctx.arc(cx, cy, radioInterior, 0, Math.PI * 2, true);
    ctx.clip("evenodd");

    // Fondo blanco
    ctx.fillStyle = "#f5f5f0";
    ctx.beginPath();
    ctx.arc(cx, cy, radioExterior, 0, Math.PI * 2);
    ctx.fill();

    // Rayas negras diagonales de grosor variable
    ctx.fillStyle = "#1a1a1a";
    const anchoTotal = radioExterior * 2;
    let x = -anchoTotal;
    let toggle = false;
    while (x < anchoTotal * 2) {
        const grosor = 8 + Math.sin(x * 0.05) * 5 + Math.random() * 6;
        if (toggle) {
            ctx.beginPath();
            ctx.moveTo(cx + x, cy - anchoTotal);
            ctx.lineTo(cx + x + grosor, cy - anchoTotal);
            ctx.lineTo(cx + x + grosor - anchoTotal * 0.6, cy + anchoTotal);
            ctx.lineTo(cx + x - anchoTotal * 0.6, cy + anchoTotal);
            ctx.closePath();
            ctx.fill();
        }
        x += grosor + 8 + Math.random() * 8;
        toggle = !toggle;
    }

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, radioExterior, 0, Math.PI * 2);
    ctx.strokeStyle = "#8a6a30";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radioInterior, 0, Math.PI * 2);
    ctx.strokeStyle = "#8a6a30";
    ctx.lineWidth = 3;
    ctx.stroke();
}

function dibujarBordeRetro(ctx) {
    const cx = 400, cy = 400;
    const radioExterior = 398;
    const radioInterior = 365;
    const pixelSize = 8;
    const numPixeles = Math.floor((2 * Math.PI * radioExterior) / pixelSize);
    const colores = ["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#ffffff", "#0d2240"];

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radioExterior, 0, Math.PI * 2);
    ctx.arc(cx, cy, radioInterior, 0, Math.PI * 2, true);
    ctx.clip("evenodd");

    for (let i = 0; i < numPixeles; i++) {
        const angulo = (2 * Math.PI / numPixeles) * i;
        const r = (radioExterior + radioInterior) / 2;
        const x = cx + r * Math.cos(angulo);
        const y = cy + r * Math.sin(angulo);
        ctx.fillStyle = colores[i % colores.length];
        ctx.fillRect(x - pixelSize / 2, y - pixelSize / 2, pixelSize, pixelSize);
    }

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, radioExterior, 0, Math.PI * 2);
    ctx.strokeStyle = "#f8d030";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radioInterior, 0, Math.PI * 2);
    ctx.strokeStyle = "#f8d030";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function dibujarRuleta() {
    const total = participantes.length;

    if (total === 0) {
        ctx.clearRect(0, 0, 800, 800);
        return;
    }

    const angulo = (2 * Math.PI) / total;

    const promesas = participantes.map(p => {
        if (!p.imagen) return Promise.resolve(null);
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = p.imagen;
        });
    });

    const promesaCentro = new Promise(resolve => {
        const esCirco = document.body.classList.contains("tema-circo");
        const esCasino = document.body.classList.contains("tema-casino");
        const esSafari = document.body.classList.contains("tema-safari");
        const esRetro = document.body.classList.contains("tema-retro");
        if (esCirco) { resolve(null); return; }
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = esCasino ? "Assets/ruleta-casino.png" : esSafari ? "Assets/savanna-silueta.png" : "Assets/pokeball_centro.png";
    });

    Promise.all([...promesas, promesaCentro]).then(resultados => {
        const imagenes = resultados.slice(0, -1);
        const imgCentro = resultados[resultados.length - 1];

        ctx.clearRect(0, 0, 800, 800);

        participantes.forEach((participante, i) => {
            const inicio = i * angulo;
            const fin = inicio + angulo;

            ctx.beginPath();
            ctx.moveTo(400, 400);
            ctx.arc(400, 400, 380, inicio, fin);
            ctx.fillStyle = colores[i % colores.length];
            ctx.fill();

            ctx.save();
            ctx.translate(400, 400);
            ctx.rotate(inicio + angulo / 2);

            ctx.fillStyle = "white";
            ctx.textAlign = "right";
            if(participante?.nombre) {
                let fontSize = 24;
                if(participante.nombre.length > 8)  {
                    fontSize = Math.max(10, 24 -(participante.nombre.length - 8));
                }
                ctx.font = `${fontSize}px Arial`;
                ctx.fillText(participante.nombre, 290, 10);
            }
            if (imagenes[i]) {
                ctx.drawImage(imagenes[i], 310, -25, 50, 50);
            }

            ctx.restore();
        });

        const esCirco = document.body.classList.contains("tema-circo");
        const esCasino = document.body.classList.contains("tema-casino");
        const esSafari = document.body.classList.contains("tema-safari");
        const esRetro = document.body.classList.contains("tema-retro");

        if(esCirco) {
            dibujarCentroCirco(ctx);
        } else {
            ctx.save();
        ctx.beginPath();
        ctx.arc(400, 400, 80, 0, Math.PI * 2);
        ctx.clip();
        if(imgCentro) {
            ctx.drawImage(imgCentro, 320, 320, 160, 160);
        }else {
            ctx.fillStyle = "white";
            ctx.fill();
        }
        ctx.restore();
        }
        if (esCirco) dibujarBordeCirco(ctx);
        if (esCasino) dibujarBordeCasino(ctx);
        if (esSafari) dibujarBordeSafari(ctx);
        if (esRetro) dibujarBordeRetro(ctx);
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

        const imagenDuplicada = nombreArchivoNuevo && 
            participantes.some(p => p.nombreArchivo === nombreArchivoNuevo);

        if (imagenDuplicada) {
            document.getElementById("mensajeError").textContent = "⚠️ Esta imagen ya está añadida a la ruleta.";
            document.getElementById("popupError").classList.remove("oculto");
            imagenNuevoParticipante = null;
            document.getElementById("btnImagenNuevo").innerHTML = '<img src="Assets/SMEARGLE.png" style="width:20px; vertical-align:middle;"> Añadir imagen';
            return;
        }

        if (nombre === "" && !imagenNuevoParticipante) return;

        const nombreDuplicado = nombre !== "" && participantes.some(p => p.nombre === nombre);

        if (nombreDuplicado) {
            document.getElementById("mensajeError").textContent = "⚠️ Ya existe un participante con ese nombre.";
            document.getElementById("popupError").classList.remove("oculto");
            return;
         }
            participantes.push({
                nombre: nombre,
                imagen: imagenNuevoParticipante || null,
                nombreArchivo: nombreArchivoNuevo || null
            });
            imagenNuevoParticipante = null;
            nombreArchivoNuevo = null;
            document.getElementById("btnImagenNuevo").innerHTML = '<img src="Assets/SMEARGLE.png" style="width:20px; vertical-align:middle;"> Añadir imagen';

        guardarEnFirebase();
        inputNombre.value = "";
        renderLista();
        dibujarRuleta();
        guardarParticipantes();
    });
}

const rueda = document.getElementById("ruleta");

animarFondo();

document.getElementById("girar").addEventListener("click", () => {

     if (rueda.classList.contains("girando")) return;
     cancelAnimationFrame(animacionFondo);
     rueda.classList.add("girando");

     spinSound.pause();
     spinSound.currentTime = 0;
     spinSound.play().catch(() => {});

    const vueltas = 5 + Math.random()*5;
    const extra = Math.random()*360;

    const giro = vueltas*360 + extra;

    anguloActual += giro;

    rueda.style.transition = "transform 4.25s cubic-bezier(0.17, 0.67, 0.32, 0.94)";
    rueda.style.transform = `rotate(${anguloActual}deg)`;

    const onTransitionEnd = (e) => {

        if (e.propertyName !== "transform") return;

        rueda.removeEventListener("transitionend", onTransitionEnd);

        spinSound.pause();
        spinSound.currentTime = 0;

        anguloActual = anguloActual % 360;
        rueda.style.transition = "none";
        rueda.style.transform = `rotate(${anguloActual}deg)`;
        rueda.offsetHeight;
        const grados = obtenerAnguloRenderizado(rueda);
        const anguloFlecha = obtenerAnguloFlecha();

        setTimeout(() => {

            
            const gradosPorSector = 360 / participantes.length;
            const indice = Math.floor(
                (((anguloFlecha - grados) % 360 + 360) % 360) / gradosPorSector
                 ) % participantes.length;

            if(!participantes[indice]) return;

            document.getElementById("resultado").textContent =
                "Ganador: " + participantes[indice].nombre;
                 spinSound.pause();

                winSound.currentTime = 0;
                winSound.play();
                 mostrarPopupGanador(
                 participantes[indice]
                );
                 agregarAlHistorial(participantes[indice]);

            lanzarConfeti();

            rueda.classList.remove("girando");

        }, 500);

    };
    rueda.addEventListener("transitionend", onTransitionEnd);

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
    animarFondo();

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

if (btnExportar) {

    btnExportar.addEventListener("click", () => {
        document.getElementById("nombreArchivoExportar").value = "mi-ruleta";
        document.getElementById("popupExportar").classList.remove("oculto");
    });

}

document.getElementById("confirmarExportar").addEventListener("click", () => {

    const datos = JSON.stringify(participantes, null, 2);
    const blob = new Blob([datos], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;

    let nombreArchivo = document.getElementById("nombreArchivoExportar").value.trim();
    if (!nombreArchivo) nombreArchivo = "mi-ruleta";

    enlace.download = nombreArchivo + ".json";
    enlace.click();
    URL.revokeObjectURL(url);

    document.getElementById("popupExportar").classList.add("oculto");
});

document.getElementById("cancelarExportar").addEventListener("click", () => {
    document.getElementById("popupExportar").classList.add("oculto");
});

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
        document.getElementById("popupConfirmarRestaurar").classList.remove("oculto");
    });

}

document.getElementById("confirmarRestaurar").addEventListener("click", () => {
    participantes = structuredClone(participantesOriginales);
    guardarParticipantes();
    renderLista();
    dibujarRuleta();
    document.getElementById("popupConfirmarRestaurar").classList.add("oculto");
});

document.getElementById("cancelarRestaurar").addEventListener("click", () => {
    document.getElementById("popupConfirmarRestaurar").classList.add("oculto");
});

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
            
            <input type="checkbox" class="chk" value="${participante.nombre}">
            <span class="nombre-texto ${participante.nombre ? '' : 'vacio'}" data-index="${index}">${participante.nombre}</span>
            

            <button class="btnImagen ${participante.imagen ? '' : 'vacio'}" data-index="${index}">
            ${participante.imagen ? `<img src="${participante.imagen}" style="width:28px; height:28px; object-fit:cover; border-radius:4px;">` : ''}
            </button>

            <button class="btnEditar" data-index="${index}">✏️</button>
        `;

        cont.appendChild(div);
    });
}

function eliminarSeleccionados() {

    const checks = document.querySelectorAll(".chk");

    const nombresAEliminar = [];

    checks.forEach(chk => {
        if (chk.checked) {
            nombresAEliminar.push(chk.value);
        }
    });

    if (nombresAEliminar.length === 0) {
        document.getElementById("mensajeError").textContent = "⚠️ No has seleccionado nada.";
        document.getElementById("popupError").classList.remove("oculto");
        return;
    }

    document.getElementById("popupConfirmarEliminar").classList.remove("oculto");

    document.getElementById("confirmarEliminar").onclick = () => {

        nombresAEliminar.forEach(nombre => {
            const index = participantes.findIndex(
                p => p.nombre === nombre
            );
            if (index !== -1) {
                participantes.splice(index, 1);
            }
        });

        guardarEnFirebase();
        renderLista();
        dibujarRuleta();
        guardarParticipantes();

        document.getElementById("popupConfirmarEliminar").classList.add("oculto");
    };

    document.getElementById("cancelarEliminar").onclick = () => {
        document.getElementById("popupConfirmarEliminar").classList.add("oculto");
    };
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
            participantes[participanteSeleccionado].nombreArchivo = file.name;
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

                    document.getElementById("mensajeError").textContent = "✅ Ruleta cargada correctamente";
                    document.getElementById("popupError").classList.remove("oculto");

                } catch {

                    document.getElementById("mensajeError").textContent = "⚠️ Archivo inválido";
                    document.getElementById("popupError").classList.remove("oculto");

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

    document.getElementById("popupCompartir").classList.remove("oculto");
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
        div.style.cursor = "pointer";
        if (item.imagen && item.nombre) {
            div.innerHTML = `<img src="${item.imagen}"><span>${item.nombre}</span>`;
        } else if (item.imagen && !item.nombre) {
            div.innerHTML = `<img src="${item.imagen}" style="margin: 0 auto;">`;
            div.style.justifyContent = "center";
        }else {
            div.innerHTML = `<span>${item.nombre}</span>`;
            div.style.justifyContent = "center";
        }
        div.addEventListener("click", () => {
            const popup = document.getElementById("popupHistorial");
            const img = document.getElementById("imagenHistorial");
            const nombre = document.getElementById("nombreHistorial");

            nombre.textContent = item.nombre;

            if (item.imagen) {
                img.src = item.imagen;
                img.style.display = "block";
            } else {
                img.style.display = "none";
            }

            popup.classList.remove("oculto");
        });
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
    if (historial.length === 0) {
        document.getElementById("mensajeError").textContent = "⚠️ El historial ya está vacío.";
        document.getElementById("popupError").classList.remove("oculto");
        return;
    }
    document.getElementById("popupConfirmarHistorial").classList.remove("oculto");
});

document.getElementById("confirmarBorrarHistorial").addEventListener("click", () => {
    historial = [];
    guardarHistorialFirebase();
    renderHistorial();
    document.getElementById("popupConfirmarHistorial").classList.add("oculto");
});

document.getElementById("cancelarBorrarHistorial").addEventListener("click", () => {
    document.getElementById("popupConfirmarHistorial").classList.add("oculto");
});

let volumenAnterior = 1;
let muteado = false;

document.getElementById("iconoVolumen").addEventListener("click", () => {
    if (!muteado) {
        volumenAnterior = parseFloat(document.getElementById("volumen").value);
        spinSound.volume = 0;
        winSound.volume = 0;
        document.getElementById("volumen").value = 0;
        document.getElementById("iconoVolumen").textContent = document.body.classList.contains("tema-circo") ? "🔕" : document.body.classList.contains("tema-casino") ? "🃏" :document.body.classList.contains("tema-safari") ? "🤫" : "🔇";
        muteado = true;
    } else {
        spinSound.volume = volumenAnterior;
        winSound.volume = volumenAnterior;
        document.getElementById("volumen").value = volumenAnterior;
        document.getElementById("iconoVolumen").textContent = document.body.classList.contains("tema-circo") ? "🎺" : document.body.classList.contains("tema-casino") ? "🎰" : document.body.classList.contains("tema-safari") ? "🦁" : "🔊";
        muteado = false;
    }
});

document.getElementById("volumen").addEventListener("input", (e) => {
    const vol = parseFloat(e.target.value);
    console.log("Volumen:", vol);
    spinSound.volume = vol;
    winSound.volume = vol;
    if (vol === 0) {
        document.getElementById("iconoVolumen").textContent = document.body.classList.contains("tema-circo") ? "🔕" : document.body.classList.contains("tema-casino") ? "🃏" : document.body.classList.contains("tema-safari") ? "🤫" : "🔇";
        muteado = true;
    } else {
        document.getElementById("iconoVolumen").textContent = document.body.classList.contains("tema-circo") ? "🎺" : document.body.classList.contains("tema-casino") ? "🎰" : document.body.classList.contains("tema-safari") ? "🦁" : "🔊";
        muteado = false;
    }
});

document.getElementById("cerrarPopupHistorial")
.addEventListener("click", () => {
    document.getElementById("popupHistorial").classList.add("oculto");
});


document.getElementById("btnImagenNuevo").addEventListener("click", () => {
    document.getElementById("fileInputNuevo").value = "";
    document.getElementById("fileInputNuevo").click();
});

let imagenNuevoParticipante = null;
let nombreArchivoNuevo = null;

document.getElementById("fileInputNuevo").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    nombreArchivoNuevo = file.name;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ruleta1");

    fetch("https://api.cloudinary.com/v1_1/dr8i88vt5/image/upload", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        imagenNuevoParticipante = data.secure_url;
        document.getElementById("btnImagenNuevo").innerHTML = '<img src="Assets/SMEARGLE.png" style="width:20px; vertical-align:middle;"> Imagen lista ✅';
    })
    .catch(err => console.error("Error subiendo imagen:", err));
});

document.getElementById("cerrarPopupError").addEventListener("click", () => {
    document.getElementById("popupError").classList.add("oculto");
});

document.getElementById("togglePanel").addEventListener("click", () => {
    const panel = document.getElementById("panelLateral");
    const btn = document.getElementById("togglePanel");
    const btnTemas = document.getElementById("btnTemas");
    panel.classList.toggle("oculto-panel");
    if (panel.classList.contains("oculto-panel")) {
        btn.style.right = "0px";
        btnTemas.style.display = "block";
    } else {
        btn.style.right = "470px";
        btnTemas.style.display = "none";
        // Forzar resize del canvas
        const cv = document.getElementById("globosCanvas");
        if (cv) {
            cv.width = panel.offsetWidth;
            cv.height = panel.offsetHeight;
        }
    }
});

document.getElementById("imagenGanador").addEventListener("click", () => {
    const src = document.getElementById("imagenGanador").src;
    if (!src) return;
    document.getElementById("imagenGrande").src = src;
    document.getElementById("popupImagenGrande").classList.remove("oculto");
});

document.getElementById("imagenHistorial").addEventListener("click", () => {
    const src = document.getElementById("imagenHistorial").src;
    if (!src) return;
    document.getElementById("imagenGrande").src = src;
    document.getElementById("popupImagenGrande").classList.remove("oculto");
});

document.getElementById("cerrarImagenGrande").addEventListener("click", () => {
    document.getElementById("popupImagenGrande").classList.add("oculto");
});

document.getElementById("editarTextoBtn").addEventListener("click", () => {
    document.getElementById("popupEditar").classList.add("oculto");
    editarNombre(indexEditando);
});

document.getElementById("editarImagenBtn").addEventListener("click", () => {
    document.getElementById("popupEditar").classList.add("oculto");
    participanteSeleccionado = indexEditando;
    document.getElementById("fileInput").value = "";
    document.getElementById("fileInput").click();
});

document.getElementById("cancelarEditar").addEventListener("click", () => {
    document.getElementById("popupEditar").classList.add("oculto");
});

document.getElementById("toggleHistorial").addEventListener("click", () => {
    if (historial.length === 0) return;
    const lista = document.getElementById("listaHistorial");
    const btn = document.getElementById("toggleHistorial");
    lista.classList.toggle("colapsado");
    btn.textContent = lista.classList.contains("colapsado") ? "▶" : "▼";
});

document.getElementById("cerrarPopupCompartir").addEventListener("click", () => {
    document.getElementById("popupCompartir").classList.add("oculto");
});

const temasCarga = {
    retro:   { icono: "⚡", texto: "Cargando Pokémon..." },
    circo:   { icono: "🎪", texto: "¡El circo llega!" },
    casino:  { icono: "🎰", texto: "Apostando todo..." },
    safari:  { icono: "🦁", texto: "Adentrándose en la sabana..." },
    piratas: { icono: "🏴‍☠️", texto: "Zarpando..." },
    halloween: { icono: "🎃", texto: "Invocando el terror..." }
};

function mostrarCarga(tema) {
    const info = temasCarga[tema] || { icono: "🎡", texto: "Cargando..." };
    document.getElementById("cargaIcono").textContent = info.icono;
    document.getElementById("cargaTexto").textContent = info.texto;
    document.getElementById("cargaProgreso").style.width = "0%";
    document.getElementById("pantallaCarga").classList.remove("oculto");
    setTimeout(() => document.getElementById("cargaProgreso").style.width = "90%", 50);
    setTimeout(() => document.getElementById("cargaProgreso").style.width = "100%", 2500);
}

function ocultarCarga() {
    document.getElementById("cargaProgreso").style.width = "100%";
    setTimeout(() => {
        document.getElementById("pantallaCarga").classList.add("oculto");
    }, 3000);
}


function aplicarTema(tema) {
    mostrarCarga(tema);
    document.body.className = "tema-" + tema;
    localStorage.setItem("ultimoTema", tema);
    const bgColors = {
    retro: "#111",
    circo: "#2b0a0a",
    casino: "#0b3d1a",
    safari: "#2e2412",
    piratas: "#0d1b2a",
    halloween: "#1a0a2e"
    };
    localStorage.setItem("ultimoBg", bgColors[tema] || "#111");

    const existente = document.getElementById("temaCSS");
    if (existente) existente.remove();

    // Ocultar ruleta durante carga
    const ruedaEl = document.getElementById("ruleta");
    ruedaEl.style.opacity = "0";
    ruedaEl.style.transition = "none";
    ctx.clearRect(0, 0, 800, 800);

    const oldCanvas = document.getElementById("globosCanvas");
    if (oldCanvas) { 
        cancelAnimationFrame(oldCanvas._raf);
        oldCanvas.remove(); 
        document.getElementById("svgTitulo").style.display = "none";
    }

    const oldFondo = document.getElementById("fondoCasinoCanvas");
    if (oldFondo) { cancelAnimationFrame(oldFondo._raf); oldFondo.remove(); }

    const oldFondoSafari = document.getElementById("fondoSafariCanvas");
    if (oldFondoSafari) { cancelAnimationFrame(oldFondoSafari._raf); oldFondoSafari.remove(); }

    document.getElementById("iconoVolumen").textContent = "🔊";
    document.getElementById("tituloTexto").textContent = "Ruleta Mega-loca";

    const mostrarRuleta = () => {
        dibujarRuleta();
        ocultarCarga();
        setTimeout(() => {
        ruedaEl.style.transition = "opacity 0.3s";
        ruedaEl.style.opacity = "1";
        }, 100);
    };

    if (tema !== "retro") {
        const link = document.createElement("link");
        link.id = "temaCSS";
        link.rel = "stylesheet";
        link.href = "Temas/tema-" + tema + ".css";
        link.onload = () => mostrarRuleta();
        document.head.appendChild(link);
    }

    if (tema === "circo") { 
        iniciarGlobos();
        document.getElementById("iconoVolumen").textContent = "🎺";
        document.getElementById("svgTitulo").style.display = "block";
        document.getElementById("tituloTexto").style.display = "none";
    } else if (tema === "casino") {
        iniciarFichas();
        document.getElementById("iconoVolumen").textContent = "🎰";
        document.getElementById("svgTitulo").style.display = "none";
        document.getElementById("tituloTexto").style.display = "";
        iniciarFondoCasino();
        const titulo = document.getElementById("tituloTexto");
        const texto = titulo.textContent;
        titulo.innerHTML = texto.split("").map((l, i) =>
            l === " " ? " " : `<span class="letra-ola" style="animation-delay:${i * 0.08}s">${l}</span>`
        ).join("");
    } else if (tema === "safari") {
        iniciarSafari();
        document.getElementById("iconoVolumen").textContent = "🦁";
        document.getElementById("svgTitulo").style.display = "none";
        document.getElementById("tituloTexto").style.display = "";
        iniciarFondoSafari();
    } else {
        document.getElementById("svgTitulo").style.display = "none";
        document.getElementById("tituloTexto").style.display = "";
        mostrarRuleta();
    }
}

function iniciarGlobos() {
    const panel = document.getElementById("panelLateral");
    const cv = document.createElement("canvas");
    cv.id = "globosCanvas";
    panel.insertBefore(cv, panel.firstChild);

    const ctx2 = cv.getContext("2d");
    const colores = ["#e74c3c","#e67e22","#f1c40f","#2ecc71","#3498db","#9b59b6","#ff69b4","#1abc9c"];
    let globos = [];

    function resize() { 
        const w = panel.offsetWidth;
        const h = panel.offsetHeight;
        if (w > 0 && h > 0) { cv.width = w; cv.height = h; }
     }
    resize();
    new ResizeObserver(resize).observe(panel);

    function crearGlobo() {
        return {
            x: Math.random() * cv.width,
            y: cv.height + 60,
            r: 18 + Math.random() * 16,
            color: colores[Math.floor(Math.random() * colores.length)],
            speed: 0.4 + Math.random() * 0.5,
            drift: (Math.random() - 0.5) * 0.4,
            swing: Math.random() * Math.PI * 2,
            swingSpeed: 0.01 + Math.random() * 0.01
        };
    }

    for (let i = 0; i < 12; i++) { const g = crearGlobo(); g.y = Math.random() * cv.height; globos.push(g); }

    function dibujarGlobo(g) {
        const x = g.x + Math.sin(g.swing) * 8;
        ctx2.beginPath();
        ctx2.ellipse(x, g.y, g.r * 0.85, g.r, 0, 0, Math.PI * 2);
        ctx2.fillStyle = g.color;
        ctx2.fill();
        ctx2.beginPath();
        ctx2.ellipse(x - g.r * 0.25, g.y - g.r * 0.3, g.r * 0.2, g.r * 0.25, -0.5, 0, Math.PI * 2);
        ctx2.fillStyle = "rgba(255,255,255,0.35)";
        ctx2.fill();
        ctx2.beginPath();
        ctx2.moveTo(x, g.y + g.r);
        ctx2.lineTo(x - 3, g.y + g.r + 6);
        ctx2.lineTo(x + 3, g.y + g.r + 6);
        ctx2.closePath();
        ctx2.fillStyle = g.color;
        ctx2.fill();
        ctx2.beginPath();
        ctx2.moveTo(x, g.y + g.r + 6);
        ctx2.quadraticCurveTo(x + 10, g.y + g.r + 30, x + Math.sin(g.swing) * 5, g.y + g.r + 55);
        ctx2.strokeStyle = "rgba(255,255,255,0.5)";
        ctx2.lineWidth = 1;
        ctx2.stroke();
    }

    function loop() {
        ctx2.clearRect(0, 0, cv.width, cv.height);
        globos.forEach(g => { g.y -= g.speed; g.x += g.drift; g.swing += g.swingSpeed; dibujarGlobo(g); });
        globos = globos.filter(g => g.y > -80);
        while (globos.length < 12) globos.push(crearGlobo());
        cv._raf = requestAnimationFrame(loop);
    }
    cv._raf = requestAnimationFrame(loop);

    let offset = 0;
    function animarTitulo() {
        offset = (offset + 0.3) % 40;
         const p = document.getElementById("rayasCirco");
         if (p) p.setAttribute("patternTransform", `rotate(45) translate(${offset}, 0)`);
         requestAnimationFrame(animarTitulo);
    }
    animarTitulo();

}

function iniciarFichas() {
    const panel = document.getElementById("panelLateral");
    const cv = document.createElement("canvas");
    cv.id = "globosCanvas";
    cv.style.position = "absolute";
    cv.style.top = "0";
    cv.style.left = "0";
    cv.style.width = "100%";
    cv.style.height = "100%";
    cv.style.pointerEvents = "none";
    cv.style.zIndex = "0";
    panel.insertBefore(cv, panel.firstChild);

    const ctx2 = cv.getContext("2d");
    const coloresFichas = ["#c0392b","#2980b9","#111111","#1a5c2a","#f5f5f5"];
    let fichas = [];

    function resize() {
        const w = panel.offsetWidth;
        const h = panel.offsetHeight;
        if (w > 0 && h > 0) { cv.width = w; cv.height = h; }
    }
    resize();
    new ResizeObserver(resize).observe(panel);

    function crearFicha() {
        return {
            x: Math.random() * cv.width,
            y: -30,
            r: 14 + Math.random() * 10,
            color: coloresFichas[Math.floor(Math.random() * coloresFichas.length)],
            speed: 0.5 + Math.random() * 0.6,
            drift: (Math.random() - 0.5) * 0.3,
            rotacion: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.03
        };
    }

    for (let i = 0; i < 12; i++) {
        const f = crearFicha();
        f.y = Math.random() * cv.height;
        fichas.push(f);
    }

    function dibujarFicha(f) {
        ctx2.save();
        ctx2.translate(f.x, f.y);
        ctx2.rotate(f.rotacion);

        // Cuerpo
        ctx2.beginPath();
        ctx2.arc(0, 0, f.r, 0, Math.PI * 2);
        ctx2.fillStyle = f.color;
        ctx2.fill();
        ctx2.strokeStyle = "#ffd700";
        ctx2.lineWidth = 2;
        ctx2.stroke();

        // Borde interior
        ctx2.beginPath();
        ctx2.arc(0, 0, f.r * 0.75, 0, Math.PI * 2);
        ctx2.strokeStyle = "#ffd700";
        ctx2.lineWidth = 1.5;
        ctx2.stroke();

        // Rayas decorativas
        for (let i = 0; i < 4; i++) {
            const a = (Math.PI / 4) * i;
            ctx2.beginPath();
            ctx2.moveTo(Math.cos(a) * f.r * 0.75, Math.sin(a) * f.r * 0.75);
            ctx2.lineTo(Math.cos(a) * f.r, Math.sin(a) * f.r);
            ctx2.strokeStyle = "#ffd700";
            ctx2.lineWidth = 2;
            ctx2.stroke();
        }

        ctx2.restore();
    }

    function loop() {
        ctx2.clearRect(0, 0, cv.width, cv.height);
        fichas.forEach(f => {
            f.y += f.speed;
            f.x += f.drift;
            f.rotacion += f.rotSpeed;
            dibujarFicha(f);
        });
        fichas = fichas.filter(f => f.y < cv.height + 50);
        while (fichas.length < 12) fichas.push(crearFicha());
        cv._raf = requestAnimationFrame(loop);
    }
    cv._raf = requestAnimationFrame(loop);
}

function iniciarFondoCasino() {
    const cv = document.createElement("canvas");
    cv.id = "fondoCasinoCanvas";
    cv.style.position = "fixed";
    cv.style.top = "0";
    cv.style.left = "0";
    cv.style.width = "100%";
    cv.style.height = "100%";
    cv.style.pointerEvents = "none";
    cv.style.zIndex = "-1";
    document.body.appendChild(cv);

    function resize() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
    resize();
    window.addEventListener("resize", resize);

    const ctx3 = cv.getContext("2d");
    const destellos = Array.from({length: 40}, () => ({
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        r: 1 + Math.random() * 2,
        alpha: Math.random(),
        speed: 0.005 + Math.random() * 0.01,
        dir: Math.random() > 0.5 ? 1 : -1
    }));

    function loop() {
        ctx3.clearRect(0, 0, cv.width, cv.height);
        destellos.forEach(d => {
            d.alpha += d.speed * d.dir;
            if (d.alpha >= 1 || d.alpha <= 0) {
                d.dir *= -1;
                if (d.alpha <= 0) {
                    d.x = Math.random() * cv.width;
                    d.y = Math.random() * cv.height;
                }
            }
            ctx3.beginPath();
            ctx3.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx3.fillStyle = `rgba(255, 215, 0, ${d.alpha})`;
            ctx3.fill();

            // Destello en cruz
            ctx3.strokeStyle = `rgba(255, 215, 0, ${d.alpha * 0.5})`;
            ctx3.lineWidth = 0.5;
            ctx3.beginPath();
            ctx3.moveTo(d.x - d.r * 3, d.y);
            ctx3.lineTo(d.x + d.r * 3, d.y);
            ctx3.moveTo(d.x, d.y - d.r * 3);
            ctx3.lineTo(d.x, d.y + d.r * 3);
            ctx3.stroke();
        });
        cv._raf = requestAnimationFrame(loop);
    }
    cv._raf = requestAnimationFrame(loop);
}

function iniciarSafari() {
    const panel = document.getElementById("panelLateral");
    const cv = document.createElement("canvas");
    cv.id = "globosCanvas";
    cv.style.position = "absolute";
    cv.style.top = "0";
    cv.style.left = "0";
    cv.style.width = "100%";
    cv.style.height = "100%";
    cv.style.pointerEvents = "none";
    cv.style.zIndex = "0";
    panel.insertBefore(cv, panel.firstChild);
    const ctx2 = cv.getContext("2d");

    function resize() {
        const w = panel.offsetWidth;
        const h = panel.offsetHeight;
        if (w > 0 && h > 0) { cv.width = w; cv.height = h; }
    }
    resize();
    new ResizeObserver(resize).observe(panel);

    const imgs = {};
    const tiposAnimales = ["guepa", "elefante", "rino", "aves", "leo", "jirafa"];
    tiposAnimales.forEach(nombre => {
        const img = new Image();
        img.onload = () => { imgs[nombre] = img; };
        img.src = `Assets/${nombre}.png`;
    });

    function crearAnimal() {
        const tipo = tiposAnimales[Math.floor(Math.random() * tiposAnimales.length)];
        return {
            x: -150,
            y: cv.height * (0.55 + Math.random() * 0.3),
            speed: 0.6 + Math.random() * 1,
            tipo,
            escala: 0.5 + Math.random() * 0.5
        };
    }

    let animalesActivos = [];
    for (let i = 0; i < 4; i++) {
        const a = crearAnimal();
        a.x = Math.random() * cv.width;
        animalesActivos.push(a);
    }

    function dibujarSuelo() {
        const grad = ctx2.createLinearGradient(0, 0, 0, cv.height * 0.6);
        grad.addColorStop(0, "#e8a44a");
        grad.addColorStop(1, "#f2c97a");
        ctx2.fillStyle = grad;
        ctx2.fillRect(0, 0, cv.width, cv.height * 0.6);
        ctx2.fillStyle = "#8B6914";
        ctx2.fillRect(0, cv.height * 0.6, cv.width, cv.height * 0.4);
        ctx2.fillStyle = "#6B8E23";
        ctx2.fillRect(0, cv.height * 0.58, cv.width, cv.height * 0.06);
    }

    function loop() {
        ctx2.clearRect(0, 0, cv.width, cv.height);
        dibujarSuelo();
        animalesActivos.forEach(a => {
            a.x += a.speed;
            if (imgs[a.tipo]) {
                const img = imgs[a.tipo];
                const h = 80 * a.escala;
                const w = (img.width / img.height) * h;
                ctx2.drawImage(img, a.x, a.y - h, w, h);
            }
        });
        animalesActivos = animalesActivos.filter(a => a.x < cv.width + 150);
        while (animalesActivos.length < 5) animalesActivos.push(crearAnimal());
        cv._raf = requestAnimationFrame(loop);
    }
    cv._raf = requestAnimationFrame(loop);
}

function iniciarFondoSafari() {
    const cv = document.createElement("canvas");
    cv.id = "fondoSafariCanvas";
    cv.style.position = "fixed";
    cv.style.top = "0";
    cv.style.left = "0";
    cv.style.width = "100%";
    cv.style.height = "100%";
    cv.style.pointerEvents = "none";
    cv.style.zIndex = "-1";
    document.body.appendChild(cv);

    function resize() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
    resize();
    window.addEventListener("resize", resize);

    const ctx3 = cv.getContext("2d");
    let t = 0;

    const imgArbol = new Image();
    imgArbol.src = "Assets/arbol-savanna.png";

    const arboles = Array.from({length: 8}, (_, i) => ({
        x: (cv.width / 8) * i + Math.random() * 80,
        h: 120 + Math.random() * 80,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: 0.005 + Math.random() * 0.005,
    }));

    function dibujarArbol(a) {
        if (!imgArbol.complete || !imgArbol.naturalWidth) return;
        const swingOffset = Math.sin(a.swing) * 4;
        const w = (imgArbol.width / imgArbol.height) * a.h;
        ctx3.save();
        ctx3.translate(a.x + swingOffset, cv.height * 0.72);
        ctx3.drawImage(imgArbol, -w / 2, -a.h, w, a.h);
        ctx3.restore();
    }

    function loop() {
        t += 0.003;
        ctx3.clearRect(0, 0, cv.width, cv.height);

        const phase = (Math.sin(t) + 1) / 2;
        const sky = ctx3.createLinearGradient(0, 0, 0, cv.height * 0.72);

        const r1 = Math.round(180 + phase * 50);
        const g1 = Math.round(60 + phase * 80);
        const b1 = Math.round(20 + phase * 10);
        const r2 = Math.round(80 - phase * 40);
        const g2 = Math.round(20 - phase * 10);
        const b2 = Math.round(60 + phase * 20);

        sky.addColorStop(0, `rgb(${r2},${g2},${b2})`);
        sky.addColorStop(0.5, `rgb(${r1},${g1},${b1})`);
        sky.addColorStop(1, `rgb(${Math.round(220 + phase*30)},${Math.round(120 + phase*40)},${Math.round(40)})`);
        ctx3.fillStyle = sky;
        ctx3.fillRect(0, 0, cv.width, cv.height * 0.72);

        const solX = cv.width * 0.7;
        const solY = cv.height * (0.3 + Math.sin(t * 0.5) * 0.08);
        const gradSol = ctx3.createRadialGradient(solX, solY, 0, solX, solY, 40);
        gradSol.addColorStop(0, `rgba(255,220,80,${0.6 + phase * 0.3})`);
        gradSol.addColorStop(1, "rgba(255,120,0,0)");
        ctx3.fillStyle = gradSol;
        ctx3.beginPath();
        ctx3.arc(solX, solY, 40, 0, Math.PI * 2);
        ctx3.fill();

        ctx3.fillStyle = "#5a3a10";
        ctx3.fillRect(0, cv.height * 0.72, cv.width, cv.height * 0.28);
        ctx3.fillStyle = "#7a5a18";
        ctx3.fillRect(0, cv.height * 0.70, cv.width, cv.height * 0.05);

        arboles.forEach(a => {
            a.swing += a.swingSpeed;
            dibujarArbol(a);
        });

        cv._raf = requestAnimationFrame(loop);
    }
    cv._raf = requestAnimationFrame(loop);
}

document.getElementById("btnTemas").addEventListener("click", () => {
    document.getElementById("popupTemas").classList.remove("oculto");
});

document.getElementById("cerrarPopupTemas").addEventListener("click", () => {
    document.getElementById("popupTemas").classList.add("oculto");
});

document.querySelectorAll("#popupTemas [data-tema]").forEach(btn => {
    btn.addEventListener("click", () => {
        const tema = btn.dataset.tema;
        aplicarTema(tema);
        db.collection("ruletas").doc(userId).set({ tema: tema }, { merge: true });
        document.getElementById("popupTemas").classList.add("oculto");
    });
});

function cargarTema() {
    const temaLocal = localStorage.getItem("ultimoTema") || "retro";
    mostrarCarga(temaLocal);
    db.collection("ruletas").doc(userId).get().then(doc => {
        if (doc.exists && doc.data().tema) {
            aplicarTema(doc.data().tema);
        } else {
            aplicarTema("retro");
        }
    });
}

cargarTema();

cargarHistorialFirebase();

});