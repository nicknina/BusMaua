package br.maua.busmaua.service;

import br.maua.busmaua.domain.*;
import br.maua.busmaua.dto.AdminDtos;
import br.maua.busmaua.repository.FilaRepository;
import br.maua.busmaua.repository.HorarioRepository;
import br.maua.busmaua.repository.VeiculoRepository;
import br.maua.busmaua.repository.ViagemRepository;
import br.maua.busmaua.util.Fuso;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Dados para a gestão: compara as solicitações da fila virtual com os embarques
 * confirmados para mostrar picos de demanda e horários com baixa utilização.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    /** Acima desta média de solicitações por saída, a indicação passa a ser ônibus. */
    private static final int CAPACIDADE_VAN = 16;

    private final ViagemRepository viagens;
    private final FilaRepository fila;
    private final VeiculoRepository veiculos;
    private final HorarioRepository horarios;

    @Transactional(readOnly = true)
    public AdminDtos.Resumo resumo() {
        LocalDate hoje = Fuso.hoje();
        List<Viagem> doDia = viagens.findByData(hoje);
        List<FilaEntrada> entradas = fila.findByViagemDataBetween(hoje, hoje);
        return new AdminDtos.Resumo(
                veiculos.findByAtivoTrueOrderByNomeAsc().size(),
                doDia.size(),
                (int) doDia.stream().filter(v -> v.getStatus().emCurso()).count(),
                entradas.size(),
                (int) entradas.stream().filter(e -> e.getStatus() == StatusFila.EMBARCADO).count());
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.DemandaHorario> demanda(int dias) {
        int periodo = Math.max(1, Math.min(dias, 90));
        LocalDate fim = Fuso.hoje().minusDays(1);
        LocalDate inicio = fim.minusDays(periodo - 1L);

        Map<Long, List<Viagem>> viagensPorHorario = viagens.findByDataBetween(inicio, fim).stream()
                .filter(v -> v.getStatus() == StatusViagem.ENCERRADA)
                .collect(Collectors.groupingBy(v -> v.getHorario().getId()));
        Map<Long, List<FilaEntrada>> entradasPorHorario = fila.findByViagemDataBetween(inicio, fim).stream()
                .collect(Collectors.groupingBy(e -> e.getViagem().getHorario().getId()));

        List<AdminDtos.DemandaHorario> resultado = new ArrayList<>();
        for (Horario h : horarios.findByAtivoTrueOrderByHoraSaidaAsc()) {
            List<Viagem> realizadas = viagensPorHorario.getOrDefault(h.getId(), List.of());
            List<FilaEntrada> entradas = entradasPorHorario.getOrDefault(h.getId(), List.of());
            int n = Math.max(1, realizadas.size());

            long embarques = entradas.stream().filter(e -> e.getStatus() == StatusFila.EMBARCADO).count();
            double mediaSolicitacoes = arredondar((double) entradas.size() / n);
            double mediaEmbarques = arredondar((double) embarques / n);
            double taxa = entradas.isEmpty() ? 0 : arredondar(100.0 * embarques / entradas.size());
            double ocupacao = realizadas.stream()
                    .filter(v -> v.capacidade() > 0)
                    .mapToDouble(v -> 100.0 * v.getLotacao() / v.capacidade())
                    .average().orElse(0);

            Veiculo escalado = h.getVeiculoPadrao();
            String indicacao;
            if (realizadas.isEmpty()) {
                indicacao = "Sem dados no período";
            } else if (mediaSolicitacoes > CAPACIDADE_VAN) {
                indicacao = "Ônibus";
            } else {
                indicacao = "Van";
            }

            resultado.add(new AdminDtos.DemandaHorario(
                    h.getId(),
                    h.getLinha().getNome(),
                    Fuso.hhmm(h.getHoraSaida()),
                    realizadas.size(),
                    mediaSolicitacoes,
                    mediaEmbarques,
                    taxa,
                    escalado == null ? "-" : escalado.getNome(),
                    escalado == null ? 0 : escalado.getCapacidade(),
                    arredondar(ocupacao),
                    indicacao));
        }
        return resultado;
    }

    private static double arredondar(double valor) {
        return Math.round(valor * 10) / 10.0;
    }
}
