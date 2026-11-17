package br.maua.busmaua.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Aviso exibido no app. Sem usuário, é um aviso geral da linha
 * (ex.: "Ônibus 02 iniciou a viagem") visível para todos os alunos.
 */
@Entity
@Table(name = "notificacoes")
@Getter
@Setter
@NoArgsConstructor
public class Notificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Usuario usuario;

    @ManyToOne
    private Linha linha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoNotificacao tipo;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, length = 500)
    private String mensagem;

    @Column(nullable = false)
    private Instant criadaEm = Instant.now();

    public Notificacao(Usuario usuario, Linha linha, TipoNotificacao tipo, String titulo, String mensagem) {
        this.usuario = usuario;
        this.linha = linha;
        this.tipo = tipo;
        this.titulo = titulo;
        this.mensagem = mensagem;
    }
}
