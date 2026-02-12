import { DOM } from "./dom.js";
import { CONFIG } from "./config.js";
import { registrarLog } from "./logger.js";
import { showModal } from "./modal.js";
import { updateProgress } from "./progress.js";
import { STATE } from "./state.js";
import {
    setButtonLoading,
    restoreButton,
    lockForm,
    unlockForm,
    flashElement,
    shakeElement,
    scrollToTop
} from "./ui.js";
import { salvarRascunho } from "./storage.js";

export async function handleSubmit(e) {
    e.preventDefault();

    // 🔒 Anti spam
    if (Date.now() - STATE.ultimoEnvio < 3000) {
        registrarLog("BLOQUEIO", "Tentativa de envio muito rápida", "AVISO");
        return;
    }
    STATE.ultimoEnvio = Date.now();

    const mLog = DOM.matricula?.value || "N/A";
    registrarLog("ENVIO", `Iniciando tentativa para matrícula: ${mLog}`);

    try {
        lockForm();
        setButtonLoading(DOM.btnEnviar, "ENVIANDO...");

        const formData = new URLSearchParams(new FormData(DOM.form));

        // ⏳ Timeout manual (10s)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(CONFIG.API_URL, {
            method: "POST",
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!res.ok) {
            throw new Error(`Erro HTTP ${res.status}`);
        }

        let response;
        try {
            response = await res.json();
        } catch {
            throw new Error("Resposta inválida do servidor");
        }

        if (response.success) {
            registrarLog("SUCESSO", `Solicitação de ${mLog} registrada com sucesso`, "SUCESSO");

            showModal(
                "SUCESSO!",
                "Sua solicitação foi registrada no banco de dados.",
                "✔",
                "#2E7D32"
            );

            limparFormulario();
            flashElement(DOM.form);
            scrollToTop();

        } else {
            tratarErroServidor(response);
        }

    } catch (err) {
        registrarLog("ERRO_CRITICO", err.message, "ERRO");

        shakeElement(DOM.form);

        showModal(
            "ERRO DE CONEXÃO",
            err.name === "AbortError"
                ? "O servidor demorou para responder. Tente novamente."
                : "Não foi possível enviar sua solicitação. Verifique sua internet.",
            "📡",
            "red"
        );
    } finally {
        unlockForm();
        restoreButton(DOM.btnEnviar);
    }
}


/* ======================================
   FUNÇÕES AUXILIARES
====================================== */

function limparFormulario() {
    DOM.form.reset();

    updateProgress();
    salvarRascunho({}); // limpa rascunho salvo

    registrarLog("FORM_RESET", "Formulário limpo após envio");
}

function tratarErroServidor(response) {
    registrarLog("ENVIO_NEGADO", `Servidor recusou: ${response.message}`, "AVISO");

    if (response.message?.toLowerCase().includes("duplicada")) {
        showModal(
            "SOLICITAÇÃO DUPLICADA",
            "Você já solicitou folga para esta data.",
            "🚫",
            "orange"
        );

        limparFormulario();
        return;
    }

    showModal(
        "AVISO",
        response.message || "Falha desconhecida.",
        "⚠️",
        "orange"
    );

    shakeElement(DOM.form);
}
