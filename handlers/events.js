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
   FUNÇÃO AUXILIAR - HISTÓRICO (CORRIGIDA)
====================================== */
async function carregarHistorico(matriculaOriginal) {
    if (!matriculaOriginal) {
        UI.modal.show("AVISO", "Informe uma matrícula válida.", "⚠️", "orange");
        return;
    }

    let matricula = matriculaOriginal.trim();
    if (matricula.length <= 6 && !matricula.startsWith("1000")) {
        matricula = "1000" + matricula;
    }

    // Pega o nome do STATE (já vimos que está funcionando)
    const dadosMilitar = STATE.employeeList[matricula];
    const nomeMilitar = dadosMilitar ? (dadosMilitar.nome || dadosMilitar) : (DOM.nome?.value || "MILITAR");

    try {
        UI.loading.show("Buscando registros...");
        const resultado = await buscarHistorico(matricula);
        const listaFinal = Array.isArray(resultado) ? resultado : (resultado?.dados || []);

        // 1. Primeiro, mostramos o modal básico (Título e Ícone)
        UI.modal.show("HISTÓRICO", "Carregando...", "📜", "#1a3c6e");

        // 2. Agora injetamos o HTML trabalhado direto no corpo do modal
        // O DOM.historyContent é o local onde a lista aparece
        if (DOM.historyContent) {
            DOM.historyContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                    <span style="display: block; color: #1a3c6e; font-weight: 800; font-size: 1.1rem; text-transform: uppercase;">
                        ${nomeMilitar}
                    </span>
                </div>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${listaFinal.length > 0 
                        ? listaFinal.map(item => `
                            <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #f5f5f5;">
                                <span>📅 <b>${item.data}</b></span>
                                <span style="font-weight: bold; color: #1a3c6e;">${item.tipo || item.folga || "48H"}</span>
                            </div>
                        `).join("")
                        : '<p style="text-align:center; padding: 20px;">Nenhum registro encontrado.</p>'
                    }
                </div>
            `;
        }

    } catch (err) {
        UI.modal.show("ERRO", "Falha ao carregar dados.", "❌", "red");
    } finally {
        UI.loading.hide();
    }
}
