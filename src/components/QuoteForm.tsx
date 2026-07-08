import React, { useEffect, useState } from "react";
import {
    CANDLE_TYPE_EVENT,
    CANDLE_TYPE_STORAGE_KEY,
} from "../lib/quoteRedirect";

type CandleType = "grande" | "mediana" | "especial";

type FormState = {
    name: string;
    email: string;
    phone: string;
    candleType: CandleType | "";
    message: string;
    company: string; // honeypot, must stay empty
};

type FormErrors = Partial<Record<keyof Omit<FormState, "company">, string>>;

const CANDLE_OPTIONS: { value: CandleType; label: string }[] = [
    { value: "grande", label: "Velas grandes" },
    { value: "mediana", label: "Velas medianas" },
    { value: "especial", label: "Velas especiales" },
];

const INITIAL_STATE: FormState = {
    name: "",
    email: "",
    phone: "",
    candleType: "",
    message: "",
    company: "",
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function validate(form: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = "Ingresa tu nombre.";
    if (!form.email.trim()) errors.email = "Ingresa tu correo.";
    else if (!isValidEmail(form.email)) errors.email = "Ingresa un correo válido.";
    if (!form.candleType) errors.candleType = "Selecciona un tipo de vela.";
    return errors;
}

export default function QuoteForm() {
    const [form, setForm] = useState<FormState>(INITIAL_STATE);
    const [errors, setErrors] = useState<FormErrors>({});
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
        "idle",
    );
    const [statusMessage, setStatusMessage] = useState("");

    function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function applyCandleType(value: string | null | undefined) {
        if (!value) return;
        const match = CANDLE_OPTIONS.find((option) => option.value === value);
        if (match) updateField("candleType", match.value);
    }

    useEffect(() => {
        const stored = sessionStorage.getItem(CANDLE_TYPE_STORAGE_KEY);
        if (stored) {
            applyCandleType(stored);
            sessionStorage.removeItem(CANDLE_TYPE_STORAGE_KEY);
        }

        const handler = (event: Event) => {
            applyCandleType((event as CustomEvent<string>).detail);
        };
        window.addEventListener(CANDLE_TYPE_EVENT, handler);
        return () => window.removeEventListener(CANDLE_TYPE_EVENT, handler);
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const validationErrors = validate(form);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setStatus("loading");
        setStatusMessage("");

        try {
            const response = await fetch("/api/quote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await response.json();

            if (!response.ok || !data.ok) {
                setStatus("error");
                setStatusMessage(
                    data.error ||
                        "No se pudo enviar tu solicitud. Intenta nuevamente.",
                );
                return;
            }

            setStatus("success");
            setStatusMessage(
                "¡Listo! Recibimos tu solicitud y te contactaremos pronto.",
            );
            setForm(INITIAL_STATE);
        } catch {
            setStatus("error");
            setStatusMessage(
                "No se pudo enviar tu solicitud. Revisa tu conexión e intenta de nuevo.",
            );
        }
    }

    const isLoading = status === "loading";

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto w-full"
        >
            {/* Honeypot: hidden from real users, catches basic bots without a third-party captcha */}
            <div className="hidden" aria-hidden="true">
                <label htmlFor="company">No completar este campo</label>
                <input
                    type="text"
                    id="company"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.company}
                    onChange={(e) => updateField("company", e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-2.5">
                <label htmlFor="name">Nombre</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Tu nombre completo"
                    required
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    className="border-b border-primary p-2 outline-none"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                />
                {errors.name && (
                    <p id="name-error" className="text-sm text-red-600">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-2.5">
                <label htmlFor="email">Correo</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="tucorreo@ejemplo.com"
                    required
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className="border-b border-primary p-2 outline-none"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                />
                {errors.email && (
                    <p id="email-error" className="text-sm text-red-600">
                        {errors.email}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-2.5 md:col-span-2">
                <label htmlFor="phone">Teléfono / WhatsApp (opcional)</label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+51 900 000 000"
                    className="border-b border-primary p-2 outline-none"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-2.5 md:col-span-2">
                <p id="candle-type-label">
                    Selecciona el tipo de vela que necesitas
                </p>
                <div
                    role="radiogroup"
                    aria-labelledby="candle-type-label"
                    aria-describedby={
                        errors.candleType ? "candle-type-error" : undefined
                    }
                    className="flex flex-col sm:flex-row justify-center items-stretch gap-3"
                >
                    {CANDLE_OPTIONS.map((option) => {
                        const selected = form.candleType === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() =>
                                    updateField("candleType", option.value)
                                }
                                className={`px-3 py-2 font-medium rounded-sm transition-all w-full border ${
                                    selected
                                        ? "bg-primary text-white border-primary"
                                        : "bg-white text-primary border-primary hover:bg-gray-200"
                                }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
                {errors.candleType && (
                    <p id="candle-type-error" className="text-sm text-red-600">
                        {errors.candleType}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-2.5 md:col-span-2">
                <label htmlFor="message">Mensaje (opcional)</label>
                <textarea
                    id="message"
                    name="message"
                    placeholder="Cuéntanos cantidad, plazos u otros detalles de tu pedido"
                    rows={4}
                    className="border-b outline-none border-primary p-2"
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-white p-2 md:col-span-2 font-medium rounded-sm hover:bg-primary/80 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isLoading ? "Enviando..." : "Enviar"}
            </button>

            {status !== "idle" && statusMessage && (
                <p
                    role="status"
                    className={`md:col-span-2 text-center font-medium ${
                        status === "success" ? "text-green-700" : "text-red-600"
                    }`}
                >
                    {statusMessage}
                </p>
            )}
        </form>
    );
}
