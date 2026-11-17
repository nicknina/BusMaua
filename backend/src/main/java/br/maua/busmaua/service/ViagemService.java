package br.maua.busmaua.service;

import br.maua.busmaua.domain.*;
import br.maua.busmaua.dto.EntradaFilaDto;
import br.maua.busmaua.dto.Requisicoes;
import br.maua.busmaua.dto.ViagemResumo;
import br.maua.busmaua.exception.AcessoNegadoException;
import br.maua.busmaua.exception.NaoEncontradoException;
import br.maua.busmaua.exception.RegraNegocioException;
import br.maua.busmaua.repository.*;
import br.maua.busmaua.security.UsuarioLogado;
import br.maua.busmaua.util.Fuso;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ViagemService {

    private static final List<StatusFila> FILA_DO_MOTORISTA =
            List.of(StatusFila.AGUARDANDO, StatusFila.CHAMADO, StatusFila.EMBARCADO);

    private final ViagemRepository viagens;
    private final HorarioRepository horarios;
    private final VeiculoRepository veiculos;
    private final UsuarioRepository usuarios;
    private final FilaRepository fila;
    private final FilaService filaService;
    private final NotificacaoService notificacoes;
    private final Publicador publicador;
    private final ViagemMapper mapper;

    // ---------------------------------------------------------------- consulta (alunos)

    /** Viagens de hoje que ainda vão sair ou estão na rua. */
    @Transactional
    public List<ViagemResumo> proximas() {
        LocalDate hoje = Fuso.hoje();
        LocalTime agora = Fuso.horaAtual();
        LocalTime limite = agora.isBefore(LocalTime.of(0, 30)) ? LocalTime.MIN : agora.minusMinutes(30);

        return horarios.findByAtivoTrueOrderByHoraSaidaAsc().stream()
                .map(h -> obterOuCriar(h, hoje))
                .filter(v -> v.getStatus().emCurso()
                        || (v.getStatus() == StatusViagem.AGENDADA
                        && !v.getHorario().getHoraSaida().plusMinutes(v.getAtrasoMinutos()).isBefore(limite)))
                .map(mapper::resumo)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ViagemResumo> emCurso() {
        return viagens.findByStatusIn(StatusViagem.EM_CURSO).stream().map(mapper::resumo).toList();
    }

    @Transactional(readOnly = true)
    public ViagemResumo buscar(Long id) {
        return viagens.findById(id).map(mapper::resumo)
                .orElseThrow(() -> new NaoEncontradoException("Viagem não encontrada."));
    }

    // ---------------------------------------------------------------- motorista

    @Transactional(readOnly = true)
    public Optional<ViagemResumo> atualDoMotorista(UsuarioLogado motorista) {
        return viagens.findByMotoristaIdAndStatusIn(motorista.id(), StatusViagem.EM_CURSO).stream()
                .findFirst()
                .map(mapper::resumo);
    }

    @Transactional
    public ViagemResumo iniciar(UsuarioLogado m, Requisicoes.IniciarViagem req) {
        if (!viagens.findByMotoristaIdAndStatusIn(m.id(), StatusViagem.EM_CURSO).isEmpty()) {
            throw new RegraNegocioException("Você já tem uma viagem em andamento. Encerre-a antes de iniciar outra.");
        }
        Horario horario = horarios.findById(req.horarioId())
                .orElseThrow(() -> new NaoEncontradoException("Horário não encontrado."));
        Veiculo veiculo = veiculos.findById(req.veiculoId())
                .filter(Veiculo::isAtivo)
                .orElseThrow(() -> new NaoEncontradoException("Veículo não encontrado."));
        if (!viagens.findByVeiculoIdAndStatusIn(veiculo.getId(), StatusViagem.EM_CURSO).isEmpty()) {
            throw new RegraNegocioException(veiculo.getNome() + " já está em outra viagem.");
        }

        Viagem viagem = obterOuCriar(horario, Fuso.hoje());
        if (viagem.getStatus() != StatusViagem.AGENDADA) {
            throw new RegraNegocioException(viagem.getStatus() == StatusViagem.ENCERRADA
                    ? "Esta saída já foi realizada hoje."
                    : "Esta saída já foi iniciada por outro motorista.");
        }
        Usuario motorista = usuarios.findById(m.id())
                .orElseThrow(() -> new NaoEncontradoException("Motorista não encontrado."));

        viagem.setVeiculo(veiculo);
        viagem.setMotorista(motorista);
        viagem.setStatus(StatusViagem.EM_ANDAMENTO);
        viagem.setIniciadaEm(Instant.now());

        notificacoes.paraTodos(viagem.getLinha(), TipoNotificacao.VIAGEM_INICIADA,
                veiculo.getNome() + " iniciou a viagem",
                motorista.primeiroNome() + " está compartilhando a localização. Acompanhe no mapa.");

        filaService.chamarProximos(viagem);
        return publicar(viagem);
    }

    @Transactional
    public ViagemResumo atualizarLocalizacao(UsuarioLogado m, Long id, Requisicoes.Localizacao req) {
        Viagem viagem = daMotorista(m, id);
        if (!viagem.getStatus().emCurso()) {
            throw new RegraNegocioException("A viagem não está em andamento.");
        }
        viagem.setLatitude(req.latitude());
        viagem.setLongitude(req.longitude());
        viagem.setVelocidadeKmh(req.velocidadeKmh());
        viagem.setPosicaoAtualizadaEm(Instant.now());

        if (viagem.getStatus() == StatusViagem.EM_ANDAMENTO) {
            filaService.avisarChegada(viagem);
            filaService.chamarProximos(viagem);
        }
        return publicar(viagem);
    }

    /** Pausa o compartilhamento: o veículo some do mapa ao vivo até retomar. */
    @Transactional
    public ViagemResumo pausar(UsuarioLogado m, Long id) {
        Viagem viagem = daMotorista(m, id);
        if (viagem.getStatus() != StatusViagem.EM_ANDAMENTO) {
            throw new RegraNegocioException("A viagem não está em andamento.");
        }
        viagem.setStatus(StatusViagem.PAUSADA);
        return publicar(viagem);
    }

    @Transactional
    public ViagemResumo retomar(UsuarioLogado m, Long id) {
        Viagem viagem = daMotorista(m, id);
        if (viagem.getStatus() != StatusViagem.PAUSADA) {
            throw new RegraNegocioException("A viagem não está pausada.");
        }
        viagem.setStatus(StatusViagem.EM_ANDAMENTO);
        filaService.chamarProximos(viagem);
        return publicar(viagem);
    }

    @Transactional
    public ViagemResumo informarAtraso(UsuarioLogado m, Long id, Requisicoes.Atraso req) {
        Viagem viagem = daMotorista(m, id);
        if (viagem.getStatus() == StatusViagem.ENCERRADA) {
            throw new RegraNegocioException("A viagem já foi encerrada.");
        }
        viagem.setAtrasoMinutos(viagem.getAtrasoMinutos() + req.minutos());
        String motivo = req.motivo() == null || req.motivo().isBlank() ? null : req.motivo().trim();
        viagem.setMotivoAtraso(motivo);

        int duracao = viagem.getLinha().getParadas().stream()
                .mapToInt(Parada::getMinutosDesdeSaida).max().orElse(0);
        LocalTime previsao = viagem.getHorario().getHoraSaida().plusMinutes(duracao + viagem.getAtrasoMinutos());
        String mensagem = (motivo == null ? "" : motivo + ". ") + "Nova previsão de chegada: " + Fuso.hhmm(previsao) + ".";

        notificacoes.paraTodos(viagem.getLinha(), TipoNotificacao.ATRASO,
                "Atraso de " + req.minutos() + " minutos · " + viagem.nomeVeiculo(), mensagem);
        return publicar(viagem);
    }

    @Transactional
    public ViagemResumo encerrar(UsuarioLogado m, Long id) {
        Viagem viagem = daMotorista(m, id);
        if (viagem.getStatus() == StatusViagem.ENCERRADA) {
            return mapper.resumo(viagem);
        }
        viagem.setStatus(StatusViagem.ENCERRADA);
        viagem.setEncerradaEm(Instant.now());
        filaService.encerrarFila(viagem);
        publicador.fila(viagem.getId());
        return publicar(viagem);
    }

    /** Ajuste manual da lotação (ex.: aluno que embarcou sem usar o app). */
    @Transactional
    public ViagemResumo ajustarLotacao(UsuarioLogado m, Long id, Requisicoes.Lotacao req) {
        Viagem viagem = daMotorista(m, id);
        int nova = Math.max(0, Math.min(viagem.capacidade(), viagem.getLotacao() + req.delta()));
        viagem.setLotacao(nova);
        filaService.chamarProximos(viagem);
        publicador.fila(viagem.getId());
        return publicar(viagem);
    }

    @Transactional
    public ViagemResumo liberarSaida(UsuarioLogado m, Long id) {
        Viagem viagem = daMotorista(m, id);
        viagem.setSaidaLiberadaEm(Instant.now());
        return publicar(viagem);
    }

    @Transactional(readOnly = true)
    public List<EntradaFilaDto> filaDaViagem(UsuarioLogado m, Long id) {
        daMotorista(m, id);
        return fila.findByViagemIdAndStatusInOrderByEntrouEmAscIdAsc(id, FILA_DO_MOTORISTA).stream()
                .map(EntradaFilaDto::de)
                .toList();
    }

    @Transactional
    public List<EntradaFilaDto> confirmarEmbarque(UsuarioLogado m, Long viagemId, Long entradaId) {
        Viagem viagem = daMotorista(m, viagemId);
        FilaEntrada entrada = fila.findById(entradaId)
                .filter(e -> e.getViagem().getId().equals(viagem.getId()))
                .orElseThrow(() -> new NaoEncontradoException("Aluno não encontrado nesta fila."));
        if (!StatusFila.ATIVOS.contains(entrada.getStatus())) {
            throw new RegraNegocioException("Este aluno não está aguardando embarque.");
        }
        filaService.embarcar(entrada, "MOTORISTA");
        return fila.findByViagemIdAndStatusInOrderByEntrouEmAscIdAsc(viagemId, FILA_DO_MOTORISTA).stream()
                .map(EntradaFilaDto::de)
                .toList();
    }

    // ---------------------------------------------------------------- apoio

    public Viagem obterOuCriar(Horario horario, LocalDate data) {
        return viagens.findByHorarioIdAndData(horario.getId(), data)
                .orElseGet(() -> viagens.save(new Viagem(horario, data)));
    }

    private Viagem daMotorista(UsuarioLogado m, Long id) {
        Viagem viagem = viagens.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Viagem não encontrada."));
        if (viagem.getMotorista() == null || !viagem.getMotorista().getId().equals(m.id())) {
            throw new AcessoNegadoException("Esta viagem não está com você.");
        }
        return viagem;
    }

    private ViagemResumo publicar(Viagem viagem) {
        ViagemResumo resumo = mapper.resumo(viagem);
        publicador.frota(resumo);
        return resumo;
    }
}
