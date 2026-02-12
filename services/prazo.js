import { DOM } from "./dom.js";
import { STATE } from "./state.js";

let intervaloPrazo = null;

export function monitorarPrazos(dataAbertura, dataFechamento) {

    if (!DOM.data || !DOM.prazoBox || !DOM.timerDisplay) return;

    const abertura = new Date(dataAbertura).getTime();
    const fechamento = new Date(dataFechamento).getTime();

    const hoje = new Date();

    /* =============================
       PERÍODO MÊS SEGUINTE
    ============================= */

    const mesSeguinte = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();

    const dataMinima = new Date(ano, mesSeguinte, 1);
    const dataMaxima = new Date(ano, mesSeguinte + 1, 0);

    DOM.data.min = dataMinima.toISOString().split("T")[0];
    DOM.data.max = dataMaxima.toISOString().split("T")[0];
    DOM.data.value = "";

    criarInfoPeriodo(dataMinima, dataMaxima);

    const nomeMesRef = dataMinima
        .toLocaleString("pt-BR", { month: "long" })
        .toUpperCase();

    const ultimoDiaMes = dataMaxima.getTime();

    if (intervaloPrazo) clearInterval(intervaloPrazo);

    intervaloPrazo = setInterval(() => {

        const agora = Date.now();
        const instDiv = document.getElementById("instMessage");

        DOM.prazoBox.classList.remove(
            "estado-verde",
            "estado-alerta",
            "estado-urgente",
            "estado-critico",
            "estado-sucesso",
            "estado-inspecao"
        );

        if (agora < abertura) {

            STATE.isClosed = true;
            DOM.form?.style && (DOM.form.style.display = "none");
            instDiv?.style && (instDiv.style.display = "none");

            DOM.prazoBox.classList.add("estado-inspecao");

            atualizarTimer(abertura - agora, `
                <b style="color:#1A3C6E">ESTAMOS PASSANDO EM INSPEÇÃO AO CÓDIGO.</b><br>
                Voltamos em:
            `);
        }

        else if (agora > fechamento) {

            STATE.isClosed = true;
            DOM.form?.style && (DOM.form.style.display = "none");
            instDiv?.style && (instDiv.style.display = "none");

            if (agora <= ultimoDiaMes) {

                DOM.consultaFechada?.style && (DOM.consultaFechada.style.display = "block");
                DOM.btnHistoryFechado?.style && (DOM.btnHistoryFechado.style.display = "block");

                DOM.prazoBox.classList.add("estado-sucesso");

                DOM.timerDisplay.innerHTML = `
                    <b style="color:#2E7D32">MISSÃO CUMPRIDA!</b><br>
                    Solicitações de <b>${nomeMesRef}</b> encerradas.
                `;
            }
            else {
                DOM.timerDisplay.innerHTML =
                    "⌛ Aguardando novo cronograma de escalas...";
            }
        }

        else {

            STATE.isClosed = false;
            DOM.form?.style && (DOM.form.style.display = "block");
            instDiv?.style && (instDiv.style.display = "block");

            const diff = fechamento - agora;

            if (diff < 7200000) {
                DOM.prazoBox.classList.add("estado-critico");
                atualizarTimer(diff, "🔥 EMERGÊNCIA: TEMPO ACABANDO!");
            }
            else if (diff < 21600000) {
                DOM.prazoBox.classList.add("estado-urgente");
                atualizarTimer(diff, "⚠️ RÁPIDO! O TEMPO ESTÁ ACABANDO");
            }
            else if (diff < 86400000) {
                DOM.prazoBox.classList.add("estado-alerta");
                atualizarTimer(diff, "⏳ SISTEMA FECHA EM BREVE");
            }
            else {
                DOM.prazoBox.classList.add("estado-verde");
                atualizarTimer(diff, "⚡ OPERACIONAL ATIVO");
            }
        }

    }, 1000);
}


/* =============================
   FUNÇÕES AUXILIARES
============================= */

function atualizarTimer(diff, titulo) {

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    DOM.timerDisplay.innerHTML = `
        <b>${titulo}</b><br>
        <span style="font-weight:bold">${d}d ${h}h ${m}m ${s}s</span>
    `;
}

function criarInfoPeriodo(min, max) {

    let info = document.getElementById("infoPeriodo");

    if (!info && DOM.data?.parentNode) {
        info = document.createElement("small");
        info.id = "infoPeriodo";
        info.style.display = "block";
        info.style.marginTop = "5px";
        info.style.color = "#666";
        DOM.data.parentNode.appendChild(info);
    }

    if (info) {
        info.innerHTML =
            `📅 Período permitido: <b>${min.toLocaleDateString("pt-BR")}</b> a <b>${max.toLocaleDateString("pt-BR")}</b>`;
    }
}
