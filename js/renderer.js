/**
 * Clase Renderer - Maneja la visualización de árboles AVL y BST en canvas HTML5
 * Proporciona renderizado estático y animado con colores diferenciados
 * Incluye escalado dinámico y manejo de eventos de redimensionamiento
 */

class Renderer {
    /**
     * Constructor del Renderer
     * Inicializa canvas, contexto y configura eventos de redimensionamiento
     * @param {string} canvasId - ID del elemento canvas en el DOM
     */
    constructor(canvasId) {
        // Referencias a las raíces de los árboles para renderizado
        this.avlRoot = null;
        this.bstRoot = null;

        // Obtener y configurar el canvas
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        // Ajustar tamaño inicial del canvas
        this.resizeCanvas();

        // Evento para redimensionar canvas cuando cambia el tamaño de ventana
        window.addEventListener("resize", () => {
            this.resizeCanvas();

            // Re-renderizar si hay árboles cargados
            if (this.avlRoot || this.bstRoot) {
                this.render(this.avlRoot, this.bstRoot);
            }
        });

        // Configuración visual de nodos
        this.nodeRadius = 20; // Radio de los círculos de nodos
        this.levelHeight = 130; // Altura vertical entre niveles del árbol
    }

    /**
     * Limpia completamente el canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Calcula la altura máxima de un árbol (número de niveles)
     * @param {Object} node - Nodo raíz del árbol
     * @returns {number} Altura del árbol
     */
    getTreeHeight(node) {
        if (!node) return 0;
        return 1 + Math.max(
            this.getTreeHeight(node.left),
            this.getTreeHeight(node.right)
        );
    }

    /**
     * Dibuja un nodo individual en el canvas con colores según su estado
     * @param {number} x - Coordenada X del centro del nodo
     * @param {number} y - Coordenada Y del centro del nodo
     * @param {Object} node - Nodo a dibujar
     * @param {string} type - Tipo de árbol ("AVL" o "BST")
     */
    drawNode(x, y, node, type = "AVL") {
        const ctx = this.ctx;

        // Color según tipo de nodo
        let color;

        if (node.critico) {
            color = "#f59e0b"; // amarillo = crítico (penalización económica)
        } else if (Math.abs(node.factor || 0) > 1) {
            color = "#ef4444"; // rojo = desbalance AVL
        } else if (type === "AVL") {
            color = "#3b82f6"; // azul = AVL
        } else {
            color = "#22c55e"; // verde = BST
        }

        // Efecto de sombra para resaltar el nodo
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        // Dibujar círculo del nodo
        ctx.beginPath();
        ctx.arc(x, y, this.nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#fff"; // Borde blanco
        ctx.stroke();

        // Remover sombra para el texto
        ctx.shadowBlur = 0;

        // Dibujar texto del nodo (código, altura, factor)
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(node.data.codigo, x, y - 10);

        ctx.font = "10px Arial";
        ctx.fillText(`h:${node.height}`, x, y + 0);
        ctx.fillText(`f:${node.factor ?? 0}`, x, y + 10);
        ctx.fillText(`d:${node.depth}`, x, y + 20);
        ctx.fillText(`$${Math.round(node.data.profit)}`, x, y + 30);
    }

    /**
     * Dibuja una línea de conexión entre dos puntos
     * @param {number} x1 - Coordenada X inicial
     * @param {number} y1 - Coordenada Y inicial
     * @param {number} x2 - Coordenada X final
     * @param {number} y2 - Coordenada Y final
     */
    drawLine(x1, y1, x2, y2) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "#94a3b8"; // Color gris para las líneas
        ctx.stroke();
    }

    /**
     * Dibuja un árbol completo de forma recursiva
     * @param {Object} node - Nodo raíz del subárbol a dibujar
     * @param {number} x - Coordenada X del nodo actual
     * @param {number} y - Coordenada Y del nodo actual
     * @param {number} offset - Desplazamiento horizontal para hijos
     * @param {string} type - Tipo de árbol ("AVL" o "BST")
     */
    drawTree(node, x, y, offset, type) {
        if (!node) return;

        const ctx = this.ctx;

        // Calcular offset reducido para el siguiente nivel
        const nextOffset = offset * 0.7;

        // Dibujar línea y subárbol izquierdo
        if (node.left) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - offset, y + this.levelHeight);
            ctx.strokeStyle = "#aaa";
            ctx.stroke();

            this.drawTree(node.left, x - offset, y + this.levelHeight, nextOffset, type);
        }

        // Dibujar línea y subárbol derecho
        if (node.right) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + offset, y + this.levelHeight);
            ctx.strokeStyle = "#aaa";
            ctx.stroke();

            this.drawTree(node.right, x + offset, y + this.levelHeight, nextOffset, type);
        }

        // Dibujar el nodo actual
        this.drawNode(x, y, node, type);
    }

    /**
     * Renderiza ambos árboles (AVL y BST) lado a lado en el canvas
     * Ajusta dinámicamente la altura del canvas según el árbol más alto
     * @param {Object} avlRoot - Raíz del árbol AVL
     * @param {Object} bstRoot - Raíz del árbol BST
     */
    render(avlRoot, bstRoot) {
        // Calcular altura máxima entre ambos árboles
        const maxHeight = Math.max(
            this.getTreeHeight(avlRoot),
            this.getTreeHeight(bstRoot)
        );

        // 🔥 Ajustar altura dinámica del canvas
        this.canvas.height = Math.max(600, maxHeight * 140);
        this.clear();

        const width = this.canvas.width;

        // Dibujar títulos de los árboles
        this.ctx.fillStyle = "#3b82f6"; // Azul para AVL
        this.ctx.font = "bold 18px Arial";
        this.ctx.fillText("AVL", width / 4 - 20, 30);

        this.ctx.fillStyle = "#22c55e"; // Verde para BST
        this.ctx.fillText("BST", (width * 3) / 4 - 20, 30);

        // Renderizar árbol AVL (lado izquierdo)
        const avlHeight = this.getTreeHeight(avlRoot);
        const avlOffset = (width / 2.5) / (avlHeight + 1);
        this.drawTree(avlRoot, width / 4, 50, avlOffset, "AVL");

        // Renderizar árbol BST (lado derecho)
        const bstHeight = this.getTreeHeight(bstRoot);
        const bstOffset = (width / 2.5) / (bstHeight + 1);
        this.drawTree(bstRoot, (width * 3) / 4, 50, bstOffset, "BST");
        // Leyenda
        this.ctx.fillStyle = "#000";
        this.ctx.font = "12px Arial";

        this.ctx.fillText("Azul: AVL", 20, this.canvas.height - 80);
        this.ctx.fillText("Verde: BST", 20, this.canvas.height - 65);
        this.ctx.fillText("Rojo: Desbalance", 20, this.canvas.height - 50);
        this.ctx.fillText("Amarillo: Nodo crítico", 20, this.canvas.height - 35);
    }

    /**
     * Renderiza los árboles con animación de escalado
     * Crea un efecto de "aparición" gradual usando transformación de escala
     * @param {Object} avlRoot - Raíz del árbol AVL
     * @param {Object} bstRoot - Raíz del árbol BST
     */
    animate(avlRoot, bstRoot) {
        // Calcular altura máxima para ajustar canvas
        const maxHeight = Math.max(
            this.getTreeHeight(avlRoot),
            this.getTreeHeight(bstRoot)
        );

        this.canvas.height = Math.max(600, maxHeight * 140);

        // Guardar referencias para redimensionamiento
        this.avlRoot = avlRoot;
        this.bstRoot = bstRoot;

        // Renderizar versión final primero (para referencia)
        this.render(avlRoot, bstRoot);

        // Iniciar animación con escala 0
        let scale = 0;

        const width = this.canvas.width;

        /**
         * Función recursiva para frames de animación
         * Usa requestAnimationFrame para suavidad
         */
        const animateFrame = () => {
            this.clear();

            // Aplicar transformación de escala desde el centro
            this.ctx.save();
            this.ctx.translate(width / 2, 0);
            this.ctx.scale(scale, scale);
            this.ctx.translate(-width / 2, 0);

            // Calcular offsets para el frame actual
            const avlHeight = this.getTreeHeight(avlRoot);
            const bstHeight = this.getTreeHeight(bstRoot);

            const avlOffset = (width / 2.5) / (avlHeight + 1);
            const bstOffset = (width / 2.5) / (bstHeight + 1);

            // Dibujar árboles escalados
            this.drawTree(avlRoot, width / 4, 80, avlOffset, "AVL");
            this.drawTree(bstRoot, (width * 3) / 4, 80, bstOffset, "BST");

            this.ctx.restore();

            // Incrementar escala para siguiente frame
            scale += 0.05;

            // Continuar animación hasta escala completa
            if (scale < 1) {
                requestAnimationFrame(animateFrame);
            } else {
                // Renderizar versión final sin transformación
                this.render(avlRoot, bstRoot);
            }
        };

        // Iniciar la animación
        animateFrame();
    }

    /**
     * Ajusta el ancho del canvas al ancho de su contenedor
     * Se llama en constructor y en eventos de redimensionamiento
     */
    resizeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
    }

}

export default Renderer;

