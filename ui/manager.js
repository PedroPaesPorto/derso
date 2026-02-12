// ui/manager.js
import { DOM } from "../core/dom.js";

/**
 * UI Manager - Centraliza todas as interações visuais e manipulação de DOM
 */
export const UI = {
    
   // --- GESTÃO DE MODAIS ---
    modal: {
        show(title, text, icon, color, showHistory = false) {
            if (!DOM.modal) return;

            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalText').textContent = text;

            const iconDiv = document.getElementById('modalIcon');
            if (iconDiv) {
                iconDiv.textContent = icon;
                iconDiv.style.color = color;
            }

            if (DOM.historyContent) {
                DOM.historyContent.classList.toggle('is-hidden', !showHistory);
            }

            DOM.modal.style.display = 'flex';
        },

        // MANTENHA O CLOSE E ADICIONE O HIDE APONTANDO PARA ELE
        close() {
            if (DOM.modal) DOM.modal.style.display = 'none';
        },
        
        hide() {
            this.close(); // Agora o hide() funciona chamando o close()
        }
    },

    // --- ESTADOS DE CARREGAMENTO (LOADING) ---
    loading: {
        show(message = "A carregar...") {
            if (!DOM.loading) return;
            DOM.loading.textContent = message;
            DOM.loading.classList.remove("is-hidden");
            
            // Esconde o formulário enquanto carrega para um visual mais limpo
            DOM.formContent?.classList.add("is-hidden");
        },

        hide() {
            if (!DOM.loading) return;
            DOM.loading.classList.add("is-hidden");
            DOM.formContent?.classList.remove("is-hidden");
        }
    },

    // --- FEEDBACKS VISUAIS E ANIMAÇÕES ---
    feedback: {
        /** Bloqueia o formulário durante o envio */
        lockForm() {
            DOM.form?.classList.add("form-locked");
        },

        /** Desbloqueia o formulário */
        unlockForm() {
            DOM.form?.classList.remove("form-locked");
        },

        /** Animação de erro (abanar) */
        shake(el) {
            if (!el) return;
            el.classList.add("ui-shake");
            setTimeout(() => el.classList.remove("ui-shake"), 600);
        },

        /** Animação de sucesso (brilho/flash) */
        flash(el) {
            if (!el) return;
            el.classList.add("ui-flash");
            setTimeout(() => el.classList.remove("ui-flash"), 800);
        },

        scrollToTop() {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    },

    // --- COMPONENTES ESPECÍFICOS ---
    
    /** Atualiza a barra de progresso do formulário */
    updateProgress() {
        if (!DOM.barra || !DOM.email || !DOM.nome || !DOM.data) return;

        const checks = [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(DOM.email.value.trim()), // Email válido
            DOM.nome.value.trim().length > 3,                         // Nome preenchido
            !!document.querySelector('input[name="folga"]:checked'),  // Tipo de folga selecionado
            DOM.data.value.trim() !== ""                              // Data selecionada
        ];

        const total = checks.length;
        const completed = checks.filter(Boolean).length;
        const percentage = (completed / total) * 100;

        DOM.barra.style.width = `${percentage}%`;
        DOM.barra.classList.toggle("barra-completa", percentage === 100);
    },

    /** Altera o estado do botão de envio */
    setButtonState(btn, isLoading, text = "A ENVIAR...") {
        if (!btn) return;
        
        if (isLoading) {
            btn.dataset.originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = text;
        } else {
            btn.disabled = false;
            btn.textContent = btn.dataset.originalText || "ENVIAR";
        }
    }
};
