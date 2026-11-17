package br.maua.busmaua.dto;

import br.maua.busmaua.domain.StatusFila;

import java.time.Instant;

/** Situação do aluno na fila virtual. */
public record FilaStatus(
        Long entradaId,
        StatusFila status,
        /* posição na fila (1 = primeiro); nulo quando já embarcou */
        Integer posicao,
        int alunosAFrente,
        int totalNaFila,
        Long paradaId,
        String parada,
        /* minutos até o veículo chegar ao ponto do aluno */
        Integer minutosAteVeiculo,
        /* se o aluno ainda cabe no veículo, considerando a lotação atual */
        boolean cabeNoVeiculo,
        /* prazo para embarcar quando o aluno é chamado */
        Instant prazoEmbarque,
        ViagemResumo viagem) {
}
