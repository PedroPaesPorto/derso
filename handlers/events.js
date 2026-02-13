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
       GATILHO OCULTO - PAINEL ADMIN (5 CLIQUES)
    ====================================== */
    let cliquesFooter = 0;
    let timerFooter;

    if (DOM.footer) {
        DOM.footer.style.cursor = "pointer";
        DOM.footer.addEventListener("click", () => {
            cliquesFooter++;
            clearTimeout(timerFooter);

            if (cliquesFooter === 5) {
                cliquesFooter = 0;
                abrirPortaAdmin();
                return;
            }

            timerFooter = setTimeout(() => { cliquesFooter = 0; }, 2000);
        });
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

    DOM.form.addEventListener("input", updateProgress);

    DOM.btnHistory?.addEventListener("click", () => {
        carregarHistorico(DOM.matricula?.value);
    });

    DOM.btnHistoryFechado?.addEventListener("click", () => {
        carregarHistorico(DOM.matriculaConsulta?.value);
    });

    document.getElementById("btnCloseModal")?.addEventListener("click", () => {
        UI.modal.hide();
    });

    DOM.form.addEventListener("submit", handleSubmit);

    registrarLog("EVENTOS", "Eventos registrados com sucesso");
}

/* ======================================
   FUNÇÕES DE ACESSO ADMINISTRATIVO
====================================== */
async function abrirPortaAdmin() {
    const matriculaMestre = "300199600";
    const login = prompt("🛡️ SISTEMA DERSO - ACESSO RESTRITO\nIdentifique-se:");

    if (!login) return;

    if (login === matriculaMestre) {
        registrarLog("ADMIN", "Acesso autorizado: Pedro Porto", "SUCESSO");
        UI.loading.show("Iniciando Painel de Controle...");
        
        try {
            // Import dinâmico para performance
            const { iniciarPainelAdmin } = await import("../features/admin.js");
            iniciarPainelAdmin();
        } catch (e) {
            console.error(e);
            UI.modal.show("ERRO", "Falha ao carregar módulo administrativo.", "❌", "red");
        } finally {
            UI.loading.hide();
        }
    } else {
        // SEGURANÇA: Se errar a matrícula, registra quem tentou (pelo nome na lista)
        const intruso = STATE.employeeList[login];
        const nomeIntruso = typeof intruso === "object" ? intruso.nome : (intruso || "DESCONHECIDO");
        
        registrarLog("SEGURANÇA", `TENTATIVA DE ACESSO NEGADA: ${nomeIntruso} (Matrícula: ${login})`, "ERRO");
        alert("Acesso Negado. Seu login foi registrado nos logs de segurança.");
    }
}

/* ======================================
    FUNÇÃO AUXILIAR - HISTÓRICO
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

    const dadosMilitar = STATE.employeeList[matricula];
    let nomeMilitar = "MILITAR NÃO IDENTIFICADO";

    if (dadosMilitar) {
        nomeMilitar = typeof dadosMilitar === "object" ? (dadosMilitar.nome || dadosMilitar.NOME) : dadosMilitar;
    } else if (DOM.nome && DOM.nome.value) {
        nomeMilitar = DOM.nome.value;
    }

    try {
        UI.loading.show("Buscando registros...");
        const resultado = await buscarHistorico(matricula);
        const listaFinal = Array.isArray(resultado) ? resultado : (resultado?.dados || []);

        const conteudoHTML = `
            <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                <span style="display: block; color: #1a3c6e; font-weight: 800; font-size: 1.1rem; text-transform: uppercase;">
                    ${nomeMilitar}
                </span>
            </div>
            <div style="max-height: 300px; overflow-y: auto; padding-right: 5px;">
                ${listaFinal.length > 0 
                    ? listaFinal.map(item => `
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f5f5f5; padding: 10px 5px; font-size: 0.95rem;">
                            <span>📅 <b>${item.data}</b></span>
                            <span style="color: #1a3c6e; font-weight: bold;">${item.tipo || item.folga || "48H"}</span>
                        </div>
                    `).join("")
                    : `<p style="text-align:center; padding: 20px; color: #666;">Nenhum registro encontrado.</p>`
                }
            </div>
        `;

        UI.modal.show("HISTÓRICO", conteudoHTML, "📜", "#1a3c6e", true);
        registrarLog("HISTORICO", `Consulta realizada: ${matricula}`, "INFO");

    } catch (err) {
        UI.modal.show("ERRO", "Não foi possível carregar o histórico.", "❌", "red");
    } finally {
        UI.loading.hide();
    }
}
