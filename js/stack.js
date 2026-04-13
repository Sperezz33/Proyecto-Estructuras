/**
 * stack.js
 *
 * Pila simple para la funcionalidad de deshacer. Guarda snapshots completos
 * del estado de los árboles como cadenas JSON.
 */

class Stack {
    constructor() {
        this.items = [];
    }

    push(item) {
        this.items.push(JSON.stringify(item)); // Guardamos copia
    }

    pop() {
        if (this.isEmpty()) return null;
        return JSON.parse(this.items.pop());
    }

    peek() {
        if (this.isEmpty()) return null;
        return JSON.parse(this.items[this.items.length - 1]);
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
}

// Stack disponible globalmente