package br.maua.busmaua.dto;

import br.maua.busmaua.domain.*;
import br.maua.busmaua.util.Fuso;
import jakarta.validation.constraints.*;

import java.util.Comparator;
import java.util.List;

/** Entradas e saídas das telas de gestão da administração. */
public final class GestaoDtos {

    private GestaoDtos() {
    }

    // ---------------------------------------------------------------- saídas

    public record VeiculoAdmin(Long id, String nome, String placa, TipoVeiculo tipo, int capacidade, boolean ativo) {
        public static VeiculoAdmin de(Veiculo v) {
            return new VeiculoAdmin(v.getId(), v.getNome(), v.getPlaca(), v.getTipo(), v.getCapacidade(), v.isAtivo());
        }
    }

    public record HorarioAdmin(Long id, String horaSaida, String localSaida, VeiculoDto veiculo, boolean ativo) {
        public static HorarioAdmin de(Horario h) {
            return new HorarioAdmin(h.getId(), Fuso.hhmm(h.getHoraSaida()), h.getLocalSaida(),
                    VeiculoDto.de(h.getVeiculoPadrao()), h.isAtivo());
        }
    }

    /** Linha com todas as paradas e todos os horários, inclusive os desativados. */
    public record LinhaAdmin(Long id, String nome, String origem, String destino,
                             List<LinhaDto.ParadaDto> paradas, List<HorarioAdmin> horarios) {
        public static LinhaAdmin de(Linha l) {
            return new LinhaAdmin(l.getId(), l.getNome(), l.getOrigem(), l.getDestino(),
                    l.getParadas().stream()
                            .sorted(Comparator.comparingInt(Parada::getOrdem))
                            .map(LinhaDto.ParadaDto::de).toList(),
                    l.getHorarios().stream()
                            .sorted(Comparator.comparing(Horario::getHoraSaida))
                            .map(HorarioAdmin::de).toList());
        }
    }

    public record UsuarioAdmin(Long id, String nome, String email, Perfil perfil, boolean ativo) {
        public static UsuarioAdmin de(Usuario u) {
            return new UsuarioAdmin(u.getId(), u.getNome(), u.getEmail(), u.getPerfil(), u.estaAtivo());
        }
    }

    // ---------------------------------------------------------------- entradas

    public record VeiculoForm(
            @NotBlank(message = "Informe o nome do veículo.") @Size(max = 60) String nome,
            @NotBlank(message = "Informe a placa.") @Size(max = 10) String placa,
            @NotNull(message = "Escolha o tipo do veículo.") TipoVeiculo tipo,
            @Min(value = 1, message = "A capacidade deve ser de pelo menos 1 lugar.")
            @Max(value = 120, message = "Capacidade muito alta.") int capacidade,
            Boolean ativo) {
    }

    public record HorarioForm(
            @NotBlank(message = "Informe o horário de saída.")
            @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Use o formato HH:mm.") String horaSaida,
            @Size(max = 60) String localSaida,
            Long veiculoId,
            Boolean ativo) {
    }

    public record LinhaForm(
            @NotBlank(message = "Informe o nome da linha.") @Size(max = 100) String nome,
            @NotBlank(message = "Informe a origem.") @Size(max = 80) String origem,
            @NotBlank(message = "Informe o destino.") @Size(max = 80) String destino) {
    }

    public record ParadaForm(
            @NotBlank(message = "Informe o nome da parada.") @Size(max = 100) String nome,
            @Size(max = 40) String descricao,
            @NotNull(message = "Informe a latitude.") @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @NotNull(message = "Informe a longitude.") @DecimalMin("-180") @DecimalMax("180") Double longitude,
            @Min(value = 0, message = "O tempo desde a saída não pode ser negativo.")
            @Max(value = 300, message = "Tempo muito longo.") int minutosDesdeSaida) {
    }

    public record NovoMotorista(
            @NotBlank(message = "Informe o nome.") @Size(max = 120) String nome,
            @NotBlank(message = "Informe o e-mail.") @Email(message = "E-mail inválido.") String email,
            @NotBlank(message = "Informe uma senha inicial.")
            @Size(min = 6, max = 72, message = "A senha deve ter pelo menos 6 caracteres.") String senha) {
    }

    public record EdicaoUsuario(
            @NotBlank(message = "Informe o nome.") @Size(max = 120) String nome,
            @NotNull Boolean ativo) {
    }

    public record RedefinirSenha(
            @NotBlank(message = "Informe o e-mail da conta.") @Email(message = "E-mail inválido.") String email,
            @NotBlank(message = "Informe a nova senha.")
            @Size(min = 6, max = 72, message = "A senha deve ter pelo menos 6 caracteres.") String novaSenha) {
    }
}
