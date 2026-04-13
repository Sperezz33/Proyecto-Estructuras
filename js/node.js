/**
 * node.js
 *
 * Representación de un nodo de vuelo en el árbol. Incluye campos de negocio
 * y propiedades de estructura necesarias para AVL/BST.
 */
/**
 * Clase Node — Representa un nodo en los árboles AVL y BST.
 *
 * Almacena la información del vuelo y datos de balanceo utilizados por AVL.
 */
class Node {
    /**
     * @param {Object} data - Objeto con información del vuelo
     */
    /**
     * @param {Object} data - Objeto con información del vuelo
     */
    constructor(data) {
        this.data = {
            codigo:        data.codigo        ?? null,
            codigoNumerico:data.codigoNumerico?? null,
            origen:        data.origen        ?? "",
            destino:       data.destino       ?? "",
            horaSalida:    data.horaSalida    ?? "",
            precioBase:    data.precioBase    ?? 0,
            precioFinal:   data.precioFinal   ?? data.precioBase ?? 0,
            pasajeros:     data.pasajeros     ?? 0,
            prioridad:     data.prioridad     ?? 1,
            promocion:     data.promocion     ?? false,
            alerta:        data.alerta        ?? false,
            profit:        data.profit        ?? 0,
            penalizacion:  data.penalizacion  ?? false
        };

        // Estructura del árbol
        this.left   = null;
        this.right  = null;
        this.height = 1;
        this.factor = 0;
        this.critico= false;
        this.depth  = 0;
    }
}

// Node es global