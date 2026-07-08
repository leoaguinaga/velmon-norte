/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly SMTP_HOST: string;
    readonly SMTP_PORT: string;
    readonly SMTP_USER: string;
    readonly SMTP_APP_PASSWORD: string;
    readonly NOTIFY_EMAIL_TO: string;
    readonly APPS_SCRIPT_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
