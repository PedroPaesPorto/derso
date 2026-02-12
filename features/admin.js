import { STATE } from "./state.js";

export function abrirPainelAdmin() {

    if (!Array.isArray(STATE.sessionLogs) || STATE.sessionLogs.length === 0) {
        alert("LOGS DA SESSÃO\n\nNenhum registro nesta sessão.");
        return;
    }

    const conteudo = STATE.sessionLogs
        .slice(-50)
        .map(l =>
            `${l?.data || "?"} - ${l?.acao || "SEM AÇÃO"} - ${l?.tipo || "INFO"}`
        )
        .join("\n");

    alert("LOGS DA SESSÃO\n\n" + conteudo);
}
