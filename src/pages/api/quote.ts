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

function cleanEnvValue(value: string | undefined): string {
    if (!value) return "";
    let trimmed = value.trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        trimmed = trimmed.slice(1, -1);
    }
    return trimmed;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (transporter) return transporter;

    const service = cleanEnvValue(import.meta.env.EMAIL_SERVICE);
    const user = cleanEnvValue(import.meta.env.EMAIL_USER || import.meta.env.SMTP_USER);
    const pass = cleanEnvValue(
        import.meta.env.EMAIL_PASSWORD || import.meta.env.SMTP_APP_PASSWORD
    ).replace(/\s+/g, "");

    if (
        service === "gmail" ||
        (!import.meta.env.SMTP_HOST && user.endsWith("@gmail.com"))
    ) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass },
        });
    } else {
        transporter = nodemailer.createTransport({
            host: cleanEnvValue(import.meta.env.SMTP_HOST) || "smtp.gmail.com",
            port: Number(import.meta.env.SMTP_PORT) || 465,
            secure: true,
            auth: { user, pass },
        });
    }

    return transporter;
}

async function sendNotificationEmail({
    name,
    email,
    phone,
    candleType,
    message,
}: QuotePayload) {
    const candleLabel = CANDLE_LABELS[candleType] || candleType;
    const to = cleanEnvValue(
        import.meta.env.EMAIL_END_ADDRESS ||
        import.meta.env.NOTIFY_EMAIL_TO ||
        import.meta.env.EMAIL_USER ||
        import.meta.env.SMTP_USER
    );

    const fromName = cleanEnvValue(import.meta.env.EMAIL_FROM_NAME) || "AyM Corporación de Negocios";
    const fromAddress = cleanEnvValue(
        import.meta.env.EMAIL_FROM_ADDRESS ||
        import.meta.env.EMAIL_USER ||
        import.meta.env.SMTP_USER
    );

    await getTransporter().sendMail({
        from: `"${fromName}" <${fromAddress}>`,
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
    const baseUrl = import.meta.env.APPS_SCRIPT_URL;
    // Not configured yet — safe no-op until the Apps Script Web App is deployed.
    if (!baseUrl) return;

    const token = import.meta.env.APPS_SCRIPT_TOKEN;
    let url = baseUrl;
    if (token) {
        const separator = baseUrl.includes("?") ? "&" : "?";
        url = `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
    }

    const candleLabel = CANDLE_LABELS[candleType] || candleType;

    await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: token || undefined,
            createdAt: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            name,
            email,
            phone: phone || "",
            service: candleLabel,
            candleType: candleLabel,
            message: message || "",
        }),
    });
}
