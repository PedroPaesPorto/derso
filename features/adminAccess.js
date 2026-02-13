let contadorCliques = 0;
let temporizador = null;

export function configurarAcessoAdmin() {
    const footer = document.getElementById("footerText");
    if (!footer) return;

    footer.addEventListener("click", () => {
        contadorCliques++;

        // Reseta após 2 segundos sem clicar
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
            contadorCliques = 0;
        }, 2000);

        if (contadorCliques >= 5) {
            contadorCliques = 0;
            abrirModalAdmin();
        }
    });
}

function abrirModalAdmin() {
    const modal = document.getElementById("adminLoginModal");
    if (modal) {
        modal.classList.remove("is-hidden");
    }
}
