/**
 * Utilidades para manejo de archivos JSON
 * Proporciona funciones para leer archivos desde el sistema de archivos del usuario
 */

/**
 * Lee un archivo JSON seleccionado por el usuario y ejecuta un callback con el contenido parseado
 * @param {Function} callback - Función que recibe el objeto JSON parseado
 */
export function readJSONFile(callback) {
    const input = document.getElementById("fileInput");

    input.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const json = JSON.parse(e.target.result);
                callback(json);
            } catch (err) {
                console.error("Error leyendo JSON:", err);
            }
        };

        reader.readAsText(file);
    });
}