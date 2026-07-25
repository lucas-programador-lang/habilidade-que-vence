function fazerLogin(event) {
    event.preventDefault();
    let email = document.getElementById('login-email').value;
    localStorage.setItem('usuarioLogado', email);
    alert('Login realizado com sucesso!');
    window.location.href = 'index.html';
}

function fazerCadastro(event) {
    event.preventDefault();
    alert('Cadastro realizado com sucesso! Bônus de indicação (se houver) aplicado.');
    window.location.href = 'login.html';
}

function esqueciSenha() {
    let email = prompt('Digite seu e-mail cadastrado para recuperar a senha:');
    if(email) {
        alert('Instruções de recuperação enviadas para o seu e-mail!');
    }
}
