import { STATE } from "./state.js";

export function registrarLog(acao, detalhes, tipo = "INFO") {
    const agora = new Date().toLocaleString("pt-BR");
    STATE.sessionLogs.push({ data: agora, acao, detalhes, tipo });

    const cores = { INFO: "🔵", SUCESSO: "🟢", AVISO: "🟡", ERRO: "🔴" };
    console.log(`${cores[tipo] || "⚪"} [${agora}] ${acao}:`, detalhes);
}
