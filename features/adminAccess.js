import { iniciarPainelAdmin } from "./admin.js";

let contadorCliques = 0;
let temporizador = null;

export function configurarAcessoAdmin() {
    const footer = document.getElementById("footerText");
    if (!footer) return;

    footer.addEventListener("click", () => {
        contadorCliques++;

        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
            contadorCliques = 0;
        }, 2000);

        if (contadorCliques >= 5) {
            contadorCliques = 0;
            abrirModalAdmin();
        }
    });

    // Evento do botão ENTRAR
    const btnLogin = document.getElementById("btnAdminLogin");
    btnLogin?.addEventListener("click", validarAcessoAdmin);
}

function abrirModalAdmin() {
    const modal = document.getElementById("adminLoginModal");
    modal?.classList.remove("is-hidden");
}

function fecharModalAdmin() {
    const modal = document.getElementById("adminLoginModal");
    modal?.classList.add("is-hidden");
}

function validarAcessoAdmin() {
    const input = document.getElementById("adminMatricula");
    const matricula = input?.value.trim();

    // ⚠️ DEFINA AQUI SUA MATRÍCULA ADMIN
    const ADMIN_MATRICULA = "300199600"; 

    if (matricula === ADMIN_MATRICULA) {
        fecharModalAdmin();
        iniciarPainelAdmin();
    } else {
        alert("Matrícula não autorizada.");
        input.value = "";
    }
}
