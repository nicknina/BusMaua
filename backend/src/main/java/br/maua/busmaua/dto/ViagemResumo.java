package br.maua.busmaua.dto;

import br.maua.busmaua.domain.StatusViagem;

import java.time.Instant;
import java.time.LocalDate;

/** Situação de uma viagem, enviada ao app e publicada em /topic/frota. */
public record ViagemResumo(
        Long id,
        Long linhaId,
        String linha,
        String origem,
        String destino,
        String horaSaida,
        String localSaida,
        LocalDate data,
        StatusViagem status,
        VeiculoDto veiculo,
        String motorista,
        Double latitude,
        Double longitude,
        Double velocidadeKmh,
        Instant posicaoAtualizadaEm,
        int lotacao,
        int capacidade,
        long naFila,
        int atrasoMinutos,
        String motivoAtraso,
        /* minutos até a saída, enquanto a viagem não começou */
        Integer minutosParaSaida,
        Instant saidaLiberadaEm) {
}
