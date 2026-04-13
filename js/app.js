// Todas las clases y funciones están disponibles globalmente
// cargadas en order desde index.html (sin ES modules)


// ═══════════════════════════════════ INSTANCIAS GLOBALES

const avl          = new AVL();
const bst          = new BST();
const historyStack = new Stack();
const insertionQueue = new Queue();
const renderer     = new Renderer("treeCanvas");
const versions     = new VersionManager();

let maxDepthAllowed = parseInt(document.getElementById("depthLimitInput").value) || 3;

// ═══════════════════════════════════ UTILIDADES

/** Extrae el código numérico de un código string o número */
function parseCodigo(codigo) {
    if (typeof codigo === "number") return codigo;
    const n = parseInt(String(codigo).replace(/\D/g, ""));
    return isNaN(n) ? 0 : n;
}

/** Toast de notificación */
function toast(msg, type = "info", duration = 3000) {
    const icons = { info: "ℹ️", success: "✅", warn: "⚠️", error: "❌" };
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span>${icons[type] || "ℹ️"}</span><span>${msg}</span>`;
    document.getElementById("toastContainer").appendChild(el);
    setTimeout(() => {
        el.classList.add("out");
        setTimeout(() => el.remove(), 300);
    }, duration);
}

/** Abre un modal */
function openModal(id) {
    document.getElementById(id)?.classList.add("active");
}

/** Cierra un modal */
function closeModal(id) {
    document.getElementById(id)?.classList.remove("active");
}

// Cerrar modales con click en botones [data-close]
document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
});

// Cerrar modal clickeando fondo
document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
        if (e.target === overlay) closeModal(overlay.id);
    });
});

// Ctrl+Z
document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") undo();
});

// ═══════════════════════════════════ PROFUNDIDAD Y PENALIZACIÓN

/** Recalcula depth y penalización en todo el árbol */
function applyDepthPenalty(node, depth = 0) {
    if (!node) return;
    node.depth = depth;

    if (depth > maxDepthAllowed) {
        node.critico            = true;
        node.data.precioFinal   = node.data.precioBase * 1.25;
        node.data.penalizacion  = true;
    } else {
        node.critico            = false;
        node.data.precioFinal   = node.data.precioBase;
        node.data.penalizacion  = false;
    }
    // Recalcular profit con fórmula completa
    node.data.profit = calcRentabilidad(node);

    applyDepthPenalty(node.left,  depth + 1);
    applyDepthPenalty(node.right, depth + 1);
}

function refreshAll() {
    applyDepthPenalty(avl.root);
    applyDepthPenalty(bst.root);
    renderer.animate(avl.root, bst.root);
    updateMetrics();
    updateDepthBadge();
}

function updateDepthBadge() {
    document.getElementById("depthVal").textContent = maxDepthAllowed;
}

// ═══════════════════════════════════ HISTORIAL (UNDO)

function saveState() {
    historyStack.push({
        avl:       JSON.parse(JSON.stringify(avl.root)),
        bst:       JSON.parse(JSON.stringify(bst.root)),
        rotations: [...avl.rotations],
        massiveDeletions: avl.massiveDeletions
    });
}

function undo() {
    if (historyStack.isEmpty()) { toast("No hay acciones para deshacer", "warn"); return; }
    const prev = historyStack.pop();
    avl.root              = prev.avl;
    bst.root              = prev.bst;
    avl.rotations         = prev.rotations;
    avl.massiveDeletions  = prev.massiveDeletions;
    refreshAll();
    toast("Acción deshecha", "info");
}

document.getElementById("undoBtn").addEventListener("click", undo);

// ═══════════════════════════════════ CARGA DE ARCHIVO JSON

document.getElementById("fileInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    // Leer profundidad configurada antes de cargar
    maxDepthAllowed = parseInt(document.getElementById("depthLimitInput").value) || 3;

    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const json = JSON.parse(ev.target.result);
            if (json.tipo === "INSERCION") {
                handleInsertionMode(json);
            } else {
                handleTopologyMode(json);
            }
        } catch (err) {
            toast("Error al leer el JSON: " + err.message, "error", 5000);
            console.error(err);
        }
    };
    reader.readAsText(file);
    // Reset input para poder recargar el mismo archivo
    e.target.value = "";
});

/** Modo INSERCIÓN: inserta vuelos en AVL y BST, muestra comparativa */
function handleInsertionMode(json) {
    avl.root = null;
    bst.root = null;
    avl.rotations = [];
    avl.massiveDeletions = 0;

    (json.vuelos || []).forEach(v => {
        const data = {
            ...v,
            codigoNumerico: parseCodigo(v.codigo),
            precioFinal: v.precioFinal ?? v.precioBase
        };
        avl.insertValue(data);
        bst.insertValue({ ...data });
    });

    refreshAll();
    toast(`Árbol cargado en modo INSERCIÓN — ${(json.vuelos || []).length} vuelos`, "success");
    showCompareModal();
}

/** Construye un nodo a partir del JSON de topología */
function buildTopologyNode(nd) {
    if (!nd) return null;
    const codigoNumerico = parseCodigo(nd.codigo);
    const precioFinal    = nd.precioFinal ?? nd.precioBase ?? 0;
    const nodeData       = {
        ...nd,
        precioFinal,
        pasajeros: nd.pasajeros ?? 0
    };
    const profit = nodeData.pasajeros * precioFinal - getPromotionDiscount(nodeData);
    return {
        data: {
            codigo:         nd.codigo,
            codigoNumerico,
            origen:         nd.origen         ?? "",
            destino:        nd.destino         ?? "",
            horaSalida:     nd.horaSalida       ?? "",
            precioBase:     nd.precioBase       ?? 0,
            precioFinal,
            pasajeros:      nd.pasajeros        ?? 0,
            prioridad:      nd.prioridad        ?? 1,
            promocion:      nd.promocion        ?? false,
            alerta:         nd.alerta           ?? false,
            profit,
            penalizacion:   false
        },
        height:  nd.altura           ?? 1,
        factor:  nd.factorEquilibrio ?? 0,
        left:    buildTopologyNode(nd.izquierdo),
        right:   buildTopologyNode(nd.derecho),
        critico: false,
        depth:   0
    };
}

/** Modo TOPOLOGÍA: reconstruye árbol respetando la topología del JSON */
function handleTopologyMode(json) {
    avl.root = buildTopologyNode(json);
    bst.root = null;
    avl.rotations = [];
    avl.massiveDeletions = 0;

    // Insertar en BST siguiendo el orden del AVL (BFS)
    insertIntoBSTFromTree(avl.root);

    refreshAll();
    toast("Árbol cargado en modo TOPOLOGÍA", "success");
}

function insertIntoBSTFromTree(node) {
    if (!node) return;
    bst.insertValue({ ...node.data });
    insertIntoBSTFromTree(node.left);
    insertIntoBSTFromTree(node.right);
}

// ═══════════════════════════════════ COMPARATIVA AVL vs BST

function showCompareModal() {
    // Props AVL
    const avlH  = getHeight(avl.root);
    const avlL  = countLeaves(avl.root);
    const avlN  = countNodes(avl.root);
    const avlR  = avl.root?.data.codigo ?? "—";

    // Props BST
    const bstH  = getHeight(bst.root);
    const bstL  = countLeaves(bst.root);
    const bstN  = countNodes(bst.root);
    const bstR  = bst.root?.data.codigo ?? "—";

    document.getElementById("compareAvlProps").innerHTML = propHTML([
        ["Raíz",       avlR],
        ["Altura",     avlH - 1],
        ["Nodos",      avlN],
        ["Hojas",      avlL],
        ["Rotaciones", avl.rotations.length]
    ], "var(--avl)");

    document.getElementById("compareBstProps").innerHTML = propHTML([
        ["Raíz",   bstR],
        ["Altura", bstH - 1],
        ["Nodos",  bstN],
        ["Hojas",  bstL]
    ], "var(--bst)");

    // Mini canvas
    const avlCanvas = document.getElementById("compareAVLCanvas");
    const bstCanvas = document.getElementById("compareBSTCanvas");
    avlCanvas.width  = avlCanvas.parentElement.clientWidth - 20;
    bstCanvas.width  = bstCanvas.parentElement.clientWidth - 20;
    drawMiniTree(avlCanvas, avl.root, "AVL");
    drawMiniTree(bstCanvas, bst.root, "BST");

    openModal("modalCompare");
}

function propHTML(rows, color) {
    return rows.map(([l, v]) => `
        <div class="compare-prop">
            <span style="color:var(--text-2)">${l}</span>
            <span style="color:${color};font-weight:700;font-family:'JetBrains Mono',monospace">${v}</span>
        </div>`).join("");
}

function drawMiniTree(canvas, root, type) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!root) return;

    const color = type === "AVL" ? "#4f8ef7" : "#22d3a0";
    const h     = getHeight(root);
    const r     = Math.max(8, Math.min(16, canvas.width / (Math.pow(2, h) * 2)));

    function draw(node, x, y, offset) {
        if (!node) return;
        ctx.lineWidth = 1;
        if (node.left) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - offset, y + 50);
            ctx.strokeStyle = "#555"; ctx.stroke();
            draw(node.left, x - offset, y + 50, offset * 0.55);
        }
        if (node.right) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + offset, y + 50);
            ctx.strokeStyle = "#555"; ctx.stroke();
            draw(node.right, x + offset, y + 50, offset * 0.55);
        }
        // Nodo
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = node.critico ? "#f59e0b" : color;
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font      = `bold ${Math.max(7, r * 0.65)}px JetBrains Mono,monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.data.codigo, x, y);
    }

    draw(root, canvas.width / 2, r + 10, canvas.width / 4);
}

// ═══════════════════════════════════ MÉTRICAS

function updateMetrics() {
    const rot  = countRotations(avl);
    const top  = getTopN(avl.root, 5);
    const max  = getMaxProfit(avl.root);
    const min  = getMinProfit(avl.root);

    // Estructura
    set("mAvlRoot",   avl.root?.data.codigo ?? "—");
    set("mBstRoot",   bst.root?.data.codigo ?? "—");
    set("mAvlDepth",  getHeight(avl.root) - 1);
    set("mBstDepth",  getHeight(bst.root) - 1);
    set("mAvlNodes",  countNodes(avl.root));
    set("mAvlLeaves", countLeaves(avl.root));
    set("mBstLeaves", countLeaves(bst.root));
    set("mCancels",   avl.massiveDeletions);

    // Rotaciones
    set("rLL",       rot.LL);
    set("rRR",       rot.RR);
    set("rLR",       rot.LR);
    set("rRL",       rot.RL);
    set("rTotal",    avl.rotations.length);
    set("rLastCost", avl.rotationsBeforeRebalance > 0
        ? `${avl.rotationsBeforeRebalance} giros` : "—");

    // Rentabilidad
    set("mTotalProfit", "$" + Math.round(getTotalProfit(avl.root)).toLocaleString());
    set("mAvgProfit",   "$" + Math.round(getAverageProfit(avl.root)).toLocaleString());
    set("mMaxProfit",   max ? `${max.data.codigo} ($${Math.round(calcRentabilidad(max)).toLocaleString()})` : "—");
    set("mMinProfit",   min ? `${min.data.codigo} ($${Math.round(calcRentabilidad(min)).toLocaleString()})` : "—");
    set("mCritical",    countCriticalNodes(avl.root));

    // Top 5
    const tb = document.getElementById("topTable");
    tb.innerHTML = top.map(v => `
        <tr>
            <td>${v.codigo}</td>
            <td style="font-size:.68rem">${v.origen} → ${v.destino}</td>
            <td class="profit">$${Math.round(v.rentabilidad).toLocaleString()}</td>
        </tr>`).join("") || `<tr><td colspan="3" style="color:var(--text-2);text-align:center">Sin datos</td></tr>`;

    // Recorridos
    set("tBFS",      BFS(avl.root).join(", ")      || "—");
    set("tInOrder",  DFS_InOrder(avl.root).join(", ") || "—");
    set("tPreOrder", DFS_PreOrder(avl.root).join(", ") || "—");
    set("tPostOrder",DFS_PostOrder(avl.root).join(", ") || "—");

    // Badge cola
    set("queueSize", insertionQueue.size());
}

function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ═══════════════════════════════════ INSERCIÓN MANUAL

document.getElementById("insertBtn").addEventListener("click", () => openModal("modalInsert"));

document.getElementById("confirmInsertBtn").addEventListener("click", () => {
    const codigo     = document.getElementById("iCodigo").value.trim();
    const origen     = document.getElementById("iOrigen").value.trim();
    const destino    = document.getElementById("iDestino").value.trim();
    const hora       = document.getElementById("iHora").value;
    const precio     = parseFloat(document.getElementById("iPrecio").value);
    const pasajeros  = parseInt(document.getElementById("iPasajeros").value);
    const prioridad  = parseInt(document.getElementById("iPrioridad").value);
    const promocion  = document.getElementById("iPromocion").checked;
    const alerta     = document.getElementById("iAlerta").checked;

    if (!codigo || !origen || !destino || isNaN(precio) || isNaN(pasajeros)) {
        toast("Complete todos los campos obligatorios (*)", "warn"); return;
    }

    const codigoNumerico = parseCodigo(codigo);
    if (codigoNumerico === 0 && isNaN(parseInt(codigo))) {
        toast("Ingrese un código válido (ej: SB400 o 400)", "warn"); return;
    }

    const data = {
        codigo, codigoNumerico, origen, destino,
        horaSalida: hora, precioBase: precio,
        precioFinal: precio, pasajeros, prioridad,
        promocion, alerta, profit: 0, penalizacion: false
    };

    saveState();
    avl.insertValue(data);
    bst.insertValue({ ...data });
    closeModal("modalInsert");
    refreshAll();
    toast(`Vuelo ${codigo} insertado`, "success");

    // Limpiar formulario
    ["iCodigo","iOrigen","iDestino","iPrecio","iPasajeros"].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById("iPromocion").checked = false;
    document.getElementById("iAlerta").checked    = false;
});

// ═══════════════════════════════════ MODIFICAR VUELO

document.getElementById("updateBtn").addEventListener("click", () => openModal("modalUpdate"));

document.getElementById("uSearchBtn").addEventListener("click", () => {
    const codigo = parseInt(document.getElementById("uCodigo").value);
    const node   = avl.find(codigo);

    if (!node) { toast("Vuelo no encontrado", "warn"); return; }

    const d = node.data;
    document.getElementById("uOrigen").value     = d.origen;
    document.getElementById("uDestino").value    = d.destino;
    document.getElementById("uHora").value       = d.horaSalida;
    document.getElementById("uPrecio").value     = d.precioBase;
    document.getElementById("uPasajeros").value  = d.pasajeros;
    document.getElementById("uPrioridad").value  = d.prioridad ?? 2;
    document.getElementById("uPromocion").checked= d.promocion;
    document.getElementById("uAlerta").checked   = d.alerta;

    document.getElementById("uFormFields").style.display  = "";
    document.getElementById("confirmUpdateBtn").disabled  = false;
});

document.getElementById("confirmUpdateBtn").addEventListener("click", () => {
    const codigo    = parseInt(document.getElementById("uCodigo").value);
    const avlNode   = avl.find(codigo);
    const bstNode   = bst.find(codigo);
    if (!avlNode) { toast("Vuelo no encontrado", "error"); return; }

    saveState();

    const updates = {
        origen:    document.getElementById("uOrigen").value.trim(),
        destino:   document.getElementById("uDestino").value.trim(),
        horaSalida:document.getElementById("uHora").value,
        precioBase:parseFloat(document.getElementById("uPrecio").value),
        pasajeros: parseInt(document.getElementById("uPasajeros").value),
        prioridad: parseInt(document.getElementById("uPrioridad").value),
        promocion: document.getElementById("uPromocion").checked,
        alerta:    document.getElementById("uAlerta").checked
    };

    Object.assign(avlNode.data, updates);
    if (bstNode) Object.assign(bstNode.data, updates);

    closeModal("modalUpdate");
    document.getElementById("uFormFields").style.display = "none";
    document.getElementById("confirmUpdateBtn").disabled = true;

    refreshAll();
    toast(`Vuelo ${codigo} modificado`, "success");
});

// ═══════════════════════════════════ ELIMINAR NODO INDIVIDUAL

document.getElementById("deleteBtn").addEventListener("click", () => {
    const codigo = parseInt(document.getElementById("deleteInput").value);
    if (isNaN(codigo)) { toast("Ingrese un código numérico válido", "warn"); return; }

    saveState();
    avl.deleteValue(codigo);
    bst.deleteValue(codigo);
    document.getElementById("deleteInput").value = "";
    refreshAll();
    toast(`Vuelo ${codigo} eliminado`, "info");
});

// ═══════════════════════════════════ CANCELAR RAMA (masiva)

document.getElementById("cancelBtn").addEventListener("click", () => {
    const raw    = prompt("Código numérico de la raíz de la rama a cancelar:");
    const codigo = parseInt(raw);
    if (isNaN(codigo)) return;

    saveState();
    avl.cancelSubtree(codigo);
    bst.cancelSubtree(codigo);
    refreshAll();
    toast(`Rama del vuelo ${codigo} cancelada (masiva)`, "warn");
});

// ═══════════════════════════════════ BÚSQUEDA

document.getElementById("searchBtn").addEventListener("click", buscarVuelo);
document.getElementById("searchInput").addEventListener("keydown", e => { if (e.key === "Enter") buscarVuelo(); });

function buscarVuelo() {
    const codigo = parseInt(document.getElementById("searchInput").value);
    if (isNaN(codigo)) { toast("Ingrese un código numérico válido", "warn"); return; }

    const node = avl.find(codigo);
    const div  = document.getElementById("flightInfo");

    if (!node) {
        div.innerHTML = `<p style="color:var(--danger)">✈️ Vuelo ${codigo} no encontrado</p>`;
        return;
    }

    const d   = node.data;
    const rent= Math.round(calcRentabilidad(node));

    div.innerHTML = `
        <div class="fi-row"><span class="fi-label">Código</span><span class="fi-val">${d.codigo}</span></div>
        <div class="fi-row"><span class="fi-label">Ruta</span><span class="fi-val">${d.origen} → ${d.destino}</span></div>
        <div class="fi-row"><span class="fi-label">Hora salida</span><span class="fi-val">${d.horaSalida || "—"}</span></div>
        <div class="fi-row"><span class="fi-label">Precio base</span><span class="fi-val">$${d.precioBase}</span></div>
        <div class="fi-row"><span class="fi-label">Precio final</span><span class="fi-val ${node.critico ? "fi-crit" : ""}">$${d.precioFinal?.toFixed(2)} ${node.critico ? "⚠️ +25%" : ""}</span></div>
        <div class="fi-row"><span class="fi-label">Pasajeros</span><span class="fi-val">${d.pasajeros}</span></div>
        <div class="fi-row"><span class="fi-label">Prioridad</span><span class="fi-val">${d.prioridad ?? "—"}</span></div>
        <div class="fi-row"><span class="fi-label">Promoción</span><span class="fi-val">${d.promocion ? "✅ Sí" : "No"}</span></div>
        <div class="fi-row"><span class="fi-label">Alerta</span><span class="fi-val ${d.alerta ? "fi-alert" : ""}">${d.alerta ? "🚨 Sí" : "No"}</span></div>
        <div class="fi-row"><span class="fi-label">Rentabilidad</span><span class="fi-val">$${rent.toLocaleString()}</span></div>
        <div class="fi-row"><span class="fi-label">Altura nodo</span><span class="fi-val">${node.height}</span></div>
        <div class="fi-row"><span class="fi-label">Factor balance</span><span class="fi-val">${node.factor}</span></div>
        <div class="fi-row"><span class="fi-label">Profundidad</span><span class="fi-val">${node.depth}</span></div>
        <div class="fi-row"><span class="fi-label">Estado</span><span class="fi-val ${node.critico ? "fi-crit" : ""}">${node.critico ? "🔴 Nodo Crítico" : "🟢 Normal"}</span></div>
    `;
}

// ═══════════════════════════════════ VERSIONADO

document.getElementById("versionBtn").addEventListener("click", () => {
    const name = prompt("Nombre de la versión (ej: 'Simulación Alta Demanda'):");
    if (!name?.trim()) return;

    try {
        versions.save(name, avl.root, bst.root, {
            maxDepthAllowed,
            rotaciones: avl.rotations.length,
            massiveDeletions: avl.massiveDeletions
        });
        toast(`Versión "${name}" guardada`, "success");
    } catch (e) {
        toast(e.message, "error");
    }
});

document.getElementById("loadVersionBtn").addEventListener("click", () => openModal("modalVersions"));
document.getElementById("exportVersionsBtn").addEventListener("click", () => versions.exportAll());
document.getElementById("exportVersionsBtn2").addEventListener("click", () => versions.exportAll());

function renderVersionList() {
    const list   = versions.list();
    const elList = document.getElementById("versionList");
    const noMsg  = document.getElementById("noVersionsMsg");

    noMsg.style.display = list.length ? "none" : "";
    elList.innerHTML = list.map(v => `
        <div class="version-item">
            <div>
                <div class="version-name">📌 ${v.name}</div>
                <div class="version-time">${new Date(v.timestamp ?? 0).toLocaleString()}</div>
            </div>
            <button class="btn btn-secondary" style="width:auto;padding:5px 10px;font-size:.72rem"
                onclick="restoreVersion('${v.name}')">Restaurar</button>
            <button class="btn btn-danger" style="width:auto;padding:5px 8px;font-size:.72rem"
                onclick="deleteVersion('${v.name}')">🗑️</button>
        </div>`).join("");
}

window.restoreVersion = function(name) {
    const snap = versions.restore(name);
    if (!snap) { toast("Versión no encontrada", "error"); return; }

    saveState();
    avl.root = snap.avl;
    bst.root = snap.bst;
    if (snap.meta?.maxDepthAllowed) maxDepthAllowed = snap.meta.maxDepthAllowed;

    closeModal("modalVersions");
    refreshAll();
    toast(`Versión "${name}" restaurada`, "success");
};

window.deleteVersion = function(name) {
    if (!confirm(`¿Eliminar la versión "${name}"?`)) return;
    versions.remove(name);
    renderVersionList();
    toast(`Versión "${name}" eliminada`, "info");
};

// Actualizar lista al abrir modal
document.getElementById("loadVersionBtn").addEventListener("click", renderVersionList);

// ═══════════════════════════════════ COLA DE INSERCIONES

document.getElementById("addToQueueBtn").addEventListener("click", () => {
    const codigo    = prompt("Código del vuelo (ej: SB999 o 999):");
    if (!codigo) return;
    const origen    = prompt("Ciudad de origen:") || "Ciudad";
    const destino   = prompt("Ciudad de destino:") || "Ciudad";
    const precio    = parseFloat(prompt("Precio base:") || "200");
    const pasajeros = parseInt(prompt("Pasajeros:") || "50");

    const data = {
        codigo: codigo.trim(),
        codigoNumerico: parseCodigo(codigo.trim()),
        origen, destino,
        precioBase: precio,
        precioFinal: precio,
        pasajeros,
        prioridad: 2,
        promocion: false,
        alerta: false,
        profit: 0,
        penalizacion: false
    };

    insertionQueue.enqueue(data);
    set("queueSize", insertionQueue.size());
    toast(`Vuelo ${data.codigo} agregado a la cola (${insertionQueue.size()} pendientes)`, "info");
});

document.getElementById("loadQueueBtn").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type  = "file";
    input.accept= ".json";
    input.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const json = JSON.parse(ev.target.result);
                (json.vuelos || []).forEach(v => {
                    insertionQueue.enqueue({
                        ...v,
                        codigoNumerico: parseCodigo(v.codigo),
                        precioFinal: v.precioFinal ?? v.precioBase
                    });
                });
                set("queueSize", insertionQueue.size());
                toast(`${(json.vuelos || []).length} vuelos cargados a la cola`, "success");
            } catch (err) {
                toast("Error leyendo JSON: " + err.message, "error");
            }
        };
        reader.readAsText(file);
    });
    input.click();
});

document.getElementById("processQueueBtn").addEventListener("click", () => {
    if (insertionQueue.isEmpty()) { toast("La cola está vacía", "warn"); return; }

    toast("Procesando cola de inserciones…", "info");

    const step = () => {
        if (insertionQueue.isEmpty()) {
            toast("Cola procesada completamente", "success");
            updateMetrics();
            return;
        }
        saveState();
        const data = insertionQueue.dequeue();
        avl.insertValue(data);
        bst.insertValue({ ...data });
        applyDepthPenalty(avl.root);
        applyDepthPenalty(bst.root);
        renderer.animate(avl.root, bst.root);
        updateMetrics();
        set("queueSize", insertionQueue.size());
        setTimeout(step, 800);
    };
    step();
});

document.getElementById("viewQueueBtn").addEventListener("click", () => {
    renderQueueList();
    openModal("modalQueue");
});

document.getElementById("clearQueueBtn").addEventListener("click", () => {
    while (!insertionQueue.isEmpty()) insertionQueue.dequeue();
    set("queueSize", 0);
    renderQueueList();
    toast("Cola vaciada", "info");
});

function renderQueueList() {
    const items  = [];
    const tmpQ   = new (insertionQueue.constructor)();
    let idx = 1;

    // Copiar temporalmente para visualizar
    const all = insertionQueue._getAll ? insertionQueue._getAll() : [];
    const elList = document.getElementById("queueList");
    const noMsg  = document.getElementById("noQueueMsg");
    noMsg.style.display = all.length ? "none" : "";
    elList.innerHTML = all.map((v, i) => `
        <div class="queue-item">
            <span class="qi-num">${i+1}.</span>
            <span>${v.codigo}</span>
            <span style="color:var(--text-2)">${v.origen} → ${v.destino}</span>
            <span style="color:var(--avl)">$${v.precioBase}</span>
        </div>`).join("");
}

// ═══════════════════════════════════ MODO ESTRÉS

document.getElementById("stressModeBtn").addEventListener("click", () => {
    avl.stressMode = !avl.stressMode;

    const badge  = document.getElementById("modeBadge");
    const auditB = document.getElementById("auditBtn");
    const rebalB = document.getElementById("rebalanceBtn");

    if (avl.stressMode) {
        badge.textContent = "🔥 Modo Estrés";
        badge.className   = "badge badge-stress";
        auditB.disabled   = false;
        toast("Modo Estrés ACTIVADO — el árbol puede degradarse", "warn", 4000);
    } else {
        badge.textContent = "⚡ Modo Normal";
        badge.className   = "badge badge-normal";
        auditB.disabled   = true;
        toast("Modo Normal restaurado", "info");
    }
});

// ═══════════════════════════════════ REBALANCEO GLOBAL

document.getElementById("rebalanceBtn").addEventListener("click", () => {
    saveState();
    avl.rotationsBeforeRebalance = 0;
    avl.rebalanceAll();
    bst.rebalanceAll(); // stub, no hace nada en BST
    refreshAll();

    const cost = avl.rotationsBeforeRebalance;
    toast(`Rebalanceo global: ${cost} rotaciones aplicadas`, cost > 0 ? "warn" : "success");
});

// ═══════════════════════════════════ AUDITORÍA AVL (solo en modo estrés)

document.getElementById("auditBtn").addEventListener("click", () => {
    if (!avl.stressMode) {
        toast("La auditoría solo está disponible en modo estrés", "warn"); return;
    }

    const issues  = auditAVL(avl.root);
    const report  = document.getElementById("auditReport");
    const rotBad  = countRotations(avl);
    const critN   = countCriticalNodes(avl.root);

    if (issues.length === 0) {
        report.innerHTML = `
            <div class="audit-ok">✅ El árbol cumple perfectamente la propiedad AVL</div>
            <div class="metric-card" style="margin-top:12px">
                <div class="metric-title">📊 Estado del Árbol</div>
                <div class="metric-row"><span class="metric-label">Nodos totales</span><span class="metric-value">${countNodes(avl.root)}</span></div>
                <div class="metric-row"><span class="metric-label">Altura</span><span class="metric-value">${getHeight(avl.root) - 1}</span></div>
                <div class="metric-row"><span class="metric-label">Nodos críticos</span><span class="metric-value">${critN}</span></div>
                <div class="metric-row"><span class="metric-label">Rotaciones totales</span><span class="metric-value">${avl.rotations.length}</span></div>
            </div>`;
    } else {
        const byType   = {};
        issues.forEach(i => { byType[i.tipo] = (byType[i.tipo] || 0) + 1; });

        report.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;padding:10px;background:rgba(239,68,68,.1);border:1px solid var(--danger);border-radius:8px;color:var(--danger);font-weight:700;margin-bottom:12px">
                ⚠️ Se encontraron ${issues.length} inconsistenci${issues.length === 1 ? "a" : "as"}
            </div>
            <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
                ${Object.entries(byType).map(([k,v]) => `<span class="rot-badge rot-${k === "DESBALANCE" ? "LL" : "LR"}">${k}: ${v}</span>`).join("")}
            </div>
            <div style="max-height:280px;overflow-y:auto">
                ${issues.map(i => `
                    <div class="audit-issue ${i.tipo}">
                        <span class="ai-code">Vuelo ${i.codigo}</span> — ${i.mensaje}
                    </div>`).join("")}
            </div>`;
    }

    openModal("modalAudit");
});

// ═══════════════════════════════════ PENALIZACIÓN POR PROFUNDIDAD

document.getElementById("setDepthBtn").addEventListener("click", () => {
    const raw = parseInt(document.getElementById("newDepthInput").value);
    if (isNaN(raw) || raw < 1) { toast("Ingrese una profundidad válida", "warn"); return; }
    maxDepthAllowed = raw;
    document.getElementById("newDepthInput").value = "";
    refreshAll();
    toast(`Profundidad límite actualizada a ${maxDepthAllowed}`, "info");
});

// ═══════════════════════════════════ ELIMINAR MENOS RENTABLE

document.getElementById("deleteMinBtn").addEventListener("click", () => {
    const minNode = getMinProfit(avl.root);
    if (!minNode) { toast("No hay vuelos en el árbol", "warn"); return; }

    const codigo = minNode.data.codigoNumerico;
    const rent   = Math.round(calcRentabilidad(minNode));

    if (!confirm(`¿Cancelar la rama del vuelo ${minNode.data.codigo} (rentabilidad: $${rent.toLocaleString()}) y toda su descendencia?`)) return;

    saveState();
    avl.cancelSubtree(codigo);
    bst.cancelSubtree(codigo);
    refreshAll();
    toast(`Vuelo ${minNode.data.codigo} y su rama eliminados (menos rentable)`, "warn");
});

// ═══════════════════════════════════ INSERCIÓN MASIVA (modo estrés)

document.getElementById("stressInsertBtn").addEventListener("click", () => {
    avl.root = null;
    bst.root = null;
    avl.rotations = [];
    avl.massiveDeletions = 0;

    let i = 1;
    const total = 200;

    const step = () => {
        if (i > total) { toast("Inserción masiva completada", "success"); return; }
        const data = {
            codigo: i, codigoNumerico: i,
            origen: "StressA", destino: "StressB",
            horaSalida: "00:00",
            precioBase: 100 + (i % 50), precioFinal: 100 + (i % 50),
            pasajeros:  50  + (i % 30),
            prioridad:  (i % 3) + 1,
            promocion:  i % 7 === 0,
            alerta:     i % 11 === 0,
            profit: 0, penalizacion: false
        };
        avl.insertValue(data);
        bst.insertValue({ ...data });
        applyDepthPenalty(avl.root);
        applyDepthPenalty(bst.root);
        renderer.animate(avl.root, bst.root);
        updateMetrics();
        i++;
        setTimeout(step, 20);
    };
    step();
});

// ═══════════════════════════════════ EXPORTAR JSON

document.getElementById("exportBtn").addEventListener("click", () => {
    if (!avl.root) { toast("El árbol está vacío", "warn"); return; }

    function serializeNode(node) {
        if (!node) return null;
        return {
            codigo:          node.data.codigo,
            codigoNumerico:  node.data.codigoNumerico,
            origen:          node.data.origen,
            destino:         node.data.destino,
            horaSalida:      node.data.horaSalida,
            precioBase:      node.data.precioBase,
            precioFinal:     node.data.precioFinal,
            pasajeros:       node.data.pasajeros,
            prioridad:       node.data.prioridad,
            promocion:       node.data.promocion,
            alerta:          node.data.alerta,
            profit:          node.data.profit,
            penalizacion:    node.data.penalizacion,
            altura:          node.height,
            factorEquilibrio:node.factor,
            profundidad:     node.depth,
            critico:         node.critico,
            izquierdo:       serializeNode(node.left),
            derecho:         serializeNode(node.right)
        };
    }

    const payload = {
        exportado:     new Date().toISOString(),
        maxDepth:      maxDepthAllowed,
        totalRotaciones: avl.rotations.length,
        rotaciones:    avl.rotations,
        raiz:          serializeNode(avl.root)
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `skybalance_avl_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Árbol AVL exportado correctamente", "success");
});

// ═══════════════════════════════════ INICIALIZACIÓN

updateMetrics();
updateDepthBadge();
