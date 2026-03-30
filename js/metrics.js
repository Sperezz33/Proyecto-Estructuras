// metrics.js
// Calcula métricas de AVL y BST

export function getHeight(node) {
    if (!node) return 0;
    return 1 + Math.max(getHeight(node.left), getHeight(node.right));
}

export function countNodes(node) {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
}

export function countLeaves(node) {
    if (!node) return 0;
    if (!node.left && !node.right) return 1;
    return countLeaves(node.left) + countLeaves(node.right);
}

export function getMaxDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(getMaxDepth(node.left), getMaxDepth(node.right));
}

export function getTreeDepth(node) {
    if (!node) return -1;
    return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}

// BFS (recorrido por niveles)
export function BFS(root) {
    if (!root) return [];

    let queue = [];
    let result = [];

    queue.push(root);

    while (queue.length > 0) {
        let node = queue.shift();
        result.push(node.data.codigo);

        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
    }

    return result;
}

// DFS InOrder
export function DFS_InOrder(node, result = []) {
    if (!node) return result;

    DFS_InOrder(node.left, result);
    result.push(node.data.codigo);
    DFS_InOrder(node.right, result);

    return result;
}

// DFS PreOrder
export function DFS_PreOrder(node, result = []) {
    if (!node) return result;

    result.push(node.data.codigo);
    DFS_PreOrder(node.left, result);
    DFS_PreOrder(node.right, result);

    return result;
}

// DFS PostOrder
export function DFS_PostOrder(node, result = []) {
    if (!node) return result;

    DFS_PostOrder(node.left, result);
    DFS_PostOrder(node.right, result);
    result.push(node.data.codigo);

    return result;
}

// Contar rotaciones
export function countRotations(avl) {
    let conteo = { LL: 0, RR: 0, LR: 0, RL: 0 };

    avl.rotations.forEach(r => {
        if (conteo[r] !== undefined) {
            conteo[r]++;
        }
    });

    return conteo;
}

// Nodos críticos (|factor| > 1)
export function findCriticalNodes(node, result = []) {
    if (!node) return result;

    if (Math.abs(node.factor) > 1) {
        result.push(node.data.codigo);
    }

    findCriticalNodes(node.left, result);
    findCriticalNodes(node.right, result);

    return result;
}

export function auditAVL(node, issues = []) {
    if (!node) return issues;

    let leftHeight = node.left ? node.left.height : 0;
    let rightHeight = node.right ? node.right.height : 0;
    let balance = leftHeight - rightHeight;

    // Verificar balance
    if (balance < -1 || balance > 1) {
        issues.push(`Nodo ${node.data.codigoNumerico} desbalanceado (balance = ${balance})`);
    }

    // Verificar altura correcta
    let expectedHeight = 1 + Math.max(leftHeight, rightHeight);
    if (node.height !== expectedHeight) {
        issues.push(`Nodo ${node.data.codigoNumerico} altura incorrecta (altura = ${node.height}, debería ser = ${expectedHeight})`);
    }

    auditAVL(node.left, issues);
    auditAVL(node.right, issues);

    return issues;
}

// =============================
// RENTABILIDAD
// =============================

export function getMaxProfit(node) {
    if (!node) return null;

    let max = node;

    const left = getMaxProfit(node.left);
    const right = getMaxProfit(node.right);

    if (left && left.data.profit > max.data.profit) max = left;
    if (right && right.data.profit > max.data.profit) max = right;

    return max;
}

export function getMinProfit(node, depth = 0, result = []) {
    if (!node) return null;

    result.push({
        node: node,
        profit: node.data.profit,
        depth: depth,
        codigo: node.data.codigoNumerico
    });

    getMinProfit(node.left, depth + 1, result);
    getMinProfit(node.right, depth + 1, result);

    result.sort((a, b) => {
        if (a.profit !== b.profit) return a.profit - b.profit;
        if (a.depth !== b.depth) return b.depth - a.depth;
        return b.codigo - a.codigo;
    });

    return result[0].node;
}

export function getAverageProfit(node) {
    let sum = 0;
    let count = 0;

    function traverse(n) {
        if (!n) return;
        sum += n.data.profit;
        count++;
        traverse(n.left);
        traverse(n.right);
    }

    traverse(node);

    return count === 0 ? 0 : sum / count;
}

export function getTopN(node, n = 5) {
    let arr = [];

    function traverse(nodo) {
        if (!nodo) return;
        arr.push(nodo.data);
        traverse(nodo.left);
        traverse(nodo.right);
    }

    traverse(node);

    arr.sort((a, b) => b.profit - a.profit);

    return arr.slice(0, n);
}

export function getAverageBalanceFactor(node) {
    let sum = 0;
    let count = 0;

    function traverse(n) {
        if (!n) return;

        let left = n.left ? n.left.height : 0;
        let right = n.right ? n.right.height : 0;
        let balance = left - right;

        sum += Math.abs(balance);
        count++;

        traverse(n.left);
        traverse(n.right);
    }

    traverse(node);

    return count === 0 ? 0 : (sum / count);
}

export function getTotalProfit(node) {
    if (!node) return 0;

    return node.data.profit +
        getTotalProfit(node.left) +
        getTotalProfit(node.right);
}

export function countCriticalNodes(node) {
    if (!node) return 0;

    let count = node.critico ? 1 : 0;

    return count +
        countCriticalNodes(node.left) +
        countCriticalNodes(node.right);
}

export function getAverageDepth(node) {
    let totalDepth = 0;
    let count = 0;

    function traverse(n, depth) {
        if (!n) return;

        totalDepth += depth;
        count++;

        traverse(n.left, depth + 1);
        traverse(n.right, depth + 1);
    }

    traverse(node, 0);

    return count === 0 ? 0 : totalDepth / count;
}