package br.maua.busmaua.dto;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record Resumo(int veiculosAtivos, int viagensHoje, int viagensEmAndamento,
                         int solicitacoesHoje, int embarquesHoje) {
    }

    /**
     * Demanda média por horário no período. A indicação de veículo é só um apoio
     * para a gestão: a escala da frota continua sendo decidida pela administração.
     */
    public record DemandaHorario(Long horarioId, String linha, String horaSaida,
                                 int viagensNoPeriodo, double mediaSolicitacoes, double mediaEmbarques,
                                 double taxaComparecimento, String veiculoEscalado, int capacidadeEscalada,
                                 double ocupacaoMedia, String indicacao) {
    }
}
