package br.maua.busmaua.dto;

import br.maua.busmaua.domain.Horario;
import br.maua.busmaua.domain.Linha;
import br.maua.busmaua.domain.Parada;
import br.maua.busmaua.util.Fuso;

import java.util.List;

public record LinhaDto(Long id, String nome, String origem, String destino,
                       List<ParadaDto> paradas, List<HorarioDto> horarios) {

    public record ParadaDto(Long id, int ordem, String nome, String descricao,
                            double latitude, double longitude, int minutosDesdeSaida) {
        public static ParadaDto de(Parada p) {
            return new ParadaDto(p.getId(), p.getOrdem(), p.getNome(), p.getDescricao(),
                    p.getLatitude(), p.getLongitude(), p.getMinutosDesdeSaida());
        }
    }

    public record HorarioDto(Long id, String horaSaida, String localSaida, VeiculoDto veiculo) {
        public static HorarioDto de(Horario h) {
            return new HorarioDto(h.getId(), Fuso.hhmm(h.getHoraSaida()), h.getLocalSaida(), VeiculoDto.de(h.getVeiculoPadrao()));
        }
    }

    public static LinhaDto de(Linha l) {
        return new LinhaDto(l.getId(), l.getNome(), l.getOrigem(), l.getDestino(),
                l.getParadas().stream().map(ParadaDto::de).toList(),
                l.getHorarios().stream().filter(Horario::isAtivo).map(HorarioDto::de).toList());
    }
}
