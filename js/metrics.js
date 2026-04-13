// metrics.js — Metrics calculation for AVL and BST trees (without ES modules)

// ─── Height and nodes ─────────────────────────────────────────────────────────

function getHeight(node) {
    if (!node) return 0;
    return 1 + Math.max(getHeight(node.left), getHeight(node.right));
}

function countNodes(node) {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
}

function countLeaves(node) {
    if (!node) return 0;
    if (!node.left && !node.right) return 1;
    return countLeaves(node.left) + countLeaves(node.right);
}

// ─── Traversals ──────────────────────────────────────────────────────────────

function BFS(root) {
    if (!root) return [];
    const queue = [root], result = [];
    while (queue.length) {
        const n = queue.shift();
        result.push(n.data.codigo);
        if (n.left)  queue.push(n.left);
        if (n.right) queue.push(n.right);
    }
    return result;
}

function DFS_InOrder(node, result = []) {
    if (!node) return result;
    DFS_InOrder(node.left,  result);
    result.push(node.data.codigo);
    DFS_InOrder(node.right, result);
    return result;
}

function DFS_PreOrder(node, result = []) {
    if (!node) return result;
    result.push(node.data.codigo);
    DFS_PreOrder(node.left,  result);
    DFS_PreOrder(node.right, result);
    return result;
}

function DFS_PostOrder(node, result = []) {
    if (!node) return result;
    DFS_PostOrder(node.left,  result);
    DFS_PostOrder(node.right, result);
    result.push(node.data.codigo);
    return result;
}

// ─── Rotations ──────────────────────────────────────────────────────────────

function countRotations(avl) {
    const c = { LL: 0, RR: 0, LR: 0, RL: 0 };
    avl.rotations.forEach(r => { if (c[r] !== undefined) c[r]++; });
    return c;
}

// ─── Critical nodes ───────────────────────────────────────────────────────────

function findCriticalNodes(node, result = []) {
    if (!node) return result;
    if (Math.abs(node.factor ?? 0) > 1) result.push(node.data.codigo);
    findCriticalNodes(node.left,  result);
    findCriticalNodes(node.right, result);
    return result;
}

// ─── AVL audit ───────────────────────────────────────────────────────────

function auditAVL(node, issues = []) {
    if (!node) return issues;

    const lh  = node.left  ? node.left.height  : 0;
    const rh  = node.right ? node.right.height : 0;
    const bal = lh - rh;

    if (bal < -1 || bal > 1) {
        issues.push({
            codigo:  node.data.codigo,
            tipo:    "DESBALANCE",
            mensaje: `Factor de balance = ${bal} (debe ser -1, 0 o 1)`,
            valor:   bal
        });
    }

    const expectedH = 1 + Math.max(lh, rh);
    if (node.height !== expectedH) {
        issues.push({
            codigo:  node.data.codigo,
            tipo:    "ALTURA",
            mensaje: `Altura = ${node.height} (debería ser ${expectedH})`,
            valor:   node.height
        });
    }

    auditAVL(node.left,  issues);
    auditAVL(node.right, issues);
    return issues;
}

// ─── Promotion and profitability ─────────────────────────────────────────────────

function getPromotionDiscount(data) {
    if (!data) return 0;
    const ingresos = (data.pasajeros ?? 0) * (data.precioFinal ?? data.precioBase ?? 0);
    if (typeof data.promocion === "number") return Math.max(0, data.promocion);
    if (data.promocion === true) return ingresos * 0.10;
    return 0;
}

// ─── Profitability ─────────────────────────────────────────────────────────────

/**
 * rentabilidad = pasajeros × precioFinal
 *              - promoción (si aplica)
 *              + penalización crítica (si aplica)
 */
function calcRentabilidad(node) {
    if (!node) return 0;
    const d         = node.data;
    const ingresos  = (d.pasajeros ?? 0) * (d.precioFinal ?? d.precioBase ?? 0);
    const promocion = getPromotionDiscount(d);
    const penaliz   = node.critico ? (d.precioBase ?? 0) * (d.pasajeros ?? 0) * 0.25 : 0;
    return ingresos - promocion + penaliz;
}

function getMaxProfit(node) {
    if (!node) return null;
    let max  = node;
    const l  = getMaxProfit(node.left);
    const r  = getMaxProfit(node.right);
    if (l && calcRentabilidad(l) > calcRentabilidad(max)) max = l;
    if (r && calcRentabilidad(r) > calcRentabilidad(max)) max = r;
    return max;
}

function getMinProfit(root) {
    if (!root) return null;
    const all = [];
    function collect(n, depth) {
        if (!n) return;
        all.push({ node: n, rent: calcRentabilidad(n), depth, codigo: n.data.codigoNumerico });
        collect(n.left,  depth + 1);
        collect(n.right, depth + 1);
    }
    collect(root, 0);
    all.sort((a, b) => {
        if (a.rent  !== b.rent)  return a.rent  - b.rent;
        if (a.depth !== b.depth) return b.depth - a.depth;
        return b.codigo - a.codigo;
    });
    return all[0]?.node ?? null;
}

function getAverageProfit(node) {
    let sum = 0, count = 0;
    function t(n) {
        if (!n) return;
        sum += calcRentabilidad(n);
        count++;
        t(n.left); t(n.right);
    }
    t(node);
    return count === 0 ? 0 : sum / count;
}

function getTopN(node, n = 5) {
    const arr = [];
    function t(nd) {
        if (!nd) return;
        arr.push({ ...nd.data, rentabilidad: calcRentabilidad(nd) });
        t(nd.left); t(nd.right);
    }
    t(node);
    arr.sort((a, b) => b.rentabilidad - a.rentabilidad);
    return arr.slice(0, n);
}

function getTotalProfit(node) {
    if (!node) return 0;
    return calcRentabilidad(node) + getTotalProfit(node.left) + getTotalProfit(node.right);
}

function countCriticalNodes(node) {
    if (!node) return 0;
    return (node.critico ? 1 : 0) + countCriticalNodes(node.left) + countCriticalNodes(node.right);
}

// Todas las funciones son globales (sin export)