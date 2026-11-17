package br.maua.busmaua.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UsuarioTest {

    @Test
    void abreviaNomeParaOMotorista() {
        Usuario u = new Usuario("Ana Paula Ferreira", "ana@maua.br", "x", Perfil.ALUNO);
        assertEquals("Ana F.", u.nomeCurto());
        assertEquals("AF", u.iniciais());
        assertEquals("Ana", u.primeiroNome());
    }

    @Test
    void nomeUnico() {
        Usuario u = new Usuario("Carlos", "CARLOS@maua.br", "x", Perfil.MOTORISTA);
        assertEquals("Carlos", u.nomeCurto());
        assertEquals("C", u.iniciais());
        assertEquals("carlos@maua.br", u.getEmail());
    }
}
