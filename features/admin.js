// features/admin.js
import { STATE } from "../core/state.js";
import { DOM } from "../core/dom.js";
import { CONFIG } from "../core/config.js";
import { UI } from "../ui/manager.js";
import { registrarLog } from "../services/logger.js";

/**
 * Inicia o Painel Administrativo Completo
 */
export async function iniciarPainelAdmin() {
    STATE.isAdminMode = true;
    registrarLog("ADMIN", "Iniciando Dashboard Operacional", "INFO");

      // 1. Substitui o formulário pela interface de Dashboard
DOM.formContent.replaceChildren();
DOM.formContent.innerHTML = `

        <div class="admin-wrapper">
            <div class="admin-header">
                <div>
                    <h3 style="margin:0; color:var(--azul-marinho);">📊 PAINEL DERSO</h3>
                    <small style="color:var(--texto-secundario);">Gestão de Escala 1º BPM</small>
                </div>
                <button id="btnAdminExit" class="btn-exit">SAIR</button>
            </div>

            <div class="admin-stats">
                <div class="stat-box">
                    <span id="countTotal">0</span>
                    <label>Solicitações</label>
                </div>
                <div class="stat-box">
                    <span id="countHoje">0</span>
                    <label>Para Hoje</label>
                </div>
            </div>

            <div class="admin-tools">
                <input type="text" id="adminSearch" placeholder="🔍 Buscar nome ou matrícula..." class="admin-input">
                <button id="btnExportCSV" class="btn-export">📥 EXPORTAR CSV</button>
            </div>

            <div class="admin-table-scroll">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>MILITAR</th>
                            <th>DATA</th>
                            <th>TIPO</th>
                        </tr>
                    </thead>
                    <tbody id="adminTableBody">
                        <tr><td colspan="3" style="text-align:center; padding:20px;">Sincronizando banco de dados...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // 2. Busca os dados reais
    await carregarDadosGlobais();

    // 3. Eventos de Busca e Exportação
   document.getElementById("adminSearch")?.addEventListener("input", filtrarPainel);
document.getElementById("btnExportCSV")?.addEventListener("click", exportarParaEscala);
document.getElementById("btnAdminExit")?.addEventListener("click", () => location.reload());
}

async function carregarDadosGlobais() {
    try {
        // Chamada para a sua API do Google Apps Script (Action que lê tudo)
        const resp = await fetch(`${CONFIG.API_URL}?action=readAll`);
        const dados = await resp.json();

        if (!Array.isArray(dados)) throw new Error("Dados inválidos");

        STATE.listaCompletaAdmin = dados; // Salva no estado global para filtro rápido
        atualizarInterfaceAdmin(dados);

    } catch (err) {
        console.error(err);
        document.getElementById("adminTableBody").innerHTML = `<tr><td colspan="3" style="color:red; text-align:center;">Erro ao carregar dados.</td></tr>`;
    }
}

function atualizarInterfaceAdmin(lista) {
    const tbody = document.getElementById("adminTableBody");
    const totalEl = document.getElementById("countTotal");
    const hojeEl = document.getElementById("countHoje");

    totalEl.textContent = lista.length;
    
    // Conta quantos são para a data de hoje
    const hojeStr = new Date().toLocaleDateString('pt-BR');
    hojeEl.textContent = lista.filter(i => i.data === hojeStr).length;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Nenhum registro encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(item => `
        <tr>
            <td>
                <div style="font-weight:700; font-size:13px;">${item.nome || "Não Identificado"}</div>
                <div style="font-size:11px; color:#666;">Mat: ${item.matricula}</div>
            </td>
            <td style="font-size:12px; font-weight:bold;">${item.data}</td>
            <td><span class="tag-folga">${item.folga || item.tipo}</span></td>
        </tr>
    `).join("");
}

function filtrarPainel(e) {
    const termo = e.target.value.toLowerCase();
    const filtrados = STATE.listaCompletaAdmin.filter(i => 
        (i.nome && i.nome.toLowerCase().includes(termo)) || 
        (i.matricula && i.matricula.toString().includes(termo))
    );
    atualizarInterfaceAdmin(filtrados);
}

function exportarParaEscala() {
    const dados = STATE.listaCompletaAdmin;
    if (!dados || dados.length === 0) return;

    let csv = "\ufeffDATA;MATRICULA;NOME;TIPO_FOLGA\n";
    dados.forEach(i => {
        csv += `${i.data};${i.matricula};${i.nome};${i.folga || i.tipo}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `DERSO_1BPM_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
}
