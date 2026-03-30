/**
 * Implementación de Árbol Binario de Búsqueda (BST)
 * Estructura básica sin autoequilibrio para comparación con AVL
 * Puede degenerar en lista enlazada en peor caso O(n)
 */

class BST {
    /**
     * Constructor de la clase BST
     */
    constructor() {
        this.root = null;
        this.massiveDeletions = 0; // contador cancelaciones masivas
    }

    /**
     * Inserta un valor en el árbol BST de forma recursiva
     * No realiza rotaciones ni balanceo automático
     * @param {Object} node - Nodo actual en la recursión
     * @param {Object} data - Datos del vuelo a insertar
     * @returns {Object} Nodo resultante después de la inserción
     */
    insert(node, data) {
        if (!node) {
            // Inicializar precios y profit
            data.precioFinal = data.precioBase;
            data.profit = data.precioFinal * data.pasajeros;

            return {
                data,
                left: null,
                right: null,
                height: 1
            };
        }

        // Comparación por código numérico para ordenamiento
        if (data.codigoNumerico < node.data.codigoNumerico) {
            node.left = this.insert(node.left, data);
        } else if (data.codigoNumerico > node.data.codigoNumerico) {
            node.right = this.insert(node.right, data);
        }

        // Actualizar altura para métricas (no afecta balanceo)
        node.height = 1 + Math.max(
            node.left ? node.left.height : 0,
            node.right ? node.right.height : 0
        );

        return node;
    }

    /**
     * Método público para insertar un valor en el árbol BST
     * @param {Object} data - Datos del vuelo a insertar
     */
    insertValue(data) {
        this.root = this.insert(this.root, data);
    }

    delete(node, codigoNumerico) {
        if (!node) return node;

        if (codigoNumerico < node.data.codigoNumerico) {
            node.left = this.delete(node.left, codigoNumerico);
        } else if (codigoNumerico > node.data.codigoNumerico) {
            node.right = this.delete(node.right, codigoNumerico);
        } else {
            if (!node.left) return node.right;
            if (!node.right) return node.left;

            let temp = this.minValueNode(node.right);
            node.data = temp.data;
            node.right = this.delete(node.right, temp.data.codigoNumerico);
        }

        return node;
    }

    minValueNode(node) {
        let current = node;
        while (current.left)
            current = current.left;
        return current;
    }

    deleteValue(codigoNumerico) {
        this.root = this.delete(this.root, codigoNumerico);
    }

    search(node, codigo) {
        if (!node) return null;

        if (codigo === node.data.codigoNumerico) return node;

        if (codigo < node.data.codigoNumerico)
            return this.search(node.left, codigo);
        else
            return this.search(node.right, codigo);
    }

    getHeight(node) {
        if (!node) return 0;
        return 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    }

    countLeaves(node) {
        if (!node) return 0;
        if (!node.left && !node.right) return 1;
        return this.countLeaves(node.left) + this.countLeaves(node.right);
    }

    getDepth(node, codigo, depth = 0) {
        if (!node) return -1;

        if (codigo === node.data.codigoNumerico) return depth;

        if (codigo < node.data.codigoNumerico)
            return this.getDepth(node.left, codigo, depth + 1);
        else
            return this.getDepth(node.right, codigo, depth + 1);
    }

    inOrder(node, result = []) {
        if (node) {
            this.inOrder(node.left, result);
            result.push(node.data.codigoNumerico);
            this.inOrder(node.right, result);
        }
        return result;
    }

    bfs() {
        let result = [];
        let queue = [];

        if (this.root) queue.push(this.root);

        while (queue.length > 0) {
            let node = queue.shift();
            result.push(node.data.codigoNumerico);

            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        return result;
    }

    countNodes(node) {
        if (!node) return 0;
        return 1 + this.countNodes(node.left) + this.countNodes(node.right);
    }

    cancelSubtree(codigo) {
        this.massiveDeletions++;
        this.root = this._cancelSubtree(this.root, codigo);
    }

    _cancelSubtree(node, codigo) {
        if (!node) return null;

        if (codigo < node.data.codigoNumerico) {
            node.left = this._cancelSubtree(node.left, codigo);
        } else if (codigo > node.data.codigoNumerico) {
            node.right = this._cancelSubtree(node.right, codigo);
        } else {
            return null; // Elimina toda la rama
        }

        return node;
    }

    find(codigo, node = this.root) {
        if (!node) return null;

        if (codigo === node.data.codigoNumerico) return node;

        if (codigo < node.data.codigoNumerico)
            return this.find(codigo, node.left);
        else
            return this.find(codigo, node.right);
    }

    
}

export default BST;