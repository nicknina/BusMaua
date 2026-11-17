package br.maua.busmaua.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "linhas")
@Getter
@Setter
@NoArgsConstructor
public class Linha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ex.: "Mauá → Estação São Caetano". */
    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String origem;

    @Column(nullable = false)
    private String destino;

    @OneToMany(mappedBy = "linha", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    private List<Parada> paradas = new ArrayList<>();

    @OneToMany(mappedBy = "linha", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("horaSaida ASC")
    private List<Horario> horarios = new ArrayList<>();

    public Linha(String nome, String origem, String destino) {
        this.nome = nome;
        this.origem = origem;
        this.destino = destino;
    }

    public Parada adicionarParada(String nome, String descricao, double latitude, double longitude, int minutosDesdeSaida) {
        Parada parada = new Parada(this, paradas.size() + 1, nome, descricao, latitude, longitude, minutosDesdeSaida);
        paradas.add(parada);
        return parada;
    }

    public Horario adicionarHorario(java.time.LocalTime horaSaida, String localSaida, Veiculo veiculoPadrao) {
        Horario horario = new Horario(this, horaSaida, localSaida, veiculoPadrao);
        horarios.add(horario);
        return horario;
    }
}
