// features/admin.js

// ✅ Ajustado para buscar na pasta core
import { STATE } from "../core/state.js";

/**
 * Abre um painel simples via alert com os logs da sessão atual
 */
export function abrirPainelAdmin() {

    if (!Array.isArray(STATE.sessionLogs) || STATE.sessionLogs.length === 0) {
        alert("📊 LOGS DA SESSÃO\n\nNenhum registro nesta sessão.");
        return;
    }

    // Pega os últimos 50 eventos para não travar o alert
    const conteudo = STATE.sessionLogs
        .slice(-50)
        .map(l =>
            `[${l?.tipo || "INFO"}] ${l?.data?.split(',')[1] || "?"} -> ${l?.acao || "AÇÃO"}: ${l?.detalhes || ""}`
        )
        .join("\n");

    alert("📊 PAINEL DE CONTROLE DERSO v5\n\n" + conteudo);
}
