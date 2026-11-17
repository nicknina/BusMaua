package br.maua.busmaua.dto;

import br.maua.busmaua.domain.Perfil;
import br.maua.busmaua.domain.Usuario;

public record UsuarioDto(Long id, String nome, String email, Perfil perfil) {

    public static UsuarioDto de(Usuario u) {
        return new UsuarioDto(u.getId(), u.getNome(), u.getEmail(), u.getPerfil());
    }
}
