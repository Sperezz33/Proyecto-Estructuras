# Guión para Videotutorial: SkyBalance AVL

Este documento sirve como guía paso a paso para grabar el videotutorial de tu proyecto **SkyBalance AVL**. La estructura está diseñada para mantener la pantalla dividida (o alternando) entre la **Interfaz Gráfica (UI)** y explicaciones clave del **Código fuente**, mientras vas narrando.

---

## ⏱️ Estructura del Video (Aprox. 5 - 8 minutos)

1. **Introducción (1 min)** - Presentación del proyecto y su propósito.
2. **Estructura del Proyecto y Código Base (1 min)** - Explicación rápida de cómo está construido.
3. **Demostración Práctica: Inserción y Comparación (2 min)** - Uso real del sistema mostrando AVL vs BST.
4. **Operaciones Avanzadas: Búsqueda, Modificación, Eliminación y Cola (1 min)** - Gestión de vuelos y procesamiento en lote.
5. **Métricas, Análisis y Versionado (1.5 min)** - Panel de métricas, rentabilidad y guardado de histórico.
6. **Despedida (0.5 min)** - Cierre del video.

---

## 🎬 Guión Detallado (Audiovisual)

### 1. Introducción
| 👁️ Lo que se muestra en pantalla | 🗣️ Lo que vas a decir (Guion hablado) |
| --- | --- |
| **Plano principal:** Tu rostro (opcional) o la pantalla inicial de SkyBalance AVL limpia, sin datos cargados. Moviendo el cursor por el título y los paneles. | "Hola a todos, mi nombre es [Tu Nombre] y hoy les presento **SkyBalance AVL**, un sistema de gestión aérea inteligente desarrollado para el curso de Estructura de Datos." |
| **Acción:** Apuntar con el ratón a los badges superiores (Modo Normal, Profundidad). | "Este sistema utiliza un **Árbol AVL autoequilibrado** para gestionar registros de vuelos en tiempo real, garantizando tiempos de búsqueda e inserción óptimos, simulando un entorno donde cada milisegundo e impacto en la rentabilidad cuentan." |

### 2. Estructura del Proyecto y Código Base
| 👁️ Lo que se muestra en pantalla | 🗣️ Lo que vas a decir (Guion hablado) |
| --- | --- |
| **Plano principal:** Tu editor de código (VS Code). Abierto en `index.html` y luego en `js/avl.js` o `js/bst.js`. | "A nivel de código, el sistema está construido puramente con **HTML, CSS Vanilla y JavaScript**. No utilizamos librerías externas complejas para los árboles." |
| **Acción:** Resaltar código relevante de rotaciones en `avl.js` y la herencia de `bst.js`. | "Aquí podemos ver cómo el Árbol AVL hereda del Árbol Binario de Búsqueda tradicional (BST). Implementamos la lógica de alturas, factores de balanceo y las rotaciones críticas (Simples y Dobles: LL, RR, LR, RL) totalmente desde cero para mantener el árbol estrictamente balanceado tras cada cambio." |

### 3. Demostración Práctica: Inserción y Comparación
| 👁️ Lo que se muestra en pantalla | 🗣️ Lo que vas a decir (Guion hablado) |
| --- | --- |
| **Plano principal:** UI de la aplicación. <br> **Acción:** Hacer clic en "➕ Insertar Vuelo". | "Vamos a realizar una inserción. Al añadir un vuelo, capturamos datos vitales: código, destino, precio, pasajeros y prioridad." |
| **Acción:** Rellenar un par de vuelos que fuercen una rotación y aceptar. Aparece el modal **Comparativa AVL vs BST**. | "Una de las características principales de este sistema es su capacidad educativa. Cada vez que insertamos, el sistema realiza la operación en un árbol AVL y simultáneamente en uno BST. En esta ventana comparativa gráfica..." |
| **Acción:** Señalar las diferencias en el Canvas (Alturas, nodos desbalanceados en BST vs el balance del AVL). | "...podemos observar cómo el árbol AVL aplicó una rotación para mantener una altura óptima, a diferencia del BST que puede degenerarse en una lista enlazada si los datos entran ordenados." |

### 4. Operaciones Avanzadas (Búsqueda, Modificación, Eliminación, Cola)
| 👁️ Lo que se muestra en pantalla | 🗣️ Lo que vas a decir (Guion hablado) |
| --- | --- |
| **Acción:** Buscar un código en la barra lateral "Búsqueda" y mostrar cómo se resalta y aparece en la tarjeta "Información de Vuelo". | "Gracias a la estructura logarítmica O(log n), las búsquedas son extremadamente eficientes. Al buscar un vuelo, obtenemos sus datos de forma instántanea." |
| **Acción:** Modificar el vuelo para mejorar su rentabilidad, o eliminar un nodo hoja/nodo con dos hijos. | "También podemos modificar vuelos existentes o eliminarlos. El algoritmo de eliminación es robusto, gestionando reemplazos de nodos internos (usando el sucesor o predecesor) y aplicando rebalanceo recursivo hasta la raíz." |
| **Acción:** Ir a "🗂️ Cola de Inserciones", agregar 2 o 3 vuelos rápidos o cargar un JSON y pulsar "Procesar Cola". | "Además, simulamos congestión con una Cola de Inserciones pendientes, permitiendo cargar históricos completos (JSON) y procesarlos en bucle de una sola vez." |

### 5. Métricas, Análisis y Versionado
| 👁️ Lo que se muestra en pantalla | 🗣️ Lo que vas a decir (Guion hablado) |
| --- | --- |
| **Plano principal:** Panel derecho "Métricas".<br>**Acción:** Hacer scroll por Rentabilidad, Top 5 y Recorridos. | "Mientras interactuamos, el panel de análisis genera métricas en tiempo real. Contabiliza el número exacto de rotaciones (LL, RR, etc.), calcula la rentabilidad o 'Profit' de los vuelos y expone los recorridos clásicos: Pre-orden, In-orden y Post-orden." |
| **Plano del código:** Mostrar rápidamente `metrics.js` y `versioning.js`. | "A nivel algorítmico, esto se re-calcula usando recorridos y pilas tras cada mutación del estado. Y hablando de estados..." |
| **Acción (UI):** Pulsar "Guardar Versión", luego "Gestionar Versiones" y escoger una versión previa. | "...implementamos también un control de versiones manual, aplicando conceptos de Memento. Podemos guardar fotografías completas de la estructura y retroceder en el tiempo a cualquier estado anterior si detectamos un error." |

### 6. Despedida
| 👁️ Lo que se muestra en pantalla | 🗣️ Lo que vas a decir (Guion hablado) |
| --- | --- |
| **Plano principal:** Vista global del árbol bastante poblado, quizás usando el botón "Inseción Masiva (Estrés)". | "Para cerrar, les muestro el **Modo Estrés**, capaz de inyectar cientos de nodos y auditar automáticamente si el árbol sigue cumpliendo estrictamente la propiedad AVL de diferencia de alturas." |
| **Acción:** El árbol dibujado se ve complejo. | "Esto ha sido SkyBalance AVL, una forma visual y robusta de entender y aplicar estructuras de datos complejas a problemas del mundo real. Muchas gracias por su atención." |

---

## 💡 Consejos de Grabación
1. **Practicar la navegación UI:** Antes de grabar, practica el flujo. Inserta específicamente los valores `10`, `20`, `30` para forzar e ilustrar fácilmente una rotación a la derecha de la raíz. Esto es un "Tip" fundamental para la demostración en vivo.
2. **Transiciones al código:** No dejes el código mucho tiempo en pantalla sin señalar qué línea estás explicando (usa la selección con el ratón o comentarios resaltados). A los evaluadores les gusta ver que dominas lo que escribiste.
3. **Calidad de video e iluminación:** Asegúrate de que el texto de la consola / editor sea legible (aumenta un poco el tamaño de la fuente en VSCode con `Ctrl + +` o `Cmd + +`).
4. **Voz:** Mantén un tono seguro y pausado. Evita los silencios largos; la narrativa debe ser continua, relacionando siempre la acción en la interfaz con lo que está pasando en "las bambalinas" de código.
