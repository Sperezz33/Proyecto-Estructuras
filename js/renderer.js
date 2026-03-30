/**
 * Renderer — Dibuja los árboles AVL y BST en un canvas HTML5
 * Soporta árboles grandes con escalado dinámico y colores según estado del nodo
 */

class Renderer {
    constructor(canvasId) {
        this.canvas   = document.getElementById(canvasId);
        this.ctx      = this.canvas.getContext("2d");
        this.avlRoot  = null;
        this.bstRoot  = null;

        // Parámetros visuales
        this.nodeRadius  = 22;
        this.levelHeight = 80;
        this.hPad        = 32;

        this._resizeCanvas();
        window.addEventListener("resize", () => {
            this._resizeCanvas();
            if (this.avlRoot || this.bstRoot) this.render(this.avlRoot, this.bstRoot);
        });
    }

    // ─── Tamaño del canvas ────────────────────────────────────────────────────

    _resizeCanvas() {
        this.canvas.width = this.canvas.parentElement?.clientWidth || 800;
    }

    // ─── Utilidades de árbol ──────────────────────────────────────────────────

    _getHeight(node) {
        if (!node) return 0;
        return 1 + Math.max(this._getHeight(node.left), this._getHeight(node.right));
    }

    _countNodes(node) {
        if (!node) return 0;
        return 1 + this._countNodes(node.left) + this._countNodes(node.right);
    }

    // ─── Color de nodo según estado ───────────────────────────────────────────

    _nodeColor(node, type) {
        if (node.critico)                    return { fill: "#f59e0b", glow: "rgba(245,158,11,.5)"  }; // ámbar = crítico
        if (Math.abs(node.factor ?? 0) > 1)  return { fill: "#ef4444", glow: "rgba(239,68,68,.5)"   }; // rojo  = desbalance
        if (node.data?.alerta)               return { fill: "#a855f7", glow: "rgba(168,85,247,.5)"  }; // morado= alerta
        if (type === "AVL")                  return { fill: "#4f8ef7", glow: "rgba(79,142,247,.4)"  }; // azul  = AVL normal
        return                                      { fill: "#22d3a0", glow: "rgba(34,211,160,.4)"  }; // verde = BST
    }

    // ─── Dibujo de un nodo ────────────────────────────────────────────────────

    _drawNode(x, y, node, type) {
        const ctx = this.ctx;
        const { fill, glow } = this._nodeColor(node, type);
        const r = this.nodeRadius;

        // Sombra / glow
        ctx.shadowColor = glow;
        ctx.shadowBlur  = 18;

        // Círculo principal
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        // Borde
        ctx.shadowBlur   = 0;
        ctx.strokeStyle  = "rgba(255,255,255,.25)";
        ctx.lineWidth    = 1.5;
        ctx.stroke();

        // ── Texto ──
        ctx.fillStyle    = "#ffffff";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";

        // Código (negrita, encima del centro)
        ctx.font = `bold ${Math.min(11, r * 0.5)}px "JetBrains Mono",monospace`;
        ctx.fillText(String(node.data.codigo).substring(0, 6), x, y - 9);

        // Altura y factor
        ctx.font        = `${Math.min(9, r * 0.4)}px "JetBrains Mono",monospace`;
        ctx.fillStyle   = "rgba(255,255,255,.75)";
        ctx.fillText(`h:${node.height} f:${node.factor ?? 0}`, x, y + 2);

        // Profit
        const profit = node.data.profit ?? 0;
        ctx.fillText(`$${Math.round(profit / 1000)}k`, x, y + 12);

        ctx.shadowBlur = 0;
    }

    // ─── Dibujo recursivo del árbol ───────────────────────────────────────────

    /**
     * @param {Object} node   - Nodo actual
     * @param {number} x      - X del nodo
     * @param {number} y      - Y del nodo
     * @param {number} offset - Desplazamiento horizontal para hijos
     * @param {string} type   - "AVL" | "BST"
     */
    _drawTree(node, x, y, offset, type) {
        if (!node) return;

        const ctx        = this.ctx;
        const nextOffset = Math.max(this.nodeRadius * 2.2, offset * 0.62);
        const childY     = y + this.levelHeight;

        // Línea al hijo izquierdo
        if (node.left) {
            ctx.beginPath();
            ctx.moveTo(x, y + this.nodeRadius);
            ctx.lineTo(x - offset, childY - this.nodeRadius);
            ctx.strokeStyle = "rgba(148,163,184,.35)";
            ctx.lineWidth   = 1.2;
            ctx.stroke();
            this._drawTree(node.left, x - offset, childY, nextOffset, type);
        }

        // Línea al hijo derecho
        if (node.right) {
            ctx.beginPath();
            ctx.moveTo(x, y + this.nodeRadius);
            ctx.lineTo(x + offset, childY - this.nodeRadius);
            ctx.strokeStyle = "rgba(148,163,184,.35)";
            ctx.lineWidth   = 1.2;
            ctx.stroke();
            this._drawTree(node.right, x + offset, childY, nextOffset, type);
        }

        // Dibujar nodo encima de las líneas
        this._drawNode(x, y, node, type);
    }

    // ─── Calcular ancho necesario para el árbol ───────────────────────────────

    _calcRequiredWidth(h) {
        return Math.max(300, Math.pow(2, h) * (this.nodeRadius * 2 + 6));
    }

    // ─── Render principal ─────────────────────────────────────────────────────

    render(avlRoot, bstRoot) {
        this.avlRoot = avlRoot;
        this.bstRoot = bstRoot;

        const avlH = this._getHeight(avlRoot);
        const bstH = this._getHeight(bstRoot);
        const maxH = Math.max(avlH, bstH, 1);

        // Ajustar alto del canvas según profundidad
        const neededH = Math.max(500, maxH * (this.levelHeight + 10) + 80);
        this.canvas.height = neededH;

        const ctx   = this.ctx;
        const W     = this.canvas.width;

        // Fondo degradado
        const bg = ctx.createLinearGradient(0, 0, 0, neededH);
        bg.addColorStop(0, "#141d35");
        bg.addColorStop(1, "#0a0e1a");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, neededH);

        // Separador central
        ctx.beginPath();
        ctx.moveTo(W / 2, 40);
        ctx.lineTo(W / 2, neededH - 20);
        ctx.strokeStyle = "rgba(255,255,255,.05)";
        ctx.lineWidth   = 1;
        ctx.stroke();

        // Etiquetas de título
        this._drawTitle("AVL", W / 4,     20, "#4f8ef7");
        this._drawTitle("BST", W * 3 / 4, 20, "#22d3a0");

        // Calcular offsets basados en el ancho disponible
        const halfW   = W / 2 - this.hPad;
        const avlOff  = halfW / (avlH + 1);
        const bstOff  = halfW / (bstH + 1);

        // Dibujar árboles
        this._drawTree(avlRoot, W / 4,     60, avlOff, "AVL");
        this._drawTree(bstRoot, W * 3 / 4, 60, bstOff, "BST");
    }

    _drawTitle(text, x, y, color) {
        const ctx = this.ctx;
        ctx.font         = "bold 14px Inter,sans-serif";
        ctx.fillStyle    = color;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor  = color;
        ctx.shadowBlur   = 12;
        ctx.fillText(text, x, y);
        ctx.shadowBlur   = 0;
    }

    // ─── Animate (con efecto fade-in alpha) ───────────────────────────────────

    animate(avlRoot, bstRoot) {
        this.avlRoot = avlRoot;
        this.bstRoot = bstRoot;
        this._resizeCanvas();

        let alpha = 0;
        const draw = () => {
            this.render(avlRoot, bstRoot);
            // Overlay oscuro que desvanece
            if (alpha < 1) {
                this.ctx.fillStyle = `rgba(10,14,26,${1 - alpha})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                alpha += 0.12;
                requestAnimationFrame(draw);
            }
        };
        requestAnimationFrame(draw);
    }
}

// Renderer disponible globalmente
