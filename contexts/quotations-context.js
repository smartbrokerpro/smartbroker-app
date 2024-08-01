// contexts/quotations-context.js
export function getQuotationContext() {
    return `
    Modelo de cotizaciones en MongoDB:
    {
      "client": "ObjectId (referencia a Cliente)",
      "project": "ObjectId (referencia a Proyecto)",
      "total_amount": "number",
      "status": "string (enum: draft, sent, accepted, rejected)",
      "valid_until": "date",
      "notes": "string",
      "organization_id": "ObjectId"
    }
  
    Ejemplos de comandos:
    1. "Crear una nueva cotización para el cliente John Doe, proyecto Sky Tower, por $50,000."
       {"action": "create", "command": { "client": "John Doe", "project": "Sky Tower", "total_amount": 50000, "status": "draft", "organization_id": "ObjectId" }}
    2. "Actualizar el estado de la cotización para John Doe a 'sent'."
       {"action": "update", "command": { "q": { "client": "John Doe", "organization_id": "ObjectId" }, "u": { "$set": { "status": "sent" } } }}
    3. "Eliminar la cotización para el proyecto Sky Tower."
       {"action": "delete", "command": { "project": "Sky Tower", "organization_id": "ObjectId" }}
    4. "Filtrar cotizaciones con estado 'accepted'."
       {"action": "filter", "command": { "status": "accepted", "organization_id": "ObjectId" }}
    `;
  }