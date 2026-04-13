/**
 * Binary Search Tree (BST) — No automatic balancing.
 *
 * Se usa como referencia comparativa frente al AVL para evaluar la
 * mejora de rendimiento y altura en estructuras autoequilibradas.
 */
class BST {
    constructor() {
        this.root             = null;
        this.massiveDeletions = 0;
    }

    // ─── Insertion ─────────────────────────────────────────────────────────────

    /**
     * Inserta recursivamente en el BST sin aplicar rebalanceo.
     *
     * @param {Object|null} node
     * @param {Object} data
     * @returns {Object}
     */
    _insert(node, data) {
        if (!node) {
            const precioFinal = data.precioFinal ?? data.precioBase ?? 0;
            const pax         = data.pasajeros   ?? 0;
            data.precioFinal  = precioFinal;
            const descuento   = getPromotionDiscount(data);
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

    // ─── Mass cancellation ────────────────────────────────────────────────────

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

    // ─── Rebalance (stub) — BST does not balance, but method must exist ───

    rebalanceAll() {
        // BST has no automatic balancing.
        // This method exists to keep the interface compatible with app.js
    }

    // ─── Search ─────────────────────────────────────────────────────────────

    find(codigoNumerico, node = this.root) {
        if (!node) return null;
        if (codigoNumerico === node.data.codigoNumerico) return node;
        if (codigoNumerico  < node.data.codigoNumerico) return this.find(codigoNumerico, node.left);
        return this.find(codigoNumerico, node.right);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

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

// BST available globally