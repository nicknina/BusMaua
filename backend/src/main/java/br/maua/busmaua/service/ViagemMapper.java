package br.maua.busmaua.service;

import br.maua.busmaua.domain.Horario;
import br.maua.busmaua.domain.Linha;
import br.maua.busmaua.domain.StatusFila;
import br.maua.busmaua.domain.Viagem;
import br.maua.busmaua.dto.VeiculoDto;
import br.maua.busmaua.dto.ViagemResumo;
import br.maua.busmaua.repository.FilaRepository;
import br.maua.busmaua.util.Fuso;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ViagemMapper {

    private final FilaRepository fila;
    private final EtaService eta;

    public ViagemResumo resumo(Viagem v) {
        Horario h = v.getHorario();
        Linha l = v.getLinha();
        long naFila = fila.countByViagemIdAndStatusIn(v.getId(), StatusFila.ATIVOS);
        return new ViagemResumo(
                v.getId(),
                l.getId(),
                l.getNome(),
                l.getOrigem(),
                l.getDestino(),
                Fuso.hhmm(h.getHoraSaida()),
                h.getLocalSaida(),
                v.getData(),
                v.getStatus(),
                VeiculoDto.de(v.veiculoEfetivo()),
                v.getMotorista() == null ? null : v.getMotorista().getNome(),
                v.getLatitude(),
                v.getLongitude(),
                v.getVelocidadeKmh(),
                v.getPosicaoAtualizadaEm(),
                v.getLotacao(),
                v.capacidade(),
                naFila,
                v.getAtrasoMinutos(),
                v.getMotivoAtraso(),
                eta.minutosParaSaida(v),
                v.getSaidaLiberadaEm());
    }
}
