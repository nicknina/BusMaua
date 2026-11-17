package br.maua.busmaua.dto;

import br.maua.busmaua.domain.Perfil;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(
        @NotBlank(message = "Informe o e-mail.") String email,
        @NotBlank(message = "Informe a senha.") String senha,
        @NotNull(message = "Escolha Aluno ou Motorista.") Perfil perfil) {
}
