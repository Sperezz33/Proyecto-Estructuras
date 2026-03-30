/**
 * Clase Node - Representa un nodo en los árboles AVL y BST
 * Contiene datos de vuelo y propiedades necesarias para el balanceo AVL
 * Estructura fundamental para la implementación de árboles binarios de búsqueda
 */

class Node {
    /**
     * Constructor de la clase Node
     * Inicializa un nodo con datos de vuelo y propiedades de árbol
     * @param {Object} data - Objeto que contiene información del vuelo
     * @param {string|number} data.codigo - Código identificador del vuelo
     * @param {string} data.origen - Ciudad/aeropuerto de origen
     * @param {string} data.destino - Ciudad/aeropuerto de destino
     * @param {number} data.precioBase - Precio base del vuelo
     * @param {number} data.pasajeros - Número de pasajeros
     */
    constructor(data) {
        // Datos del vuelo almacenados en el nodo
        this.data = data; // objeto vuelo con todas las propiedades

        // Punteros a nodos hijos (estructura de árbol binario)
        this.left = null; // Subárbol izquierdo (valores menores)
        this.right = null; // Subárbol derecho (valores mayores)

        // Propiedad de altura para balanceo AVL
        this.height = 1; // Altura del subárbol rooted en este nodo

        // Propiedades específicas del proyecto AVL
        this.factor = 0; // Factor de balance (altura izquierda - altura derecha)
        this.critico = false; // Flag para marcar nodos críticos en análisis
        this.depth = 0; // profundidad del nodo en el árbol
    }
}

export default Node;