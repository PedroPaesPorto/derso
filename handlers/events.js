import { DOM } from "./dom.js";
import { CONFIG } from "./config.js";
import { STATE } from "./state.js";
import { registrarLog } from "./logger.js";
import { updateProgress } from "./progress.js";
import { handleSubmit } from "./submit.js";
import { buscarHistorico } from "./api.js";
import { showModal } from "./modal.js";
import { applyInstitutionalTheme } from "./theme.js";


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

        if (val.length <= 6 && !val.startsWith("1000")) {
            val = "1000" + val;
        }

        DOM.matricula.value = val;

        const erroEl = document.getElementById("erroMatricula");

        if (STATE.employeeList[val]) {

            const militar = STATE.employeeList[val];
            DOM.nome.value =
                typeof militar === "object" ? militar.nome : militar;

            if (erroEl) erroEl.style.display = "none";

            registrarLog(
                "VALIDACAO",
                `Matrícula ${val} identificada`,
                "SUCESSO"
            );

            applyInstitutionalTheme(val);

        } else {

            DOM.nome.value = "";

            if (erroEl) erroEl.style.display = "block";

            registrarLog(
                "VALIDACAO",
                `Matrícula ${val} não encontrada`,
                "AVISO"
            );

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

    document
        .getElementById("btnCloseModal")
        ?.addEventListener("click", () => {
            if (DOM.modal) DOM.modal.style.display = "none";
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
        showModal("AVISO", "Informe uma matrícula válida.", "⚠️", "orange");
        return;
    }

    try {

        const historico = await buscarHistorico(matricula);

        if (!historico || historico.length === 0) {
            showModal(
                "HISTÓRICO",
                "Nenhum registro encontrado para esta matrícula.",
                "ℹ️",
                "#1976D2"
            );
            return;
        }

        const conteudo = historico
            .map(item =>
                `${item.data} - ${item.tipo || "Registro"}`
            )
            .join("<br>");

        showModal(
            "HISTÓRICO",
            conteudo,
            "📜",
            "#1976D2"
        );

        registrarLog(
            "HISTORICO",
            `Consulta realizada para matrícula ${matricula}`,
            "INFO"
        );

    } catch (err) {

        registrarLog(
            "HISTORICO_ERRO",
            err.message,
            "ERRO"
        );

        showModal(
            "ERRO",
            "Não foi possível buscar o histórico.",
            "❌",
            "red"
        );
    }
}
