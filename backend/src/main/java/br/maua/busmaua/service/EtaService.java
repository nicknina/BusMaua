package br.maua.busmaua.service;

import br.maua.busmaua.domain.Parada;
import br.maua.busmaua.domain.StatusViagem;
import br.maua.busmaua.domain.Viagem;
import br.maua.busmaua.util.Fuso;
import br.maua.busmaua.util.Geo;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

/** Estimativas de tempo de chegada (ETA). */
@Service
public class EtaService {

    /** Minutos até a saída programada (com atraso), enquanto a viagem não começou. */
    public Integer minutosParaSaida(Viagem v) {
        if (v.getStatus() != StatusViagem.AGENDADA) {
            return null;
        }
        LocalDateTime saida = LocalDateTime.of(v.getData(), v.getHorario().getHoraSaida())
                .plusMinutes(v.getAtrasoMinutos());
        return minutosAte(saida);
    }

    /**
     * Minutos até o veículo chegar a uma parada. Com a viagem em curso e GPS ativo usa a
     * posição real; antes disso usa a grade de horários.
     */
    public Integer ateParada(Viagem v, Parada p) {
        if (v.getStatus() == StatusViagem.ENCERRADA) {
            return null;
        }
        if (v.getStatus().emCurso() && v.getLatitude() != null && v.getLongitude() != null) {
            return Geo.minutosAte(v.getLatitude(), v.getLongitude(), p.getLatitude(), p.getLongitude(), v.getVelocidadeKmh());
        }
        LocalDateTime previsto = LocalDateTime.of(v.getData(), v.getHorario().getHoraSaida())
                .plusMinutes(v.getAtrasoMinutos() + p.getMinutosDesdeSaida());
        return minutosAte(previsto);
    }

    private int minutosAte(LocalDateTime momento) {
        long segundos = Duration.between(Fuso.agora(), momento).getSeconds();
        return (int) Math.max(0, Math.ceil(segundos / 60.0));
    }
}
