// main.js
import { CONFIG } from "./core/config.js";
import { STATE } from "./core/state.js";
import { DOM } from "./core/dom.js";
import { UI } from "./ui/manager.js";
import { registrarLog } from "./services/logger.js";
import { applyInstitutionalTheme, applyDarkModeStyles } from "./services/theme.js";
import { monitorarPrazos } from "./services/prazo.js";
import { setupEvents } from "./handlers/events.js";
import { updateFooter } from "./services/footer.js";
import { restaurarRascunho } from "./services/storage.js";

/**
 * PONTO DE ENTRADA ÚNICO (Bootstrap)
 */
async function bootstrap() {
    registrarLog("SISTEMA", "Iniciando motor DERSO v5...", "INFO");

    // 1. Validação básica de ambiente
    if (!DOM.loading || !DOM.formContent) {
        console.error("Falha Crítica: Elementos essenciais não encontrados no HTML.");
        return;
    }

    try {
        // 2. Estado Inicial de Interface
        UI.loading.show("Sincronizando com o servidor...");
        applyDarkModeStyles();

        // 3. Busca de Dados em Paralelo (Otimização de Performance)
        registrarLog("SISTEMA", "Buscando dados institucionais...");
        
        const [datasResp, listaResp] = await Promise.all([
            fetch(`${CONFIG.API_URL}?action=datas`),
            fetch(`${CONFIG.API_URL}?action=lista`)
        ]);

        if (!datasResp.ok || !listaResp.ok) throw new Error("Erro na rede ao buscar dados.");

        const dData = await datasResp.json();
        const lData = await listaResp.json();

        // 4. População do Estado (STATE)
        STATE.employeeList = lData || {};
        registrarLog("SISTEMA", "Dados carregados com sucesso.", "SUCESSO");

        // 5. Ativação de Serviços
        if (dData?.abertura && dData?.fechamento) {
            monitorarPrazos(dData.abertura, dData.fechamento);
        }

        // 6. Configuração da Interface
        applyInstitutionalTheme();
        updateFooter();
        setupEvents(); // Liga os cliques e inputs

        // 7. Verificação de Rascunho
        const rascunho = restaurarRascunho();
        if (rascunho && DOM.form) {
            registrarLog("SISTEMA", "Rascunho detectado.");
            // Lógica opcional para repopular aqui
        }

        // 8. Finalização
        UI.loading.hide();
        registrarLog("SISTEMA", "Sistema pronto para operações.", "SUCESSO");

    } catch (error) {
        registrarLog("FALHA_CRITICA", error.message, "ERRO");
        UI.loading.show(`Erro na inicialização: ${error.message}`);
        
        UI.modal.show(
            "ERRO DE SISTEMA",
            "Não foi possível conectar ao banco de dados. Verifique sua conexão.",
            "📡",
            "red"
        );
    }
}

// Inicia o sistema quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", bootstrap);
