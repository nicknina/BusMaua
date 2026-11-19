package br.maua.busmaua.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Perfil perfil;

    private Instant criadoEm = Instant.now();

    /** Contas desativadas pela administração não conseguem entrar (ex.: motorista desligado). */
    private Boolean ativo = true;

    public Usuario(String nome, String email, String senhaHash, Perfil perfil) {
        this.nome = nome;
        this.email = email.toLowerCase();
        this.senhaHash = senhaHash;
        this.perfil = perfil;
    }

    public boolean estaAtivo() {
        return ativo == null || ativo;
    }

    /** "Ana Paula Ferreira" vira "Ana F." — evita expor o nome completo para o motorista. */
    public String nomeCurto() {
        String[] partes = nome.trim().split("\\s+");
        if (partes.length == 1) {
            return partes[0];
        }
        return partes[0] + " " + partes[partes.length - 1].charAt(0) + ".";
    }

    public String primeiroNome() {
        return nome.trim().split("\\s+")[0];
    }

    public String iniciais() {
        String[] partes = nome.trim().split("\\s+");
        String primeira = partes[0].substring(0, 1);
        String ultima = partes.length > 1 ? partes[partes.length - 1].substring(0, 1) : "";
        return (primeira + ultima).toUpperCase();
    }
}
