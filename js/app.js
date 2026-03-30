/**
 * Archivo principal de la aplicación SkyBalance AVL
 * Coordina la lógica entre árboles AVL, BST y el renderizador
 * Maneja eventos de usuario, carga de archivos JSON y modos de operación
 */
import Stack from "./stack.js";
import AVL from "./avl.js";
import Renderer from "./renderer.js";
import { readJSONFile } from "./fileHandler.js";
import BST from "./bst.js";
import Queue from "./queue.js";
import {
    getHeight,
    countNodes,
    countLeaves,
    BFS,
    DFS_InOrder,
    DFS_PreOrder,
    DFS_PostOrder,
    countRotations,
    findCriticalNodes,
    auditAVL,
    getMaxProfit,
    getMinProfit,
    getAverageProfit,
    getTopN,
    getTotalProfit,
} from "./metrics.js";

// Instancias globales de las estructuras de datos y renderizador
let maxDepthAllowed = 3;
const avl = new AVL();
const bst = new BST();
const historyStack = new Stack();
const insertionQueue = new Queue();
const renderer = new Renderer("treeCanvas");
// Sistema de versiones guardadas
let versions = [];
let list = "Versiones disponibles:\n";
versions.forEach((v, i) => {
    list += (i + 1) + ". " + v.name + "\n";
});

const index = parseInt(prompt(list));


/**
 * Función auxiliar para convertir códigos de vuelo a números enteros
 * @param {string|number} codigo - Código del vuelo (puede ser string o number)
 * @returns {number} Código convertido a entero
 */
function parseCodigo(codigo) {
    if (typeof codigo === "number") return codigo;

    return parseInt(codigo.replace(/\D/g, ""));
}

// Evento para insertar un vuelo aleatorio en ambos árboles
document.getElementById("insertBtn").addEventListener("click", () => {
    saveState(); //GUARDAR ESTADO ANTES
    const codigo = Math.floor(Math.random() * 1000);

    const data = {
        codigo: codigo,
        origen: "Test",
        destino: "Test",
        precioBase: 100,
        pasajeros: 50,
        codigoNumerico: codigo
    };
    avl.insertValue(data);
    bst.insertValue(data);

    updateDepth(avl.root);
    updateDepth(bst.root);
    applyDepthPenalty(avl.root);
    applyDepthPenalty(bst.root);
    

    console.log("Insertado:", data.codigo);
    console.log("Rotaciones:", avl.rotations);
    console.log("BST root:", bst.root);

    renderer.animate(avl.root, bst.root);
    updateMetrics(); // 👈 DIBUJAR
});

// Carga automática de archivo JSON al seleccionar
readJSONFile((json) => {
    console.log("JSON cargado:", json);

    if (json.tipo === "INSERCION") {
        handleInsertionMode(json);
    } else {
        handleTopologyMode(json);
    }
});

/**
 * Maneja el modo de inserción: inserta vuelos desde JSON en ambos árboles
 * @param {Object} json - Objeto JSON con tipo "INSERCION" y array de vuelos
 */
function handleInsertionMode(json) {
    console.log("Modo INSERCIÓN");

    avl.root = null;
    bst.root = null;

    json.vuelos.forEach(vuelo => {
        const data = {
            ...vuelo,
            codigoNumerico: parseCodigo(vuelo.codigo)
        };

        avl.insertValue(data);
        bst.insertValue(data); // 👈 FALTABA ESTO
    });

    renderer.animate(avl.root, bst.root);
    updateMetrics();
}

/**
 * Construye un árbol AVL desde una estructura JSON de topología
 * @param {Object} nodeData - Nodo raíz con estructura anidada
 * @returns {Object|null} Nodo construido o null
 */
function buildTreeFromJSON(nodeData) {
    if (!nodeData) return null;

    return {
        data: {
            codigo: nodeData.codigo,
            origen: nodeData.origen,
            destino: nodeData.destino,
            precioBase: nodeData.precioBase,
            pasajeros: nodeData.pasajeros
        },
        height: nodeData.altura,
        factor: nodeData.factorEquilibrio,
        left: buildTreeFromJSON(nodeData.izquierdo),
        right: buildTreeFromJSON(nodeData.derecho),
        critico: false
    };
}

/**
 * Maneja el modo de topología: construye árbol desde estructura JSON
 * @param {Object} json - Objeto JSON con estructura de árbol
 */
function handleTopologyMode(json) {
    console.log("Modo TOPOLOGÍA");

    avl.root = buildTreeFromJSON(json);
    bst.root = null;

    insertBSTFromAVL(avl.root);

    renderer.animate(avl.root, bst.root);
    updateMetrics();
}

/**
 * Actualiza el panel de métricas con alturas y estado de balance
 */
function updateMetrics() {
    const totalProfit = getTotalProfit(avl.root);
    const div = document.getElementById("metricsPanel");
    const avlRoot = avl.root ? avl.root.data.codigo : "N/A";
    const bstRoot = bst.root ? bst.root.data.codigo : "N/A";

    const avlHeight = getHeight(avl.root);
    const bstHeight = getHeight(bst.root);

    const avlDepth = avlHeight - 1;
    const bstDepth = bstHeight - 1;

    const avlNodes = countNodes(avl.root);
    const bstNodes = countNodes(bst.root);

    const avlLeaves = countLeaves(avl.root);
    const bstLeaves = countLeaves(bst.root);

    const bfsAVL = BFS(avl.root).join(", ");
    const inAVL = DFS_InOrder(avl.root).join(", ");
    const preAVL = DFS_PreOrder(avl.root).join(", ");
    const postAVL = DFS_PostOrder(avl.root).join(", ");

    const rot = countRotations(avl);
    const critical = findCriticalNodes(avl.root).join(", ");

    // ===== RENTABILIDAD =====
    const max = getMaxProfit(avl.root);
    const min = getMinProfit(avl.root);
    const avg = getAverageProfit(avl.root);
    const top = getTopN(avl.root, 5);

    // ===== AUDITORIA AVL =====
    const issues = auditAVL(avl.root);
    const isAVL = issues.length === 0;

    div.innerHTML = `
        <h3>MÉTRICAS GENERALES</h3>

        <p><strong>Altura AVL:</strong> ${avlHeight}</p>
        <p><strong>Altura BST:</strong> ${bstHeight}</p>
        <p><strong>Diferencia Altura:</strong> ${bstHeight - avlHeight}</p>

        <p><strong>Nodos AVL:</strong> ${avlNodes}</p>
        <p><strong>Nodos BST:</strong> ${bstNodes}</p>

        <p><strong>Hojas AVL:</strong> ${avlLeaves}</p>
        <p><strong>Hojas BST:</strong> ${bstLeaves}</p>

        <hr>

        <h3>ROTACIONES AVL</h3>
        <p>LL: ${rot.LL} | RR: ${rot.RR} | LR: ${rot.LR} | RL: ${rot.RL}</p>

        <hr>

        <h3>ELIMINACIONES MASIVAS</h3>
        <p>Total cancelaciones: ${avl.massiveDeletions}</p>

        <hr>

        <h3>BALANCE</h3>
        <p><strong>¿AVL válido?:</strong> ${isAVL ? "Sí" : "No"}</p>
        <p><strong>Nodos Críticos:</strong> ${critical || "Ninguno"}</p>

        <hr>

        <h3>RENTABILIDAD</h3>
        <p><strong>Mayor Profit:</strong> ${max ? max.data.codigo + " ($" + max.data.profit + ")" : "N/A"}</p>
        <p><strong>Menor Profit:</strong> ${min ? min.data.codigo + " ($" + min.data.profit + ")" : "N/A"}</p>
        <p><strong>Promedio Profit:</strong> ${avg.toFixed(2)}</p>

        <hr>

        <h3>RECORRIDOS AVL</h3>
        <p><strong>BFS:</strong> ${bfsAVL}</p>
        <p><strong>InOrder:</strong> ${inAVL}</p>
        <p><strong>PreOrder:</strong> ${preAVL}</p>
        <p><strong>PostOrder:</strong> ${postAVL}</p>
    `;

    // 👇 SOLO LLAMAS ESTO
    updateTopTable(top);
}

function applyDepthPenalty(node, depth = 0) {
    if (!node) return;

    if (depth > maxDepthAllowed) {
        node.critico = true;
        node.data.precioFinal = node.data.precioBase * 1.25;
    } else {
        node.critico = false;
        node.data.precioFinal = node.data.precioBase;
    }

    // Recalcular profit
    node.data.profit = node.data.pasajeros * node.data.precioFinal;

    applyDepthPenalty(node.left, depth + 1);
    applyDepthPenalty(node.right, depth + 1);
}

function updateTopTable(top) {
    const table = document.getElementById("topTable");
    if (!table) return;

    table.innerHTML = "";

    top.forEach(v => {
        const row = `
            <tr>
                <td>${v.codigo}</td>
                <td>${v.origen}</td>
                <td>${v.destino}</td>
                <td>$${v.profit}</td>
            </tr>
        `;
        table.innerHTML += row;
    });
}

/**
 * Calcula la altura de un árbol recursivamente
 * @param {Object} node - Nodo raíz del árbol
 * @returns {number} Altura del árbol
 */

function saveState() {
    const state = {
        avl: avl.root,
        bst: bst.root,
        rotations: avl.rotations
    };

    historyStack.push(state);
}

function undo() {
    if (historyStack.isEmpty()) {
        alert("No hay acciones para deshacer");
        return;
    }

    const prevState = historyStack.pop();

    avl.root = prevState.avl;
    bst.root = prevState.bst;
    avl.rotations = prevState.rotations;

    renderer.animate(avl.root, bst.root);
    updateMetrics();
}

function loadQueueFromJSON(json) {
    if (!json.vuelos) {
        alert("El JSON no tiene vuelos");
        return;
    }

    json.vuelos.forEach(vuelo => {
        insertionQueue.enqueue({
            ...vuelo,
            codigoNumerico: parseCodigo(vuelo.codigo)
        });
    });

    alert("Datos cargados a la cola: " + insertionQueue.size());
}

function processQueue() {
    if (insertionQueue.isEmpty()) {
        alert("La cola está vacía");
        return;
    }

    const intervalo = setInterval(() => {
        if (insertionQueue.isEmpty()) {
            clearInterval(intervalo);
            alert("Inserciones completadas");
            return;
        }

        saveState(); // Guardar estado para UNDO

        const data = insertionQueue.dequeue();

        avl.insertValue(data);
        bst.insertValue(data);

        renderer.animate(avl.root, bst.root);
        updateMetrics();

    }, 1000); // Inserta cada 1 segundo
}

function insertBSTFromAVL(node) {
    if (!node) return;

    bst.insertValue({
        ...node.data,
        codigoNumerico: parseCodigo(node.data.codigo)
    });

    insertBSTFromAVL(node.left);
    insertBSTFromAVL(node.right);
}

function findPath(node, codigo, path = []) {
    if (!node) return null;

    path.push(node.data.codigo);

    if (codigo === node.data.codigoNumerico) {
        return path;
    }

    if (codigo < node.data.codigoNumerico) {
        return findPath(node.left, codigo, path);
    } else {
        return findPath(node.right, codigo, path);
    }
}

function exportTree(node) {
    if (!node) return null;

    return {
        codigo: node.data.codigo,
        origen: node.data.origen,
        destino: node.data.destino,
        precioBase: node.data.precioBase,
        precioFinal: node.data.precioFinal,
        pasajeros: node.data.pasajeros,
        altura: node.height,
        balance: node.factor,
        critico: node.critico,
        izquierdo: exportTree(node.left),
        derecho: exportTree(node.right)
    };
}

function updateDepth(node, depth = 0) {
    if (!node) return;

    node.depth = depth;

    updateDepth(node.left, depth + 1);
    updateDepth(node.right, depth + 1);
}

// Evento para activar modo de estrés (inserción masiva con animación)
document.getElementById("stressInsertBtn").addEventListener("click", () => {

    avl.root = null;
    bst.root = null;
    avl.rotations = [];

    let i = 1;
    const total = 200; // 🔥 puedes subir a 1000 luego

    function insertarPaso() {
        if (i > total) return;

        const data = {
            codigo: i,
            origen: "Stress",
            destino: "Stress",
            precioBase: 100,
            pasajeros: 100,
            codigoNumerico: i
        };

        avl.insertValue(data);
        bst.insertValue(data);

        updateDepth(avl.root);
        updateDepth(bst.root);
        applyDepthPenalty(avl.root);
        applyDepthPenalty(bst.root);

        renderer.animate(avl.root, bst.root);
        updateMetrics();

        i++;

        setTimeout(insertarPaso, 30); // velocidad animación
    }

    insertarPaso();
});

document.getElementById("undoBtn").addEventListener("click", undo);

document.getElementById("loadQueueBtn").addEventListener("click", () => {
    readJSONFile((json) => {
        loadQueueFromJSON(json);
    });
});

document.getElementById("processQueueBtn").addEventListener("click", processQueue);

document.getElementById("deleteBtn").addEventListener("click", () => {
    const codigo = parseInt(document.getElementById("deleteInput").value);

    if (isNaN(codigo)) {
        alert("Ingrese un código válido");
        return;
    }

    saveState();

    avl.deleteValue(codigo);
    bst.deleteValue(codigo);

    updateDepth(avl.root);
    updateDepth(bst.root);
    applyDepthPenalty(avl.root);
    applyDepthPenalty(bst.root);

    renderer.animate(avl.root, bst.root);
    updateMetrics();
});

document.getElementById("cancelBtn").addEventListener("click", () => {
    const codigo = parseInt(prompt("Ingrese código raíz de la rama a eliminar:"));

    if (isNaN(codigo)) return;

    saveState();

    avl.cancelSubtree(codigo);
    bst.cancelSubtree(codigo);

    updateDepth(avl.root);
    updateDepth(bst.root);
    applyDepthPenalty(avl.root);
    applyDepthPenalty(bst.root);

    renderer.animate(avl.root, bst.root);
    updateMetrics();
});

document.getElementById("rebalanceBtn").addEventListener("click", () => {
    saveState();

    avl.rebalanceAll();
    bst.rebalanceAll();
    updateDepth(avl.root);
    updateDepth(bst.root);
    applyDepthPenalty(avl.root);
    applyDepthPenalty(bst.root);

    renderer.animate(avl.root, bst.root);
    updateMetrics();
});

document.getElementById("auditBtn").addEventListener("click", () => {

    if (!avl.stressMode) {
        alert("La auditoría AVL solo se permite en modo estrés.");
        return;
    }

    let issues = auditAVL(avl.root);

    if (issues.length === 0) {
        alert("El árbol cumple con la propiedad AVL.");
    } else {
        alert("Problemas encontrados:\n" + issues.join("\n"));
    }
});

document.getElementById("deleteMinBtn").addEventListener("click", () => {
    const minNode = getMinProfit(avl.root);

    if (!minNode) {
        alert("No hay vuelos para eliminar");
        return;
    }

    const codigo = minNode.data.codigoNumerico;

    saveState();

    // CANCELACIÓN MASIVA
    avl.cancelSubtree(codigo);
    bst.cancelSubtree(codigo);

    updateDepth(avl.root);
    updateDepth(bst.root);
    applyDepthPenalty(avl.root);
    applyDepthPenalty(bst.root);

    renderer.animate(avl.root, bst.root);
    updateMetrics();

    alert("Se eliminó el vuelo menos rentable: " + minNode.data.codigo);
});

const saveBtn = document.getElementById("saveVersionBtn");

if (saveBtn) {
    saveBtn.addEventListener("click", () => {
        const name = prompt("Nombre de la versión:");

        const version = {
            name: name,
            avl: JSON.parse(JSON.stringify(avl.root)),
            bst: JSON.parse(JSON.stringify(bst.root))
        };

        versions.push(version);

        alert("Versión guardada: " + name);

        alert("Versión guardada: " + versions.length);
    });
}

document.getElementById("loadVersionBtn").addEventListener("click", () => {
    if (versions.length === 0) {
        alert("No hay versiones guardadas");
        return;
    }

    const index = parseInt(prompt("Ingrese número de versión (1 - " + versions.length + "):"));

    if (isNaN(index) || index < 1 || index > versions.length) {
        alert("Versión inválida");
        return;
    }

    const version = versions[index - 1];

    avl.root = JSON.parse(JSON.stringify(version.avl));
    bst.root = JSON.parse(JSON.stringify(version.bst));

    updateDepth(avl.root);
    updateDepth(bst.root);
    applyDepthPenalty(avl.root);
    applyDepthPenalty(bst.root);


    renderer.animate(avl.root, bst.root);
    updateMetrics();
});


document.getElementById("searchBtn").addEventListener("click", () => {
    const codigo = parseInt(document.getElementById("searchInput").value);

    if (isNaN(codigo)) {
        alert("Ingrese un código válido");
        return;
    }

    const node = avl.find(codigo);
    const div = document.getElementById("flightInfo");

    if (!node) {
        div.innerHTML = "<p>Vuelo no encontrado</p>";
        return;
    }

    const v = node.data;

    // ===== RUTA =====
    const path = findPath(avl.root, codigo, []);
    const profundidad = path.length - 1;

    div.innerHTML = `
        <h3>Información del vuelo</h3>
        <p><strong>Código:</strong> ${v.codigo}</p>
        <p><strong>Origen:</strong> ${v.origen}</p>
        <p><strong>Destino:</strong> ${v.destino}</p>
        <p><strong>Precio Base:</strong> ${v.precioBase}</p>
        <p><strong>Pasajeros:</strong> ${v.pasajeros}</p>
        <p><strong>Profit:</strong> ${v.profit}</p>
        <p><strong>Factor de equilibrio:</strong> ${node.factor}</p>
        <p><strong>Altura del nodo:</strong> ${node.height}</p>

        <hr>

        <h3>Ubicación en el árbol</h3>
        <p><strong>Ruta:</strong> ${path.join(" → ")}</p>
        <p><strong>Profundidad:</strong> ${profundidad}</p>
    `;
});

document.getElementById("stressModeBtn").addEventListener("click", () => {
    avl.stressMode = !avl.stressMode;

    alert("Modo estrés " + (avl.stressMode ? "ACTIVADO" : "DESACTIVADO"));
});

document.getElementById("setDepthBtn").addEventListener("click", () => {
    const d = parseInt(prompt("Ingrese profundidad límite:"));
    if (!isNaN(d)) {
        maxDepthAllowed = d;
        updateDepth(avl.root);
        updateDepth(bst.root);
        applyDepthPenalty(avl.root);
        applyDepthPenalty(bst.root);
        renderer.animate(avl.root, bst.root);
        updateMetrics();
    }
});

document.getElementById("penaltyBtn").addEventListener("click", () => {
    updateDepth(avl.root);
    updateDepth(bst.root);
    applyDepthPenalty(avl.root);
    applyDepthPenalty(bst.root);
    renderer.animate(avl.root, bst.root);
    updateMetrics();
});

document.getElementById("exportBtn").addEventListener("click", () => {
    const data = exportTree(avl.root);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "arbolAVL.json";
    a.click();
});

document.getElementById("updateBtn").addEventListener("click", () => {
    const codigo = parseInt(prompt("Código del vuelo:"));
    const nuevoPrecio = parseFloat(prompt("Nuevo precio base:"));
    const nuevosPasajeros = parseInt(prompt("Nuevos pasajeros:"));

    const node = avl.find(codigo);

    if (!node) {
        alert("Vuelo no encontrado");
        return;
    }

    saveState();

    node.data.precioBase = nuevoPrecio;
    node.data.pasajeros = nuevosPasajeros;

    updateDepth(avl.root);
    updateDepth(bst.root);
    applyDepthPenalty(avl.root);
    applyDepthPenalty(bst.root);

    renderer.animate(avl.root, bst.root);
    updateMetrics();
});

