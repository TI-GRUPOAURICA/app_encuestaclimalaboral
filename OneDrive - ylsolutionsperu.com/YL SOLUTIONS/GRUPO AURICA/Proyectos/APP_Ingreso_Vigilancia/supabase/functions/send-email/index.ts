import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS options request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { destinatario, asunto, htmlBody, pdfUrl } = body;

    if (!destinatario || !htmlBody) {
      throw new Error("Faltan campos obligatorios: destinatario o htmlBody");
    }

    // 1. Cargar Credenciales de Azure (Microsoft Graph)
    const TENANT_ID = Deno.env.get("AZURE_TENANT_ID");
    const CLIENT_ID = Deno.env.get("AZURE_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("AZURE_CLIENT_SECRET");
    const MAIL_SENDER = Deno.env.get("SMTP_USER") || "notificaciones@auricasac.com";

    if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
      throw new Error(
        `Credenciales de Azure incompletas. TENANT: ${TENANT_ID ? 'OK' : 'FALTA'}, CLIENT_ID: ${CLIENT_ID ? 'OK' : 'FALTA'}, SECRET: ${CLIENT_SECRET ? 'OK' : 'FALTA'}`
      );
    }

    // 2. Autenticación con Azure para obtener el Token
    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams();
    tokenParams.append("grant_type", "client_credentials");
    tokenParams.append("client_id", CLIENT_ID);
    tokenParams.append("client_secret", CLIENT_SECRET);
    tokenParams.append("scope", "https://graph.microsoft.com/.default");

    console.log(`[send-email] Solicitando token a Azure para tenant: ${TENANT_ID.substring(0, 8)}...`);

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`[TOKEN ERROR ${tokenRes.status}] Microsoft rechazó la autenticación: ${errText}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    console.log("[send-email] Token obtenido exitosamente.");

    // 3. Preparar el adjunto PDF (Descargarlo y pasarlo a Base64)
    const adjuntos: any[] = [];
    if (pdfUrl) {
      try {
        console.log(`[send-email] Descargando PDF desde: ${pdfUrl.substring(0, 80)}...`);
        const pdfRes = await fetch(pdfUrl);
        if (pdfRes.ok) {
          const arrayBuffer = await pdfRes.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          // Usar la librería estándar de Deno para Base64 (seguro para archivos grandes)
          const base64String = base64Encode(uint8Array);
          
          adjuntos.push({
            "@odata.type": "#microsoft.graph.fileAttachment",
            "name": "Acuerdo_Confidencialidad.pdf",
            "contentType": "application/pdf",
            "contentBytes": base64String
          });
          console.log(`[send-email] PDF adjuntado correctamente (${uint8Array.length} bytes).`);
        } else {
          console.error(`[send-email] No se pudo descargar PDF: ${pdfRes.status}`);
        }
      } catch (err: any) {
        console.error("[send-email] Error descargando/adjuntando PDF:", err.message);
      }
    }

    // 4. Construir Payload Final para Microsoft Graph
    const emailMsg = {
      message: {
        subject: asunto || "Bienvenidos a Grupo Aurica",
        body: {
          contentType: "HTML",
          content: htmlBody
        },
        toRecipients: [
          { emailAddress: { address: destinatario } }
        ],
        attachments: adjuntos
      },
      saveToSentItems: "true"
    };

    // 5. Ejecutar Envío
    const sendUrl = `https://graph.microsoft.com/v1.0/users/${MAIL_SENDER}/sendMail`;
    console.log(`[send-email] Enviando correo a: ${destinatario} desde: ${MAIL_SENDER}`);

    const sendRes = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(emailMsg)
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      throw new Error(`[SEND ERROR ${sendRes.status}] Microsoft Graph rechazó el envío: ${errText}`);
    }

    console.log("[send-email] ¡Correo enviado exitosamente!");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error("[send-email] ERROR FINAL:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
