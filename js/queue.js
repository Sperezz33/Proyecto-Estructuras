/**
 * queue.js
 *
 * Cola FIFO para simular inserciones en lote y procesar llegadas de vuelos
 * de forma secuencial. Mantiene el orden de petición de inserción.
 */

class Queue {
    constructor() {
        this.items = [];
    }

    /**
     * Agrega un elemento al final de la cola.
     *
     * @param {Object} item
     */
    enqueue(item) {
        this.items.push(item);
    }

    /**
     * Extrae el elemento al frente de la cola.
     *
     * @returns {Object|null}
     */
    dequeue() {
        if (this.isEmpty()) return null;
        return this.items.shift();
    }

    peek() {
        if (this.isEmpty()) return null;
        return this.items[0];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

    clear() {
        this.items = [];
    }

    /** Retorna todos los elementos sin modificar la cola */
    _getAll() {
        return [...this.items];
    }
}

// Queue disponible globalmente