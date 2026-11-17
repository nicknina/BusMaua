package br.maua.busmaua.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CadastroRequest(
        @NotBlank(message = "Informe seu nome.") @Size(max = 120) String nome,
        @NotBlank(message = "Informe o e-mail institucional.") @Email(message = "E-mail inválido.") String email,
        @NotBlank(message = "Informe uma senha.") @Size(min = 6, max = 72, message = "A senha deve ter pelo menos 6 caracteres.") String senha) {
}
