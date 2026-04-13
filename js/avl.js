/**
 * AVL Tree implementation with automatic balancing
 * Records every rotation by type: LL, RR, LR, RL
 * Supports stress mode (no automatic balancing)
 */
// Node available globally

class AVL {
    constructor() {
        this.root             = null;
        this.rotations        = [];      // historial de rotaciones ["LL","RR",...]
        this.stressMode       = false;
        this.massiveDeletions = 0;
        this.rotationsBeforeRebalance = 0; // to measure deferred rebalance cost
    }

    // ─── Height and balance utilities ───────────────────────────────────────

    getHeight(node) { return node ? node.height : 0; }

    getBalance(node) {
        return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
    }

    update(node) {
        node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
        node.factor = this.getBalance(node);
    }

    // ─── Rotaciones ───────────────────────────────────────────────────────────

    rotateRight(y) {
        let x  = y.left;
        let T2 = x.right;
        x.right = y;
        y.left  = T2;
        this.update(y);
        this.update(x);
        return x;
    }

    rotateLeft(x) {
        let y  = x.right;
        let T2 = y.left;
        y.left  = x;
        x.right = T2;
        this.update(x);
        this.update(y);
        return y;
    }

    // ─── Rebalance a node ─────────────────────────────────────────────────

    rebalance(node) {
        const balance = this.getBalance(node);

        // LL — right single rotation
        if (balance > 1 && this.getBalance(node.left) >= 0) {
            this.rotations.push("LL");
            return this.rotateRight(node);
        }
        // LR — left-right double rotation
        if (balance > 1 && this.getBalance(node.left) < 0) {
            this.rotations.push("LR");
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }
        // RR — left single rotation
        if (balance < -1 && this.getBalance(node.right) <= 0) {
            this.rotations.push("RR");
            return this.rotateLeft(node);
        }
        // RL — right-left double rotation
        if (balance < -1 && this.getBalance(node.right) > 0) {
            this.rotations.push("RL");
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }

        return node;
    }

    // ─── Inserción ─────────────────────────────────────────────────────────────

    insert(node, data) {
        if (!node) {
            // Calcular precioFinal y profit al insertar
            const precioFinal = data.precioFinal ?? data.precioBase;
            data.precioFinal  = precioFinal;
            data.profit       = this._calcProfit(data);
            return new Node(data);
        }

        if (data.codigoNumerico < node.data.codigoNumerico)
            node.left  = this.insert(node.left,  data);
        else if (data.codigoNumerico > node.data.codigoNumerico)
            node.right = this.insert(node.right, data);
        else
            return node; // duplicate ignored

        this.update(node);

        return this.stressMode ? node : this.rebalance(node);
    }

    insertValue(data) {
        this.root = this.insert(this.root, data);
    }

    // ─── Simple deletion (node only) ────────────────────────────────────

    delete(node, codigoNumerico) {
        if (!node) return null;

        if (codigoNumerico < node.data.codigoNumerico) {
            node.left  = this.delete(node.left,  codigoNumerico);
        } else if (codigoNumerico > node.data.codigoNumerico) {
            node.right = this.delete(node.right, codigoNumerico);
        } else {
            if (!node.left || !node.right) {
                node = node.left ?? node.right ?? null;
            } else {
                const temp = this.minValueNode(node.right);
                node.data  = { ...temp.data };
                node.right = this.delete(node.right, temp.data.codigoNumerico);
            }
        }

        if (!node) return null;
        this.update(node);
        return this.stressMode ? node : this.rebalance(node);
    }

    deleteValue(codigoNumerico) {
        this.root = this.delete(this.root, codigoNumerico);
    }

    // ─── Mass cancellation (node + entire subtree) ─────────────────────

    _deleteSubtree(node, codigoNumerico) {
        if (!node) return null;

        if (codigoNumerico < node.data.codigoNumerico) {
            node.left  = this._deleteSubtree(node.left,  codigoNumerico);
        } else if (codigoNumerico > node.data.codigoNumerico) {
            node.right = this._deleteSubtree(node.right, codigoNumerico);
        } else {
            return null; // elimina todo el subárbol
        }

        this.update(node);
        return this.stressMode ? node : this.rebalance(node);
    }

    cancelSubtree(codigoNumerico) {
        this.massiveDeletions++;
        this.root = this._deleteSubtree(this.root, codigoNumerico);
    }

    // ─── Global rebalance (stress mode → deferred rebalance) ───────────────

    _rebalanceTree(node) {
        if (!node) return null;
        node.left  = this._rebalanceTree(node.left);
        node.right = this._rebalanceTree(node.right);
        this.update(node);
        return this.rebalance(node);
    }

    rebalanceAll() {
        const rotBefore       = this.rotations.length;
        this.root             = this._rebalanceTree(this.root);
        this.rotationsBeforeRebalance = this.rotations.length - rotBefore;
    }

    // ─── Búsqueda ─────────────────────────────────────────────────────────────

    _search(node, codigoNumerico) {
        if (!node) return null;
        if (codigoNumerico === node.data.codigoNumerico) return node;
        if (codigoNumerico  < node.data.codigoNumerico)
            return this._search(node.left,  codigoNumerico);
        return this._search(node.right, codigoNumerico);
    }

    find(codigoNumerico) {
        return this._search(this.root, codigoNumerico);
    }

    // ─── Auxiliares ───────────────────────────────────────────────────────────

    minValueNode(node) {
        let cur = node;
        while (cur.left) cur = cur.left;
        return cur;
    }

    getTreeHeight() { return this.getHeight(this.root); }

    countLeaves(node) {
        if (!node) return 0;
        if (!node.left && !node.right) return 1;
        return this.countLeaves(node.left) + this.countLeaves(node.right);
    }

    // Cálculo de profit/rentabilidad usando la misma lógica de métricas
    _calcProfit(data) {
        const base      = data.precioFinal ?? data.precioBase ?? 0;
        const pax       = data.pasajeros   ?? 0;
        const ingresos  = pax * base;
        const promocion = getPromotionDiscount(data);
        const penaliz   = data.critico ? (data.precioBase ?? 0) * pax * 0.25 : 0;
        return ingresos - promocion + penaliz;
    }

    // Recalculate profits for the entire tree (call after price/depth changes)
    recalcProfits(node) {
        if (!node) return;
        node.data.profit = this._calcProfit(node.data);
        this.recalcProfits(node.left);
        this.recalcProfits(node.right);
    }
}

// AVL available globally