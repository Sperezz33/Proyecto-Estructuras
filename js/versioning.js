/**
 * VersionManager — Sistema de versionado persistente del árbol AVL/BST
 * Permite guardar snapshots con nombre y restaurarlos en cualquier momento
 * Las versiones sobreviven recargas de página gracias a localStorage
 */
class VersionManager {
    constructor() {
        this.versions = this._load();
    }

    /**
     * Guarda una nueva versión con el nombre dado
     * @param {string} name  - Nombre de la versión ("Simulación Alta Demanda")
     * @param {Object} avlRoot - Raíz del árbol AVL
     * @param {Object} bstRoot - Raíz del árbol BST
     * @param {Object} meta  - Metadatos opcionales (maxDepth, rotaciones, etc.)
     */
    save(name, avlRoot, bstRoot, meta = {}) {
        if (!name || name.trim() === "") {
            throw new Error("El nombre de la versión no puede estar vacío");
        }

        const version = {
            name:      name.trim(),
            timestamp: new Date().toISOString(),
            avl:       this._deepCopy(avlRoot),
            bst:       this._deepCopy(bstRoot),
            meta
        };

        // Si ya existe una versión con ese nombre, la sobreescribe
        const existingIdx = this.versions.findIndex(v => v.name === version.name);
        if (existingIdx !== -1) {
            this.versions[existingIdx] = version;
        } else {
            this.versions.push(version);
        }

        this._persist();
        return version;
    }

    /**
     * Restaura una versión por nombre o por índice (1-based)
     * @param {string|number} nameOrIndex
     * @returns {{avl, bst, meta}} o null si no existe
     */
    restore(nameOrIndex) {
        let v;
        if (typeof nameOrIndex === "number") {
            v = this.versions[nameOrIndex - 1];
        } else {
            v = this.versions.find(ver => ver.name === nameOrIndex);
        }
        if (!v) return null;
        return {
            avl:  this._deepCopy(v.avl),
            bst:  this._deepCopy(v.bst),
            meta: { ...v.meta }
        };
    }

    /**
     * Elimina una versión por nombre
     */
    remove(name) {
        this.versions = this.versions.filter(v => v.name !== name);
        this._persist();
    }

    /**
     * Retorna lista resumida de versiones disponibles
     */
    list() {
        return this.versions.map((v, i) => ({
            index:     i + 1,
            name:      v.name,
            timestamp: v.timestamp
        }));
    }

    /**
     * Exporta todas las versiones a un archivo JSON descargable
     */
    exportAll() {
        const blob = new Blob(
            [JSON.stringify({ skybalance_versions: this.versions }, null, 2)],
            { type: "application/json" }
        );
        const url = URL.createObjectURL(blob);
        const a   = document.createElement("a");
        a.href     = url;
        a.download = `skybalance_versiones_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Importa versiones desde un objeto JSON
     */
    importAll(json) {
        if (!json.skybalance_versions) throw new Error("Formato de versiones inválido");
        this.versions = json.skybalance_versions;
        this._persist();
    }

    // ─── Persistencia localStorage ────────────────────────────────────────────

    _persist() {
        try {
            localStorage.setItem("skybalance_versions", JSON.stringify(this.versions));
        } catch (e) {
            console.warn("No se pudo persistir versiones en localStorage:", e);
        }
    }

    _load() {
        try {
            const raw = localStorage.getItem("skybalance_versions");
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    _deepCopy(obj) {
        if (obj === null || obj === undefined) return null;
        return JSON.parse(JSON.stringify(obj));
    }
}

// VersionManager disponible globalmente
