package br.maua.busmaua.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "paradas")
@Getter
@Setter
@NoArgsConstructor
public class Parada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Linha linha;

    @Column(nullable = false)
    private int ordem;

    @Column(nullable = false)
    private String nome;

    /** Texto auxiliar exibido no itinerário, ex.: "Saída" ou "Chegada". */
    private String descricao;

    private double latitude;

    private double longitude;

    /** Tempo previsto, em minutos, entre a saída e a passagem por esta parada. */
    private int minutosDesdeSaida;

    public Parada(Linha linha, int ordem, String nome, String descricao, double latitude, double longitude, int minutosDesdeSaida) {
        this.linha = linha;
        this.ordem = ordem;
        this.nome = nome;
        this.descricao = descricao;
        this.latitude = latitude;
        this.longitude = longitude;
        this.minutosDesdeSaida = minutosDesdeSaida;
    }
}
