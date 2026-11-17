package br.maua.busmaua.security;

import br.maua.busmaua.domain.Perfil;

/** Dados do usuário autenticado, extraídos do token JWT. */
public record UsuarioLogado(Long id, String nome, String email, Perfil perfil) {
}
