package br.maua.busmaua.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Registro de um aluno na fila virtual de uma viagem. */
@Entity
@Table(name = "fila_entradas")
@Getter
@Setter
@NoArgsConstructor
public class FilaEntrada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Viagem viagem;

    @ManyToOne(optional = false)
    private Usuario aluno;

    /** Ponto onde o aluno vai embarcar. */
    @ManyToOne(optional = false)
    private Parada parada;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusFila status = StatusFila.AGUARDANDO;

    @Column(nullable = false)
    private Instant entrouEm = Instant.now();

    private Instant chamadoEm;
    private Instant embarcadoEm;
    private Instant saiuEm;

    /** "ALUNO" ou "MOTORISTA": quem registrou o embarque. */
    private String confirmadoPor;

    private boolean avisoChegadaEnviado;

    public FilaEntrada(Viagem viagem, Usuario aluno, Parada parada) {
        this.viagem = viagem;
        this.aluno = aluno;
        this.parada = parada;
    }
}
