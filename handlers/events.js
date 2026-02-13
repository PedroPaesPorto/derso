// handlers/events.js

// 1. IMPORTAÇÕES CORRIGIDAS (Saindo de handlers para buscar em outras pastas)
import { DOM } from "../core/dom.js";
import { CONFIG } from "../core/config.js";
import { STATE } from "../core/state.js";
import { registrarLog } from "../services/logger.js";
import { updateProgress } from "../services/progress.js"; // Se estiver em services
import { handleSubmit } from "./submit.js";           // Continua ./ pois está na pasta handlers
import { buscarHistorico } from "../core/api.js";      // Conforme sua imagem, api.js está em core
import { UI } from "../ui/manager.js";                // Usaremos UI.modal.show em vez de showModal solto
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
        UI.modal.hide(); // Usando o gerenciador de UI padrão
    });


    /* ======================================
       SUBMIT
    ====================================== */
    DOM.form.addEventListener("submit", handleSubmit);

    registrarLog("EVENTOS", "Eventos registrados com sucesso");
}



/* ======================================
   FUNÇÃO AUXILIAR - HISTÓRICO
====================================== */
async function carregarHistorico(matricula) {
    if (!matricula) {
        UI.modal.show("AVISO", "Informe uma matrícula válida.", "⚠️", "orange");
        return;
    }

    try {
        const resultado = await buscarHistorico(matricula);
        
        // Se o resultado vier dentro de uma propriedade (ex: resultado.dados), a gente extrai
        const listaFinal = Array.isArray(resultado) ? resultado : (resultado?.dados || []);

        if (listaFinal.length === 0) {
            UI.modal.show("HISTÓRICO", "Nenhum registro encontrado.", "ℹ️", "#1976D2");
            return;
        }

        // Criando o conteúdo formatado
        const conteudo = listaFinal
            .map(item => `
                <div style="border-bottom: 1px solid #eee; padding: 8px 0;">
                    <strong>📅 ${item.data}</strong> - ${item.tipo || item.folga || "Registro"}
                </div>
            `)
            .join("");

        UI.modal.show("HISTÓRICO", conteudo, "📜", "#1976D2", true);
        registrarLog("HISTORICO", `Consulta realizada: ${matricula}`, "INFO");

    } catch (err) {
        console.error("Erro detalhado:", err);
        registrarLog("HISTORICO_ERRO", err.message, "ERRO");
        UI.modal.show("ERRO", "Não foi possível buscar o histórico.", "❌", "red");
    }
}
