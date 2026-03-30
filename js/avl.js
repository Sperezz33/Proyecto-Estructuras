/**
 * Implementación del Árbol AVL con balanceo automático
 * Registra todas las rotaciones por tipo: LL, RR, LR, RL
 * Soporta modo estrés (sin balanceo automático)
 */
// Node disponible globalmente

class AVL {
    constructor() {
        this.root             = null;
        this.rotations        = [];      // historial de rotaciones ["LL","RR",...]
        this.stressMode       = false;
        this.massiveDeletions = 0;
        this.rotationsBeforeRebalance = 0; // para medir costo del rebalanceo diferido
    }

    // ─── Utilidades de altura y balance ───────────────────────────────────────

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

    // ─── Rebalanceo de un nodo ─────────────────────────────────────────────────

    rebalance(node) {
        const balance = this.getBalance(node);

        // LL — rotación simple derecha
        if (balance > 1 && this.getBalance(node.left) >= 0) {
            this.rotations.push("LL");
            return this.rotateRight(node);
        }
        // LR — rotación doble izquierda-derecha
        if (balance > 1 && this.getBalance(node.left) < 0) {
            this.rotations.push("LR");
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }
        // RR — rotación simple izquierda
        if (balance < -1 && this.getBalance(node.right) <= 0) {
            this.rotations.push("RR");
            return this.rotateLeft(node);
        }
        // RL — rotación doble derecha-izquierda
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
            return node; // duplicado ignorado

        this.update(node);

        return this.stressMode ? node : this.rebalance(node);
    }

    insertValue(data) {
        this.root = this.insert(this.root, data);
    }

    // ─── Eliminación simple (solo el nodo) ────────────────────────────────────

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

    // ─── Cancelación masiva (nodo + toda su descendencia) ─────────────────────

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

    // ─── Rebalanceo global (modo estrés → rebalanceo diferido) ───────────────

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

    // Cálculo de profit con fórmula completa
    _calcProfit(data) {
        const base    = data.precioFinal ?? data.precioBase ?? 0;
        const pax     = data.pasajeros   ?? 0;
        const descuento = data.promocion ? base * pax * 0.10 : 0;
        return pax * base - descuento;
    }

    // Recalcular profits de todo el árbol (llamar tras cambios de precio/profundidad)
    recalcProfits(node) {
        if (!node) return;
        node.data.profit = this._calcProfit(node.data);
        this.recalcProfits(node.left);
        this.recalcProfits(node.right);
    }
}

// AVL disponible globalmente