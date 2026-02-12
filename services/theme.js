// services/theme.js

// ✅ Corrigido: Saindo da pasta 'services' para a 'core'
import { STATE } from "../core/state.js";
import { registrarLog } from "./logger.js"; // ./ pois estão na mesma pasta

/* ==============================
    DARK MODE AUTOMÁTICO
============================== */
export function applyDarkModeStyles() {
    // Detecta se o sistema do usuário está em modo dark
    if (!window.matchMedia || !window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return;
    }

    if (document.getElementById("darkModeStyle")) return;

    registrarLog("INTERFACE", "Modo Noturno aplicado", "INFO");

    const style = document.createElement("style");
    style.id = "darkModeStyle";

    style.innerHTML = `
        @media (prefers-color-scheme: dark) {
            body { background-color: #121212 !important; color: #e0e0e0 !important; }
            .container { background: #1e1e1e !important; border: 1px solid #333 !important; }
            input:not([type="radio"]), select, textarea { 
                background: #2d2d2d !important; 
                color: #fff !important; 
                border-color: #444 !important; 
            }
            .radio-group label { 
                background: #2d2d2d; 
                border-color: #444; 
                color: #eee; 
            }
            .subtitle { color: #bbb !important; }
            #prazoBox { box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
        }
    `;

    document.head.appendChild(style);
}


/* ==============================
    TEMA INSTITUCIONAL DINÂMICO
============================== */
export function applyInstitutionalTheme(matriculaLogada = null) {

    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth() + 1;
    const chaveHoje = `${diaAtual}-${mesAtual}`;

    // Mês seguinte é o mês de referência da escala
    const dataRef = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    const mesReferencia = dataRef.getMonth();

    const instDiv = document.getElementById("instMessage");
    if (!instDiv) return;

    const aplicar = (msg) => instDiv.innerHTML = msg;


    /* 1. PRIORIDADE MÁXIMA — ANIVERSÁRIO */
    if (matriculaLogada && STATE.employeeList[matriculaLogada]) {
        const militar = STATE.employeeList[matriculaLogada];

        // Se o niver no JSON estiver no formato "D-M" (ex: "12-2")
        if (militar.niver === chaveHoje) {
            const primeiroNome = (militar.nome || "").split(" ")[0];

            return aplicar(
                `🎂 <b>Parabéns, ${primeiroNome}!</b><br>
                O 1º BPM celebra seu dia. Saúde, honra e vida longa, combatente! 🫡`
            );
        }
    }

    /* 2. DATAS COMEMORATIVAS FIXAS */
    const temasPontuais = {
        "4-1": `🌳 Rondônia: ${hoje.getFullYear() - 1982} anos de história e bravura.`,
        "10-2": "🌸 10 de Fevereiro: Dia da Policial Militar. Nossa continência àquelas que honram a farda da PMRO.",
        "1-5": "🛠️ Dia do Trabalhador: O serviço público move a cidadania.",
        "7-9": "🇧🇷 7 de Setembro: Independência se constrói com Ordem e Progresso.",
        "15-11": `🇧🇷 15 de Novembro: Proclamação da República (${hoje.getFullYear() - 1889} anos).`,
        "7-12": `🛡️ 1º BPM: O Sentinela da Capital. ${hoje.getFullYear() - 1983} anos de compromisso.`
    };

    if (temasPontuais[chaveHoje]) {
        return aplicar(temasPontuais[chaveHoje]);
    }

    /* 3. MENSAGEM MENSAL */
    const mensais = {
        0: "🎭 Janeiro: Planejamento estratégico para o novo ano.",
        1: "🎊 Fevereiro: Foco e prevenção na segurança dos eventos.",
        2: "🌷 Março: Homenagem às mulheres que honram a farda.",
        3: "🕊️ Abril: Tempo de renovação e fortalecimento da união.",
        4: "🤱 Maio: Reconhecemos as mães que sustentam famílias e carreiras.",
        5: "🔥 Junho: Valorizando cultura e tradição com responsabilidade.",
        6: "👮 Julho: Disciplina e prontidão no policiamento ostensivo.",
        7: "👔 Agosto: Família é alicerce da missão profissional.",
        8: "🇧🇷 Setembro: Renovamos nosso juramento de servir e proteger.",
        9: "🎗️ Outubro: Prevenção é compromisso com a vida.",
        10: `📜 Novembro: Compromisso com os ideais republicanos.`,
        11: "🎄 Dezembro: Planejamento garante um final de ano seguro."
    };

    aplicar(mensais[mesReferencia] || "DERSO 1º BPM - Sentinela da Capital");
}
