// handlers/events.js

// 1. IMPORTAÇÕES
import { DOM } from "../core/dom.js";
import { CONFIG } from "../core/config.js";
import { STATE } from "../core/state.js";
import { registrarLog } from "../services/logger.js";
import { updateProgress } from "../services/progress.js";
import { handleSubmit } from "./submit.js";
import { buscarHistorico } from "../core/api.js";
import { UI } from "../ui/manager.js";
import { applyInstitutionalTheme } from "../services/theme.js";

export function setupEvents() {

    if (!DOM.form) {
        console.warn("Formulário não encontrado.");
        return;
    }

    /* ======================================
       EMAIL - AUTOCOMPLETE + VALIDAÇÃO
    ====================================== */
    DOM.email?.addEventListener("input", (e) => {
        const val = e.target.value;
        const datalist = document.getElementById("emailProviders");

        if (datalist) {
            datalist.innerHTML = "";
            if (val.includes("@")) {
                const prefix = val.split("@")[0];
                CONFIG.EMAIL_LIST.forEach(provider => {
                    datalist.innerHTML += `<option value="${prefix}@${provider}">`;
                });
            }
        }

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        DOM.email.classList.toggle("valido", emailValido);
        updateProgress();
    });

    /* ======================================
       MATRÍCULA - VALIDAÇÃO E TEMA
    ====================================== */
    DOM.matricula?.addEventListener("blur", () => {
        let val = DOM.matricula.value.trim();
        if (!val) return;

        // Auto-completar matrícula 1000...
        if (val.length <= 6 && !val.startsWith("1000")) {
            val = "1000" + val;
        }

        DOM.matricula.value = val;
        const erroEl = document.getElementById("erroMatricula");

        if (STATE.employeeList[val]) {
            const militar = STATE.employeeList[val];
            DOM.nome.value = typeof militar === "object" ? militar.nome : militar;

            if (erroEl) erroEl.style.display = "none";

            registrarLog("VALIDACAO", `Matrícula ${val} identificada`, "SUCESSO");
            applyInstitutionalTheme(val);
        } else {
            DOM.nome.value = "";
            if (erroEl) erroEl.style.display = "block";
            registrarLog("VALIDACAO", `Matrícula ${val} não encontrada`, "AVISO");
            applyInstitutionalTheme();
        }

        updateProgress();
    });

    /* ======================================
       INPUT GLOBAL DO FORMULÁRIO
    ====================================== */
    DOM.form.addEventListener("input", updateProgress);

    /* ======================================
       HISTÓRICO
    ====================================== */
    DOM.btnHistory?.addEventListener("click", () => {
        carregarHistorico(DOM.matricula?.value);
    });

    DOM.btnHistoryFechado?.addEventListener("click", () => {
        carregarHistorico(DOM.matriculaConsulta?.value);
    });

    /* ======================================
       FECHAR MODAL
    ====================================== */
    document.getElementById("btnCloseModal")?.addEventListener("click", () => {
        UI.modal.hide();
    });

    /* ======================================
       SUBMIT
    ====================================== */
    DOM.form.addEventListener("submit", handleSubmit);

    registrarLog("EVENTOS", "Eventos registrados com sucesso");
}

/* ======================================
   FUNÇÃO AUXILIAR - HISTÓRICO (REVISADA)
====================================== */
async function carregarHistorico(matricula) {
    if (!matricula) {
        UI.modal.show("AVISO", "Informe uma matrícula válida para consultar o histórico.", "⚠️", "orange");
        return;
    }

    // Identifica o nome do policial para o cabeçalho
    const dadosMilitar = STATE.employeeList[matricula];
    const nomeMilitar = typeof dadosMilitar === "object" ? dadosMilitar.nome : (dadosMilitar || "Militar não identificado");

    try {
        UI.loading.show("Buscando registros...");
        
        const resultado = await buscarHistorico(matricula);
        const listaFinal = Array.isArray(resultado) ? resultado : (resultado?.dados || []);

        if (listaFinal.length === 0) {
            UI.modal.show("HISTÓRICO", `Nenhum registro encontrado para:<br><b>${nomeMilitar}</b>`, "ℹ️", "#1976D2");
            return;
        }

        // Criando o conteúdo formatado conforme a imagem solicitada
        // Título já é passado no UI.modal.show, aqui montamos o Subtítulo (Nome) e a Lista
        const conteudoHTML = `
            <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                <span style="display: block; color: #1a3c6e; font-weight: 800; font-size: 1.1rem; text-transform: uppercase;">
                    ${nomeMilitar}
                </span>
            </div>
            <div style="max-height: 300px; overflow-y: auto;">
                ${listaFinal.map(item => `
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f5f5f5; padding: 10px 5px; font-size: 0.95rem;">
                        <span>📅 <b>${item.data}</b></span>
                        <span style="color: #666; font-weight: 500;">${item.tipo || item.folga || "48H"}</span>
                    </div>
                `).join("")}
            </div>
        `;

        // Chamada do Modal: Título "HISTÓRICO", nosso HTML personalizado, ícone e cor
        UI.modal.show("HISTÓRICO", conteudoHTML, "📜", "#1a3c6e", true);
        
        registrarLog("HISTORICO", `Consulta realizada: ${matricula} (${nomeMilitar})`, "INFO");

    } catch (err) {
        console.error("Erro ao carregar histórico:", err);
        registrarLog("HISTORICO_ERRO", err.message, "ERRO");
        UI.modal.show("ERRO", "Falha na comunicação com o servidor.", "❌", "red");
    } finally {
        UI.loading.hide();
    }
}
