import { CONFIG } from "./config.js";
import { DOM } from "./dom.js";
import { registrarLog } from "./logger.js";
import { showModal } from "./modal.js";

export async function fetchHistory(mat) {

    if (!mat) {
        registrarLog(
            "PESQUISA",
            "Tentativa de consulta sem matrícula",
            "AVISO"
        );

        return showModal(
            "AVISO",
            "Insira a matrícula para consultar.",
            "📂",
            "#FFD700"
        );
    }

    registrarLog(
        "PESQUISA",
        `Buscando histórico para: ${mat}`,
        "INFO"
    );

    showModal(
        "CONSULTANDO",
        "Buscando seus registros...",
        "⏳",
        "#1A3C6E"
    );

    try {

        const response = await fetch(
            `${CONFIG.API_URL}?action=historico&matricula=${encodeURIComponent(mat)}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const r = await response.json();

        if (r?.dados?.length > 0) {

            registrarLog(
                "PESQUISA",
                `${r.dados.length} registros encontrados para ${mat}`,
                "SUCESSO"
            );

            if (DOM.historyContent) {
                DOM.historyContent.innerHTML = r.dados
                    .map(i => `
                        <div class="historico-item">
                            <span>📅 ${i.data}</span>
                            <b>${i.folga}</b>
                        </div>
                    `)
                    .join("");
            }

            showModal(
                r.nome || "REGISTROS",
                "Solicitações encontradas:",
                "📋",
                "#1A3C6E",
                true
            );

        } else {

            registrarLog(
                "PESQUISA",
                `Nenhum registro encontrado para ${mat}`,
                "INFO"
            );

            showModal(
                "NADA ENCONTRADO",
                "Não há registros para esta matrícula.",
                "🔎",
                "#777"
            );
        }

    } catch (e) {

        registrarLog(
            "PESQUISA_FALHA",
            e.message,
            "ERRO"
        );

        showModal(
            "ERRO",
            "Falha na comunicação com o banco de dados.",
            "❌",
            "red"
        );
    }
}
