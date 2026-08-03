/**
 * Google Apps Script Web App — Guarda las cotizaciones enviadas desde la web en Google Sheets.
 *
 * INSTRUCCIONES DE CONFIGURACIÓN:
 * 1. Abre tu hoja de cálculo en Google Sheets (o crea una nueva).
 * 2. Renombra la pestaña a "Cotizaciones" (o crea una pestaña "Cotizaciones").
 * 3. En el menú superior de Google Sheets, ve a: Extensiones > Apps Script.
 * 4. Reemplaza todo el contenido de `Code.gs` con este archivo.
 * 5. Configura tus constantes:
 *    - TOKEN: Token secreto para proteger el endpoint (ej. "GT67UhvQEg8SxE51ApmrBTbVuOfQUvilI").
 *    - SHEET_ID: El ID de tu hoja (se encuentra en la URL de tu Google Sheet:
 *      https://docs.google.com/spreadsheets/d/TU_SHEET_ID_AQUI/edit).
 * 6. Haz clic en "Implementar" > "Nueva implementación" (Deploy > New deployment).
 * 7. Selecciona el tipo "Aplicación web" (Web app):
 *    - Descripción: Api Cotizaciones
 *    - Ejecutar como: Yo (Me)
 *    - Quién tiene acceso: Cualquier persona (Anyone)
 * 8. Copia la "URL de la aplicación web" que te entrega Google Apps Script.
 * 9. Pega la URL en la variable APPS_SCRIPT_URL y el TOKEN en APPS_SCRIPT_TOKEN de tu archivo `.env` o panel de Vercel.
 */

const TOKEN = "GT67UhvQEg8SxE51ApmrBTbVuOfQUvilI";
const SHEET_ID = "1QyuWD6P4alOsMYimc-5E9txj9StyLmgngzLKWFD2vtU";
const SHEET_NAME = "Cotizaciones";

const HEADERS = [
  "Fecha y Hora",
  "Nombre",
  "Correo",
  "Teléfono",
  "Servicio / Tipo de Vela",
  "Mensaje"
];

function doPost(e) {
  try {
    // 1. Obtener token del query param (?token=...) o del cuerpo JSON
    const queryToken = (e && e.parameter && e.parameter.token) ? e.parameter.token : "";
    
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = {};
      }
    }

    const token = queryToken || data.token || "";

    // 2. Validar autenticación por token
    if (TOKEN && token !== TOKEN) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "Unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Abrir la hoja de cálculo por ID
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.getActiveSheet();
    }
    if (!sheet) throw new Error("Hoja '" + SHEET_NAME + "' no encontrada en el documento");

    // 4. Agregar encabezados si la hoja está totalmente vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    // 5. Insertar nueva fila con la cotización
    sheet.appendRow([
      data.createdAt || data.receivedAt || new Date().toISOString(),
      data.name || "",
      data.email || "",
      data.phone || "",
      data.service || data.candleType || "",
      data.message || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
