import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

// This route sends server-rendered responses on every request (Vercel
// serverless function) — it must never be prerendered at build time.
export const prerender = false;

const CANDLE_LABELS: Record<string, string> = {
    grande: "Velas grandes",
    mediana: "Velas medianas",
    especial: "Velas especiales",
};

type QuotePayload = {
    name: string;
    email: string;
    phone: string;
    candleType: string;
    message: string;
};

function jsonResponse(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const POST: APIRoute = async ({ request }) => {
    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return jsonResponse(
            { ok: false, error: "Solicitud inválida." },
            400,
        );
    }

    // Honeypot: a real visitor never sees or fills this hidden field.
    // Bots that auto-fill every input will, so we pretend success and drop it.
    if (typeof body.company === "string" && body.company.trim() !== "") {
        return jsonResponse({ ok: true });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const candleType =
        typeof body.candleType === "string" ? body.candleType : "";
    const message =
        typeof body.message === "string" ? body.message.trim() : "";

    const errors: Record<string, string> = {};
    if (!name) errors.name = "El nombre es obligatorio.";
    if (name.length > 200) errors.name = "El nombre es demasiado largo.";
    if (!email || !isValidEmail(email))
        errors.email = "Ingresa un correo válido.";
    if (!CANDLE_LABELS[candleType])
        errors.candleType = "Selecciona un tipo de vela.";
    if (message.length > 2000)
        errors.message = "El mensaje es demasiado largo.";

    if (Object.keys(errors).length > 0) {
        return jsonResponse({ ok: false, errors }, 400);
    }

    const payload: QuotePayload = { name, email, phone, candleType, message };

    try {
        await sendNotificationEmail(payload);
    } catch (error) {
        console.error("[api/quote] Failed to send email", error);
        return jsonResponse(
            {
                ok: false,
                error: "No se pudo enviar la notificación por correo.",
            },
            502,
        );
    }

    // Best-effort lead log into the Google Sheet via Apps Script.
    // Never fail the user-facing request because of this side channel.
    logLeadToSheet(payload).catch((error) => {
        console.error(
            "[api/quote] Failed to log lead to Apps Script sheet",
            error,
        );
    });

    return jsonResponse({ ok: true });
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        host: import.meta.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(import.meta.env.SMTP_PORT) || 465,
        secure: true,
        auth: {
            user: import.meta.env.SMTP_USER,
            pass: import.meta.env.SMTP_APP_PASSWORD,
        },
    });
    return transporter;
}

async function sendNotificationEmail({
    name,
    email,
    phone,
    candleType,
    message,
}: QuotePayload) {
    const candleLabel = CANDLE_LABELS[candleType];
    const to = import.meta.env.NOTIFY_EMAIL_TO || import.meta.env.SMTP_USER;

    await getTransporter().sendMail({
        from: `"Cotizaciones Velmon" <${import.meta.env.SMTP_USER}>`,
        to,
        replyTo: email,
        subject: `Nueva cotización de ${name} (${candleLabel})`,
        text: [
            `Nombre: ${name}`,
            `Correo: ${email}`,
            `Teléfono: ${phone || "No proporcionado"}`,
            `Tipo de vela: ${candleLabel}`,
            "",
            "Mensaje:",
            message || "(sin mensaje)",
        ].join("\n"),
    });
}

async function logLeadToSheet({
    name,
    email,
    phone,
    candleType,
    message,
}: QuotePayload) {
    const url = import.meta.env.APPS_SCRIPT_URL;
    // Not configured yet — safe no-op until the Apps Script Web App is deployed.
    if (!url) return;

    await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            email,
            phone,
            candleType: CANDLE_LABELS[candleType],
            message,
            receivedAt: new Date().toISOString(),
        }),
    });
}
