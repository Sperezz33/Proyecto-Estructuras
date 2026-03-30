/**
 * Árbol Binario de Búsqueda (BST) — Sin balanceo automático
 * Usado en paralelo con el AVL para comparación de rendimiento
 */
class BST {
    constructor() {
        this.root             = null;
        this.massiveDeletions = 0;
    }

    // ─── Inserción ─────────────────────────────────────────────────────────────

    _insert(node, data) {
        if (!node) {
            const precioFinal = data.precioFinal ?? data.precioBase ?? 0;
            const pax         = data.pasajeros   ?? 0;
            const descuento   = data.promocion ? precioFinal * pax * 0.10 : 0;
            data.precioFinal  = precioFinal;
            data.profit       = pax * precioFinal - descuento;
            return {
                data,
                left: null, right: null,
                height: 1,  factor: 0,
                critico: false, depth: 0
            };
        }

        if (data.codigoNumerico < node.data.codigoNumerico)
            node.left  = this._insert(node.left,  data);
        else if (data.codigoNumerico > node.data.codigoNumerico)
            node.right = this._insert(node.right, data);

        node.height = 1 + Math.max(
            node.left  ? node.left.height  : 0,
            node.right ? node.right.height : 0
        );
        return node;
    }

    insertValue(data) {
        this.root = this._insert(this.root, data);
    }

    // ─── Eliminación simple ────────────────────────────────────────────────────

    _delete(node, codigoNumerico) {
        if (!node) return null;

        if      (codigoNumerico < node.data.codigoNumerico) node.left  = this._delete(node.left,  codigoNumerico);
        else if (codigoNumerico > node.data.codigoNumerico) node.right = this._delete(node.right, codigoNumerico);
        else {
            if (!node.left)  return node.right;
            if (!node.right) return node.left;
            const temp = this._minNode(node.right);
            node.data  = { ...temp.data };
            node.right = this._delete(node.right, temp.data.codigoNumerico);
        }
        return node;
    }

    deleteValue(codigoNumerico) {
        this.root = this._delete(this.root, codigoNumerico);
    }

    // ─── Cancelación masiva ────────────────────────────────────────────────────

    _cancelSubtree(node, codigoNumerico) {
        if (!node) return null;
        if      (codigoNumerico < node.data.codigoNumerico) node.left  = this._cancelSubtree(node.left,  codigoNumerico);
        else if (codigoNumerico > node.data.codigoNumerico) node.right = this._cancelSubtree(node.right, codigoNumerico);
        else return null;
        return node;
    }

    cancelSubtree(codigoNumerico) {
        this.massiveDeletions++;
        this.root = this._cancelSubtree(this.root, codigoNumerico);
    }

    // ─── Rebalanceo (stub) — el BST no balancea pero el método debe existir ───

    rebalanceAll() {
        // El BST no tiene balanceo automático.
        // Este método existe para mantener la interfaz compatible con app.js
    }

    // ─── Búsqueda ─────────────────────────────────────────────────────────────

    find(codigoNumerico, node = this.root) {
        if (!node) return null;
        if (codigoNumerico === node.data.codigoNumerico) return node;
        if (codigoNumerico  < node.data.codigoNumerico) return this.find(codigoNumerico, node.left);
        return this.find(codigoNumerico, node.right);
    }

    // ─── Auxiliares ───────────────────────────────────────────────────────────

    _minNode(node) {
        while (node.left) node = node.left;
        return node;
    }

    getHeight(node = this.root) {
        if (!node) return 0;
        return 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    }

    countLeaves(node = this.root) {
        if (!node) return 0;
        if (!node.left && !node.right) return 1;
        return this.countLeaves(node.left) + this.countLeaves(node.right);
    }

    countNodes(node = this.root) {
        if (!node) return 0;
        return 1 + this.countNodes(node.left) + this.countNodes(node.right);
    }
}

// BST disponible globalmente