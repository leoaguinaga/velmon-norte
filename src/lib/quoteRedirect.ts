export const CANDLE_TYPE_STORAGE_KEY = "velmon:selected-candle-type";
export const CANDLE_TYPE_EVENT = "velmon:candle-type-selected";

export function initQuoteButtons(root: ParentNode = document) {
    const buttons = root.querySelectorAll<HTMLElement>("[data-cotizar]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const type = button.dataset.cotizar;
            if (!type) return;

            sessionStorage.setItem(CANDLE_TYPE_STORAGE_KEY, type);
            window.dispatchEvent(
                new CustomEvent(CANDLE_TYPE_EVENT, { detail: type }),
            );

            document
                .getElementById("cotizacion")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}
