package br.maua.busmaua.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

/** Saída programada de uma linha (grade de horários). */
@Entity
@Table(name = "horarios")
@Getter
@Setter
@NoArgsConstructor
public class Horario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Linha linha;

    @Column(nullable = false)
    private LocalTime horaSaida;

    /** Ex.: "Bloco A". */
    private String localSaida;

    /** Veículo normalmente escalado; o motorista pode trocar ao iniciar a viagem. */
    @ManyToOne
    private Veiculo veiculoPadrao;

    private boolean ativo = true;

    public Horario(Linha linha, LocalTime horaSaida, String localSaida, Veiculo veiculoPadrao) {
        this.linha = linha;
        this.horaSaida = horaSaida;
        this.localSaida = localSaida;
        this.veiculoPadrao = veiculoPadrao;
    }
}
