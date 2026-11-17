package br.maua.busmaua.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "veiculos")
@Getter
@Setter
@NoArgsConstructor
public class Veiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nome exibido para os alunos, ex.: "Ônibus 02". */
    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String placa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoVeiculo tipo;

    @Column(nullable = false)
    private int capacidade;

    private boolean ativo = true;

    public Veiculo(String nome, String placa, TipoVeiculo tipo, int capacidade) {
        this.nome = nome;
        this.placa = placa;
        this.tipo = tipo;
        this.capacidade = capacidade;
    }

    /** "O ônibus" / "A van", para montar as mensagens. */
    public String artigoETipo() {
        return tipo == TipoVeiculo.VAN ? "A van" : "O ônibus";
    }
}
