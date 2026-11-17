package br.maua.busmaua.dto;

import jakarta.validation.constraints.*;

/** Corpos de requisição pequenos usados pelos controllers. */
public final class Requisicoes {

    private Requisicoes() {
    }

    public record EntrarFila(
            @NotNull(message = "Escolha a saída.") Long viagemId,
            Long paradaId) {
    }

    public record IniciarViagem(
            @NotNull(message = "Escolha o veículo.") Long veiculoId,
            @NotNull(message = "Escolha o horário de saída.") Long horarioId) {
    }

    public record Localizacao(
            @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,
            @PositiveOrZero Double velocidadeKmh) {
    }

    public record Atraso(
            @Min(value = 1, message = "Informe o atraso em minutos.") @Max(value = 180, message = "Atraso muito longo.") int minutos,
            @Size(max = 200) String motivo) {
    }

    public record Lotacao(@Min(-60) @Max(60) int delta) {
    }
}
