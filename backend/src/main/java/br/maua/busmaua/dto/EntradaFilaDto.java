package br.maua.busmaua.dto;

import br.maua.busmaua.domain.FilaEntrada;
import br.maua.busmaua.domain.StatusFila;

import java.time.Instant;

/** Aluno na fila, como aparece para o motorista (nome abreviado, sem e-mail). */
public record EntradaFilaDto(Long id, String nome, String iniciais, String parada, StatusFila status,
                             Instant entrouEm, Instant embarcadoEm) {

    public static EntradaFilaDto de(FilaEntrada e) {
        return new EntradaFilaDto(e.getId(), e.getAluno().nomeCurto(), e.getAluno().iniciais(),
                e.getParada().getNome(), e.getStatus(), e.getEntrouEm(), e.getEmbarcadoEm());
    }
}
