package br.maua.busmaua.domain;

import java.util.List;

public enum StatusFila {
    /** Aluno registrou a intenção de embarcar e aguarda a vez. */
    AGUARDANDO,
    /** Veículo está chegando e há lugar: o aluno tem alguns minutos para embarcar. */
    CHAMADO,
    /** Embarque confirmado pelo aluno ou pelo motorista. */
    EMBARCADO,
    /** Aluno saiu da fila por conta própria. */
    SAIU,
    /** Prazo de embarque terminou ou a viagem foi encerrada. */
    EXPIRADO;

    public static final List<StatusFila> ATIVOS = List.of(AGUARDANDO, CHAMADO);
}
