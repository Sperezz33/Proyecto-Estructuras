/**
 * Implementación de Árbol AVL (Árbol Binario de Búsqueda Autoequilibrado)
 * Mantiene el balance automático mediante rotaciones para garantizar O(log n) en operaciones
 */

import Node from "./node.js";

/**
 * Clase que representa un Árbol AVL
 */
class AVL {
    /**
     * Constructor de la clase AVL
     */
    constructor() {
        this.root = null; // Raíz del árbol
        this.rotations = []; // Array para registrar las rotaciones realizadas
        this.stressMode = false; // Flag para modo de estrés (sin rotaciones)
        this.massiveDeletions = 0;
    }

    /**
     * Obtiene la altura de un nodo
     * @param {Node} node - Nodo del árbol
     * @returns {number} Altura del nodo o 0 si es null
     */
    getHeight(node) {
        return node ? node.height : 0;
    }

    /**
     * Calcula el factor de balance de un nodo (altura izquierda - altura derecha)
     * @param {Node} node - Nodo del árbol
     * @returns {number} Factor de balance
     */
    getBalance(node) {
        return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
    }

    /**
     * Actualiza la altura y el factor de balance de un nodo
     * @param {Node} node - Nodo a actualizar
     */
    update(node) {
        node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
        node.factor = this.getBalance(node);
    }

    /**
     * Realiza una rotación derecha (Right Rotation - RR)
     * Corrige desbalance LL
     * @param {Node} y - Nodo desbalanceado
     * @returns {Node} Nueva raíz de la subestructura
     */
    rotateRight(y) {
        let x = y.left;
        let T2 = x.right;

        x.right = y;
        y.left = T2;

        this.update(y);
        this.update(x);

        return x;
    }

    /**
     * Realiza una rotación izquierda (Left Rotation - LL)
     * Corrige desbalance RR
     * @param {Node} x - Nodo desbalanceado
     * @returns {Node} Nueva raíz de la subestructura
     */
    rotateLeft(x) {
        let y = x.right;
        let T2 = y.left;

        y.left = x;
        x.right = T2;

        this.update(x);
        this.update(y);

        return y;
    }

    /**
     * Inserta un valor en el árbol AVL de forma recursiva
     * Aplica rotaciones automáticamente para mantener el balance
     * @param {Node} node - Nodo actual en la recursión
     * @param {Object} data - Datos del vuelo a insertar
     * @returns {Node} Nodo resultante después de la inserción
     */
    insert(node, data) {
        if (!node) {
            // Inicializar precios y profit
            data.precioFinal = data.precioBase;
            data.profit = data.precioFinal * data.pasajeros;
            return new Node(data);
        }

        if (data.codigoNumerico < node.data.codigoNumerico)
            node.left = this.insert(node.left, data);
        else if (data.codigoNumerico > node.data.codigoNumerico)
            node.right = this.insert(node.right, data);
        else
            return node;

        this.update(node);

        // Si está en modo estrés → NO balancear
        if (this.stressMode) {
            return node;
        }

        // Si NO está en estrés → balancear
        return this.rebalance(node);
    }

    /**
     * Método público para insertar un valor en el árbol AVL
     * @param {Object} data - Datos del vuelo a insertar
     */
    insertValue(data) {
        this.root = this.insert(this.root, data);
    }

    // Buscar el nodo con valor mínimo
    minValueNode(node) {
        let current = node;
        while (current.left)
            current = current.left;
        return current;
    }

    // Eliminar nodo AVL
    delete(node, codigoNumerico) {
        if (!node) return node;

        if (codigoNumerico < node.data.codigoNumerico) {
            node.left = this.delete(node.left, codigoNumerico);
        } else if (codigoNumerico > node.data.codigoNumerico) {
            node.right = this.delete(node.right, codigoNumerico);
        } else {
            // Nodo con un hijo o sin hijos
            if (!node.left || !node.right) {
                let temp = node.left ? node.left : node.right;

                if (!temp) {
                    node = null;
                } else {
                    node = temp;
                }
            } else {
                // Nodo con dos hijos
                let temp = this.minValueNode(node.right);
                node.data = temp.data;
                node.right = this.delete(node.right, temp.data.codigoNumerico);
            }
        }

        if (!node) return node;

        this.update(node);

        if (this.stressMode) return node;

        let balance = this.getBalance(node);

        // LL
        if (balance > 1 && this.getBalance(node.left) >= 0) {
            this.rotations.push("LL");
            return this.rotateRight(node);
        }

        // LR
        if (balance > 1 && this.getBalance(node.left) < 0) {
            this.rotations.push("LR");
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }

        // RR
        if (balance < -1 && this.getBalance(node.right) <= 0) {
            this.rotations.push("RR");
            return this.rotateLeft(node);
        }

        // RL
        if (balance < -1 && this.getBalance(node.right) > 0) {
            this.rotations.push("RL");
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }

        return node;
    }

    // Método público
    deleteValue(codigoNumerico) {
        this.root = this.delete(this.root, codigoNumerico);
    }

    deleteSubtree(node, codigoNumerico) {
        if (!node) return null;

        if (codigoNumerico < node.data.codigoNumerico) {
            node.left = this.deleteSubtree(node.left, codigoNumerico);
        } else if (codigoNumerico > node.data.codigoNumerico) {
            node.right = this.deleteSubtree(node.right, codigoNumerico);
        } else {
            // Encontró el nodo → eliminar todo el subárbol
            return null;
        }

        this.update(node);
        return this.rebalance(node);
    }

    cancelSubtree(codigoNumerico) {
        this.massiveDeletions++;
        this.root = this.deleteSubtree(this.root, codigoNumerico);
    }

    rebalanceTree(node) {
        if (!node) return null;

        node.left = this.rebalanceTree(node.left);
        node.right = this.rebalanceTree(node.right);

        this.update(node);
        return this.rebalance(node);
    }

    rebalanceAll() {
        this.root = this.rebalanceTree(this.root);
    }

    search(node, codigo) {
        if (!node) return null;

        if (codigo === node.data.codigoNumerico) return node;

        if (codigo < node.data.codigoNumerico)
            return this.search(node.left, codigo);
        else
            return this.search(node.right, codigo);
    }

    find(codigo) {
        return this.search(this.root, codigo);
    }

    rebalance(node) {
        let balance = this.getBalance(node);

        // LL
        if (balance > 1 && this.getBalance(node.left) >= 0) {
            this.rotations.push("LL");
            return this.rotateRight(node);
        }

        // RR
        if (balance < -1 && this.getBalance(node.right) <= 0) {
            this.rotations.push("RR");
            return this.rotateLeft(node);
        }

        // LR
        if (balance > 1 && this.getBalance(node.left) < 0) {
            this.rotations.push("LR");
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }

        // RL
        if (balance < -1 && this.getBalance(node.right) > 0) {
            this.rotations.push("RL");
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }

        return node;
    }

    inOrder(node, result = []) {
        if (node) {
            this.inOrder(node.left, result);
            result.push(node.data.codigoNumerico);
            this.inOrder(node.right, result);
        }
        return result;
    }

    preOrder(node, result = []) {
        if (node) {
            result.push(node.data.codigoNumerico);
            this.preOrder(node.left, result);
            this.preOrder(node.right, result);
        }
        return result;
    }

    postOrder(node, result = []) {
        if (node) {
            this.postOrder(node.left, result);
            this.postOrder(node.right, result);
            result.push(node.data.codigoNumerico);
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

    getDepth(node, codigo, depth = 0) {
        if (!node) return -1;

        if (codigo === node.data.codigoNumerico) return depth;

        if (codigo < node.data.codigoNumerico)
            return this.getDepth(node.left, codigo, depth + 1);
        else
            return this.getDepth(node.right, codigo, depth + 1);
    }

    countLeaves(node) {
        if (!node) return 0;
        if (!node.left && !node.right) return 1;
        return this.countLeaves(node.left) + this.countLeaves(node.right);
    }

    getTreeHeight() {
        return this.getHeight(this.root);
    }


}


export default AVL;