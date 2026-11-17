package br.maua.busmaua.dto;

import br.maua.busmaua.domain.TipoVeiculo;
import br.maua.busmaua.domain.Veiculo;

public record VeiculoDto(Long id, String nome, String placa, TipoVeiculo tipo, int capacidade) {

    public static VeiculoDto de(Veiculo v) {
        return v == null ? null : new VeiculoDto(v.getId(), v.getNome(), v.getPlaca(), v.getTipo(), v.getCapacidade());
    }
}
