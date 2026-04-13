# SkyBalance AVL — Documentación Técnica

## 1. Introducción técnica

SkyBalance AVL es un sistema de gestión de vuelos desarrollado en HTML, CSS y JavaScript. El núcleo del proyecto es un Árbol AVL que administra vuelos como nodos ordenados por un código numérico derivado de `codigo`.

El propósito académico del proyecto es demostrar cómo un árbol autoequilibrado mantiene eficiencia en inserción, eliminación y búsqueda, y cómo puede integrarse con métricas de rentabilidad, simulación de concurrencia, persistencia en JSON y versionado.

## 2. Arquitectura general

El sistema está organizado en módulos JavaScript independientes que se integran desde `index.html`. Los componentes principales son:

- `js/node.js`: definición de `Node`, la unidad de datos para AVL y BST.
- `js/avl.js`: implementación completa del AVL con rotaciones y rebalanceo.
- `js/bst.js`: implementación de un BST sin balanceo para comparación.
- `js/app.js`: lógica de la aplicación, UI y casos de uso.
- `js/metrics.js`: métricas, recorridos, auditoría y lógica de rentabilidad.
- `js/versioning.js`: sistema de guardado/restauración de versiones con `localStorage`.
- `js/queue.js`: simulación de cola FIFO para inserciones concurrentes.
- `js/renderer.js`: representación visual de AVL y BST en un `canvas`.
- `js/stack.js`: pila para funcionalidad de deshacer (undo).

### 2.1 Flujo de interacción

`index.html` expone controles para:

- cargar JSON en modo `INSERCION` o `TOPOLOGIA`
- insertar y modificar vuelos manualmente
- buscar vuelos
- activar/desactivar modo estrés
- rebalancear globalmente
- gestionar versiones
- procesar cola de inserciones
- exportar árbol a JSON

El árbol AVL se renderiza junto con un BST paralelo para comparar eficiencia estructural.

## 3. Modelo de datos (estructura del nodo AVL)

La clase `Node` en `js/node.js` encapsula los datos de vuelo y el estado del árbol:

```js
class Node {
    constructor(data) {
        this.data = {
            codigo: data.codigo ?? null,
            codigoNumerico: data.codigoNumerico ?? null,
            origen: data.origen ?? "",
            destino: data.destino ?? "",
            horaSalida: data.horaSalida ?? "",
            precioBase: data.precioBase ?? 0,
            precioFinal: data.precioFinal ?? data.precioBase ?? 0,
            pasajeros: data.pasajeros ?? 0,
            prioridad: data.prioridad ?? 1,
            promocion: data.promocion ?? false,
            alerta: data.alerta ?? false,
            profit: data.profit ?? 0,
            penalizacion: data.penalizacion ?? false
        };

        this.left = null;
        this.right = null;
        this.height = 1;
        this.factor = 0;
        this.critico = false;
        this.depth = 0;
    }
}
```

### 3.1 Campos relevantes

- `data.codigoNumerico`: clave de ordenación del árbol.
- `height`: altura del subárbol para balanceo AVL.
- `factor`: factor de equilibrio (balance factor).
- `critico`: marca si el nodo excede la profundidad límite.
- `depth`: profundidad calculada durante la aplicación de penalizaciones.

## 4. Implementación del Árbol AVL

El módulo `js/avl.js` contiene la lógica AVL central.

### 4.1 Inicialización

El constructor de `AVL` mantiene:

- `root`: raíz del árbol.
- `rotations`: historial de tipos de rotación.
- `stressMode`: bandera que pospone el rebalanceo.
- `massiveDeletions`: contador de cancelaciones masivas.
- `rotationsBeforeRebalance`: medición de costo al rebalancear globalmente.

### 4.2 Cálculo de altura y balance

```js
getHeight(node) { return node ? node.height : 0; }

getBalance(node) {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
}

update(node) {
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    node.factor = this.getBalance(node);
}
```

La actualización es esencial después de cada inserción, eliminación o rotación.

### 4.3 Rotaciones

Las rotaciones se implementan de forma explícita:

- `rotateRight(y)` para `LL`
- `rotateLeft(x)` para `RR`

```js
rotateRight(y) {
    let x = y.left;
    let T2 = x.right;
    x.right = y;
    y.left = T2;
    this.update(y);
    this.update(x);
    return x;
}

rotateLeft(x) {
    let y = x.right;
    let T2 = y.left;
    y.left = x;
    x.right = T2;
    this.update(x);
    this.update(y);
    return y;
}
```

### 4.4 Rebalanceo local

La función `rebalance(node)` identifica los cuatro casos AVL:

```js
rebalance(node) {
    const balance = this.getBalance(node);

    if (balance > 1 && this.getBalance(node.left) >= 0) {
        this.rotations.push("LL");
        return this.rotateRight(node);
    }
    if (balance > 1 && this.getBalance(node.left) < 0) {
        this.rotations.push("LR");
        node.left = this.rotateLeft(node.left);
        return this.rotateRight(node);
    }
    if (balance < -1 && this.getBalance(node.right) <= 0) {
        this.rotations.push("RR");
        return this.rotateLeft(node);
    }
    if (balance < -1 && this.getBalance(node.right) > 0) {
        this.rotations.push("RL");
        node.right = this.rotateRight(node.right);
        return this.rotateLeft(node);
    }

    return node;
}
```

Esta lógica garantiza que, tras cada operación, el subárbol analizado recupera la propiedad AVL cuando no está en modo estrés.

## 5. Operaciones principales

### 5.1 Inserción

La inserción recursiva utiliza `codigoNumerico` como clave.

```js
insert(node, data) {
    if (!node) {
        const precioFinal = data.precioFinal ?? data.precioBase;
        data.precioFinal = precioFinal;
        data.profit = this._calcProfit(data);
        return new Node(data);
    }
    if (data.codigoNumerico < node.data.codigoNumerico)
        node.left = this.insert(node.left, data);
    else if (data.codigoNumerico > node.data.codigoNumerico)
        node.right = this.insert(node.right, data);
    else
        return node;

    this.update(node);
    return this.stressMode ? node : this.rebalance(node);
}

insertValue(data) {
    this.root = this.insert(this.root, data);
}
```

En el caso de duplicados exactos sólo se ignora la inserción.

### 5.2 Eliminación

La eliminación sigue el patrón clásico de BST con reemplazo del sucesor mínimo.

```js
delete(node, codigoNumerico) {
    if (!node) return null;
    if (codigoNumerico < node.data.codigoNumerico) node.left = this.delete(node.left, codigoNumerico);
    else if (codigoNumerico > node.data.codigoNumerico) node.right = this.delete(node.right, codigoNumerico);
    else {
        if (!node.left || !node.right) {
            node = node.left ?? node.right ?? null;
        } else {
            const temp = this.minValueNode(node.right);
            node.data = { ...temp.data };
            node.right = this.delete(node.right, temp.data.codigoNumerico);
        }
    }
    if (!node) return null;
    this.update(node);
    return this.stressMode ? node : this.rebalance(node);
}
```

### 5.3 Cancelación masiva de subárbol

SkyBalance incorpora una operación específica para eliminar toda una rama de vuelos:

```js
_cancelSubtree(node, codigoNumerico) {
    if (!node) return null;
    if (codigoNumerico < node.data.codigoNumerico) node.left = this._deleteSubtree(node.left, codigoNumerico);
    else if (codigoNumerico > node.data.codigoNumerico) node.right = this._deleteSubtree(node.right, codigoNumerico);
    else return null;
    this.update(node);
    return this.stressMode ? node : this.rebalance(node);
}
```

La función `cancelSubtree` incrementa `massiveDeletions` y elimina todo el subárbol de la raíz indicada.

### 5.4 Rebalanceo global

Cuando el árbol está en `stressMode`, las operaciones no aplican rotaciones inmediatamente. Para recuperar la propiedad AVL se usa `rebalanceAll()`:

```js
_rebalanceTree(node) {
    if (!node) return null;
    node.left = this._rebalanceTree(node.left);
    node.right = this._rebalanceTree(node.right);
    this.update(node);
    return this.rebalance(node);
}

rebalanceAll() {
    const rotBefore = this.rotations.length;
    this.root = this._rebalanceTree(this.root);
    this.rotationsBeforeRebalance = this.rotations.length - rotBefore;
}
```

Esta operación recorre el árbol en postorden y aplica rotaciones para restaurar el equilibrio de todos los nodos.

### 5.5 Búsqueda

La búsqueda binaria es estándar:

```js
_search(node, codigoNumerico) {
    if (!node) return null;
    if (codigoNumerico === node.data.codigoNumerico) return node;
    if (codigoNumerico < node.data.codigoNumerico) return this._search(node.left, codigoNumerico);
    return this._search(node.right, codigoNumerico);
}

find(codigoNumerico) {
    return this._search(this.root, codigoNumerico);
}
```

## 6. Persistencia en JSON

El proyecto soporta dos modos principales de carga de JSON:

### 6.1 Modo `INSERCION`

Cargado por `handleInsertionMode(json)` en `js/app.js`.

- Se reinician `avl.root`, `bst.root` y el historial de rotaciones.
- Cada vuelo del arreglo `json.vuelos` se inserta en AVL y BST.
- Se calcula `codigoNumerico` desde `codigo` usando `parseCodigo`.

Ejemplo de `data/ModoInsercion.json`:

```json
{
  "tipo": "INSERCION",
  "ordenamiento": "codigo",
  "vuelos": [
    {"codigo":"SB400","origen":"Medellin","destino":"Cartagena","horaSalida":"10:00","precioBase":400,"pasajeros":120,"prioridad":2,"promocion":false,"alerta":false},
    ...
  ]
}
```

### 6.2 Modo `TOPOLOGIA`

Cargado por `handleTopologyMode(json)` en `js/app.js`.

- Reconstruye el árbol respetando la topología descrita en el JSON.
- Usa campos como `altura`, `factorEquilibrio`, `izquierdo` y `derecho` para restaurar la estructura.
- Convierte cada nodo del JSON en la estructura interna esperada por el renderer y las métricas.

El archivo `data/ModoTopologia.json` muestra un JSON con nodos anidados que contienen `codigo`, `origen`, `destino`, `altura`, `factorEquilibrio`, `izquierdo` y `derecho`.

### 6.3 Exportación del árbol

SkyBalance exporta el árbol AVL completo con metadatos:

```js
const payload = {
    exportado: new Date().toISOString(),
    maxDepth: maxDepthAllowed,
    totalRotaciones: avl.rotations.length,
    rotaciones: avl.rotations,
    raiz: serializeNode(avl.root)
};
```

El `serializeNode` preserve campos como `codigo`, `precioFinal`, `profit`, `altura`, `factorEquilibrio`, `profundidad`, `critico` y referencias a `izquierdo`/`derecho`.

## 7. Simulación de concurrencia con colas

La clase `Queue` en `js/queue.js` implementa un FIFO simple:

```js
class Queue {
    constructor() { this.items = []; }
    enqueue(item) { this.items.push(item); }
    dequeue() { return this.isEmpty() ? null : this.items.shift(); }
    isEmpty() { return this.items.length === 0; }
    size() { return this.items.length; }
    _getAll() { return [...this.items]; }
}
```

### 7.1 Flujo de cola

- `addToQueueBtn`: agrega vuelos a la cola con datos básicos.
- `loadQueueBtn`: carga un JSON de vuelos y agrega todos los elementos a la cola.
- `processQueueBtn`: procesa la cola de forma secuencial con un retraso de 800 ms entre operaciones.

Durante el procesamiento:

- cada vuelo se inserta en AVL y BST,
- se recalculan penalizaciones por profundidad,
- se actualizan métricas y visualizaciones.

Esto simula un entorno donde múltiples solicitudes de inserción llegan en secuencia.

## 8. Sistema de versionado

El módulo `js/versioning.js` implementa un gestor de versiones persistente con `localStorage`.

### 8.1 Funcionalidad

- `save(name, avlRoot, bstRoot, meta)`: guarda un snapshot con nombre y metadatos.
- `restore(nameOrIndex)`: restaura una versión por nombre o índice.
- `remove(name)`: elimina versiones.
- `list()`: lista versiones disponibles.
- `exportAll()`: exporta versiones a JSON descargable.
- `importAll(json)`: importa versiones desde JSON.

### 8.2 Persistencia

El estado se guarda en `localStorage` bajo la clave `skybalance_versions`.

### 8.3 Integración UI

El UI permite:

- crear versiones con un nombre descriptivo,
- restaurarlas conservando raíz, árbol BST y metadatos como `maxDepthAllowed`,
- eliminar versiones y exportar todas.

## 9. Métricas y análisis

El módulo `js/metrics.js` provee funciones de evaluación estructural y de negocio.

### 9.1 Métricas estructurales

- `getHeight(node)`: altura de árbol.
- `countNodes(node)`: cantidad total de nodos.
- `countLeaves(node)`: cantidad de hojas.
- `BFS`, `DFS_InOrder`, `DFS_PreOrder`, `DFS_PostOrder`: recorridos de ancho y profundidad.

### 9.2 Auditoría AVL

`auditAVL(node)` valida dos propiedades en cada nodo:

- factor de equilibrio: `-1 <= balance <= 1`
- altura consistente con hijos:

```js
const expectedH = 1 + Math.max(lh, rh);
if (node.height !== expectedH) { ... }
```

### 9.3 Rentabilidad y negocio

La función `calcRentabilidad(node)` aplica la lógica de negocio:

```js
const ingresos = (d.pasajeros ?? 0) * (d.precioFinal ?? d.precioBase ?? 0);
const promocion = getPromotionDiscount(d);
const penaliz = node.critico ? (d.precioBase ?? 0) * (d.pasajeros ?? 0) * 0.25 : 0;
return ingresos - promocion + penaliz;
```

También existen funciones auxiliares:

- `getMaxProfit(node)` y `getMinProfit(root)`
- `getAverageProfit(node)`
- `getTopN(node, n)`
- `getTotalProfit(node)`
- `countCriticalNodes(node)`

Estas métricas se reflejan en el panel derecho de la interfaz.

## 10. Modo estrés y rebalanceo global

SkyBalance ofrece un `Modo Estrés` que impide el rebalanceo automático. Esta característica permite observar degradación estructural y luego restaurar el equilibrio manualmente.

### 10.1 Comportamiento en modo estrés

Cuando `avl.stressMode = true`, las inserciones y eliminaciones ya no llaman a `rebalance(node)` tras `update(node)`. El árbol puede desbalancearse y acumular factores de equilibrio fuera de rango.

### 10.2 Rebalanceo diferido

La acción `rebalanceAll()` aplica rotaciones en todo el árbol y registra el costo adicional en `rotationsBeforeRebalance`.

### 10.3 Auditoría en modo estrés

El botón de auditoría está habilitado sólo en modo estrés, lo que permite visualizar inconsistencias detectadas por `auditAVL`.

## 11. Auditoría AVL

El sistema incluye un panel de auditoría que reporta:

- nodos con `DESBALANCE`
- nodos con altura incorrecta
- número total de inconsistencias

La auditoría usa `auditAVL(avl.root)` y presenta un reporte con las rutas afectadas.

## 12. Lógica de negocio

### 12.1 Cálculo de rentabilidad

El cálculo de rentabilidad combina ingresos, descuentos y penalizaciones críticas.

### 12.2 Promociones

`getPromotionDiscount(data)` aplica una reducción:

- si `promocion` es `true`, se aplica un 10% sobre los ingresos.
- si `promocion` es un número, se toma ese valor.

### 12.3 Penalización por profundidad

La función `applyDepthPenalty(node, depth)` marca un nodo como crítico si su `depth` excede `maxDepthAllowed`.

```js
if (depth > maxDepthAllowed) {
    node.critico = true;
    node.data.precioFinal = node.data.precioBase * 1.25;
    node.data.penalizacion = true;
} else {
    node.critico = false;
    node.data.precioFinal = node.data.precioBase;
    node.data.penalizacion = false;
}
node.data.profit = calcRentabilidad(node);
```

Esto simula impacto económico de vuelos demasiado profundos en la topología del árbol.

### 12.4 Eliminación por rentabilidad

La operación `deleteMinBtn` busca el nodo menos rentable y elimina su rama completa.

```js
const minNode = getMinProfit(avl.root);
if (minNode) avl.cancelSubtree(minNode.data.codigoNumerico);
```

Esta decisión técnica ilustra la gestión de recursos en un contexto de optimización de rentabilidad.

## 13. Justificación del uso de AVL vs otras estructuras

### 13.1 Ventaja del AVL en SkyBalance

SkyBalance trabaja con cargas dinámicas de vuelos y requiere balance estructural consistente. El árbol AVL ofrece:

- búsquedas en tiempo `O(log n)` garantizadas,
- inserciones y eliminaciones en `O(log n)` con rebalanceo,
- estructura simétrica para métricas de profundidad y recorridos.

Dado que el sistema compara `AVL` con un `BST` sin balanceo, se evidencia cómo el AVL mantiene mejor la altura en entradas desordenadas.

### 13.2 Comparación con BST

El BST en `js/bst.js` replica las mismas operaciones sin rotaciones. Esto permite comparar directamente:

- altura de árbol
- número de hojas
- tiempo de búsqueda teórico
- comportamiento en cargas adversas

En un BST puro, la altura puede degradarse hasta `O(n)` en entradas ordenadas, mientras que el AVL conserva `O(log n)`.

### 13.3 Por qué no otros árboles

Aunque otras estructuras como `Red-Black Tree` o `B-tree` son válidas, el proyecto eligió AVL por:

- claridad académica de sus cuatro casos de rotación,
- necesidad de balanceo estricto para la demostración,
- facilidad para mostrar rotaciones específicas (`LL`, `RR`, `LR`, `RL`).

## 14. Complejidad algorítmica

### 14.1 AVL

- Inserción: `O(log n)` promedio y peor caso.
- Eliminación: `O(log n)` promedio y peor caso.
- Búsqueda: `O(log n)`.
- Rebalanceo global: `O(n)` debido al recorrido postorden completo.

### 14.2 BST (comparativa)

- Inserción: `O(h)` donde `h` es la altura actual del árbol. En el peor caso `O(n)`.
- Eliminación: `O(h)`.
- Búsqueda: `O(h)`.

### 14.3 Métricas y auditoría

Las funciones de recorrido y auditoría son `O(n)` porque visitan todos los nodos.

### 14.4 Cola de inserciones

El procesamiento de la cola es `O(k log n)` para `k` vuelos insertados, con actualizaciones intermedias de métricas y renderizado.

## 15. Posibles limitaciones del sistema

- `localStorage` tiene límite de tamaño, por lo que el versionado masivo puede saturar la persistencia.
- La exportación/importación JSON no valida esquemas estrictos, por lo que datos mal formados pueden fallar en tiempo de ejecución.
- `parseCodigo` extrae solo dígitos, lo que puede colapsar códigos diferentes con la misma representación numérica.
- El modo estrés permite que el árbol se desbalancee y genere nodos críticos; esto es intencional, pero puede ser confuso si no se rebalancea.
- `BST` no balanceado es sólo una referencia comparativa; no está pensado para producción.
- No existe manejo explícito de índices de versión concurrentes en `VersionManager`.

## 16. Observaciones de diseño

- El sistema conserva un AVL y un BST en paralelo para análisis estructural.
- El diseño global separa claramente la lógica de datos (`avl.js`, `bst.js`) de la UI (`app.js`) y de la visualización (`renderer.js`).
- La lógica de rentabilidad está externalizada en `metrics.js`, permitiendo evaluar decisiones de negocio sin acoplarla al árbol.
- El `Stack` para undo guarda copias profundas de los estados de árbol, lo que facilita revertir cambios.

## 17. Conclusión

SkyBalance AVL combina una implementación didáctica de AVL con funcionalidades reales de gestión de vuelos: persistencia, versionado, auditoría y métricas. La elección del árbol AVL se justifica porque asegura balance estructural en escenarios de inserción y eliminación dinámica, lo que es fundamental para un sistema que requiere respuestas predecibles y eficiencia en operaciones de búsqueda.

Este documento está preparado en Markdown para uso en VS Code y exportación a PDF.
