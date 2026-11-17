package br.maua.busmaua.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

/** Uma saída de um horário em uma data específica. */
@Entity
@Table(name = "viagens", uniqueConstraints = @UniqueConstraint(columnNames = {"horario_id", "data_viagem"}))
@Getter
@Setter
@NoArgsConstructor
public class Viagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Horario horario;

    @ManyToOne(optional = false)
    private Linha linha;

    @Column(name = "data_viagem", nullable = false)
    private LocalDate data;

    @ManyToOne
    private Veiculo veiculo;

    @ManyToOne
    private Usuario motorista;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusViagem status = StatusViagem.AGENDADA;

    private Instant iniciadaEm;
    private Instant encerradaEm;
    private Instant saidaLiberadaEm;

    /** Última posição enviada pelo celular do motorista. */
    private Double latitude;
    private Double longitude;
    private Double velocidadeKmh;
    private Instant posicaoAtualizadaEm;

    private int lotacao;
    private int atrasoMinutos;
    private String motivoAtraso;

    public Viagem(Horario horario, LocalDate data) {
        this.horario = horario;
        this.linha = horario.getLinha();
        this.data = data;
    }

    /** Veículo da viagem ou, se ainda não começou, o veículo escalado no horário. */
    public Veiculo veiculoEfetivo() {
        return veiculo != null ? veiculo : horario.getVeiculoPadrao();
    }

    public int capacidade() {
        Veiculo v = veiculoEfetivo();
        return v == null ? 0 : v.getCapacidade();
    }

    public String nomeVeiculo() {
        Veiculo v = veiculoEfetivo();
        return v == null ? "Veículo" : v.getNome();
    }
}
