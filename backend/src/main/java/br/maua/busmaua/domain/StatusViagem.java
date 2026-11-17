package br.maua.busmaua.domain;

import java.util.List;

public enum StatusViagem {
    AGENDADA,
    EM_ANDAMENTO,
    PAUSADA,
    ENCERRADA;

    /** Status em que o veículo está na rua com um motorista. */
    public static final List<StatusViagem> EM_CURSO = List.of(EM_ANDAMENTO, PAUSADA);

    public boolean emCurso() {
        return this == EM_ANDAMENTO || this == PAUSADA;
    }
}
