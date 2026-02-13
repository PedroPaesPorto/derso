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
        UI.modal.show("AVISO", "Informe uma matrícula válida para consultar o histórico.", "⚠️", "orange");
        return;
    }

    // 1. Garante que a matrícula esteja no formato completo (1000...) para buscar no STATE
    let matricula = matriculaOriginal.trim();
    if (matricula.length <= 6 && !matricula.startsWith("1000")) {
        matricula = "1000" + matricula;
    }

    // 2. Busca o nome do militar no STATE
    const dadosMilitar = STATE.employeeList[matricula];
    
    // Se não achar no STATE, tenta pegar o que estiver escrito no campo Nome do formulário
    const nomeMilitar = dadosMilitar 
        ? (typeof dadosMilitar === "object" ? dadosMilitar.nome : dadosMilitar)
        : (DOM.nome?.value || "MILITAR NÃO IDENTIFICADO");

    try {
        UI.loading.show("Buscando registros...");
        
        const resultado = await buscarHistorico(matricula);
        const listaFinal = Array.isArray(resultado) ? resultado : (resultado?.dados || []);

        if (listaFinal.length === 0) {
            UI.modal.show("HISTÓRICO", `Nenhum registro encontrado para:<br><b style="color:#d32f2f">${nomeMilitar}</b>`, "ℹ️", "#1976D2");
            return;
        }

        // 3. Monta o HTML com o Título, Nome e a Lista
        const conteudoHTML = `
            <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                <span style="display: block; color: #666; font-size: 0.8rem; font-weight: bold; margin-bottom: 4px;">POLICIAL MILITAR</span>
                <span style="display: block; color: #1a3c6e; font-weight: 800; font-size: 1.1rem; text-transform: uppercase; line-height: 1.2;">
                    ${nomeMilitar}
                </span>
            </div>
            <div style="max-height: 300px; overflow-y: auto; padding-right: 5px;">
                ${listaFinal.map(item => `
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f5f5f5; padding: 10px 5px; font-size: 0.95rem;">
                        <span>📅 <b>${item.data}</b></span>
                        <span style="color: #1a3c6e; font-weight: bold;">${item.tipo || item.folga || "48H"}</span>
                    </div>
                `).join("")}
            </div>
        `;

        UI.modal.show("HISTÓRICO", conteudoHTML, "📜", "#1a3c6e", true);
        registrarLog("HISTORICO", `Consulta: ${matricula} (${nomeMilitar})`, "INFO");

    } catch (err) {
        console.error("Erro no histórico:", err);
        UI.modal.show("ERRO", "Falha ao conectar com o banco de dados.", "❌", "red");
    } finally {
        UI.loading.hide();
    }
}
