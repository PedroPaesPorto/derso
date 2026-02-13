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
 * Organiza a inicialização do sistema na ordem correta.
 */
async function bootstrap() {
    registrarLog("SISTEMA", "Iniciando motor DERSO v5...", "INFO");

    // 1. Validação básica de ambiente: Garante que o HTML tem o que o JS precisa
    if (!DOM.loading || !DOM.formContent) {
        console.error("Falha Crítica: Elementos essenciais não encontrados no HTML.");
        return;
    }

    try {
        // 2. Estado Inicial: Mostra o loading e aplica o tema visual
        UI.loading.show("Sincronizando com o servidor...");
        applyDarkModeStyles();

        // 3. Busca de Dados em Paralelo: Ganha tempo buscando tudo de uma vez
        registrarLog("SISTEMA", "Buscando dados institucionais...");
        
        const [datasResp, listaResp] = await Promise.all([
            fetch(`${CONFIG.API_URL}?action=datas`),
            fetch(`${CONFIG.API_URL}?action=lista`)
        ]);

        // Verifica se a rede deu algum erro (Ex: 404 ou 500)
        if (!datasResp.ok || !listaResp.ok) throw new Error("Erro na rede ao buscar dados.");

        const dData = await datasResp.json();
        const lData = await listaResp.json();

        // 4. População do Estado (STATE): Salva a lista de policiais na memória
        STATE.employeeList = lData || {};
        window.STATE = STATE;  // <-- ADICIONE ESSA LINHA AQUI
        registrarLog("SISTEMA", "Dados carregados com sucesso.", "SUCESSO");

        // 5. Ativação de Serviços: Monitora se o formulário está dentro do horário
        if (dData?.abertura && dData?.fechamento) {
            monitorarPrazos(dData.abertura, dData.fechamento);
        }

        // 6. Configuração da Interface: Cores, Rodapé e Eventos de Clique
        applyInstitutionalTheme();
        updateFooter();
        setupEvents(); // IMPORTANTE: Isso ativa os botões e validações

        // 7. Verificação de Rascunho: Tenta recuperar o que o usuário já tinha digitado
        const rascunho = restaurarRascunho();
        if (rascunho && DOM.form) {
            registrarLog("SISTEMA", "Rascunho detectado.");
            // Aqui você poderia preencher os campos automaticamente se quisesse
        }

        // 8. Finalização: Tudo certo! Esconde o loading e libera o formulário
        UI.loading.hide();
        registrarLog("SISTEMA", "Sistema pronto para operações.", "SUCESSO");

    } catch (error) {
        // CASO DE ERRO: Se qualquer coisa lá em cima der errado, cai aqui
        registrarLog("FALHA_CRITICA", error.message, "ERRO");
        
        // Primeiro: Escondemos o loading para limpar a tela
        UI.loading.hide();
        
        // Segundo: Mostramos o erro real no Modal (que agora está configurado no manager.js)
        UI.modal.show(
            "ERRO DE CONEXÃO",
            "Não foi possível conectar ao banco de dados. Verifique sua internet ou tente novamente.",
            "📡",
            "red"
        );
    }
}

// Inicia o sistema quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", bootstrap);
