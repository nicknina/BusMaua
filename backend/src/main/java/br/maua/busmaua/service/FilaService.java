package br.maua.busmaua.service;

import br.maua.busmaua.domain.*;
import br.maua.busmaua.dto.FilaStatus;
import br.maua.busmaua.exception.NaoEncontradoException;
import br.maua.busmaua.exception.RegraNegocioException;
import br.maua.busmaua.repository.FilaRepository;
import br.maua.busmaua.repository.ParadaRepository;
import br.maua.busmaua.repository.UsuarioRepository;
import br.maua.busmaua.repository.ViagemRepository;
import br.maua.busmaua.security.UsuarioLogado;
import br.maua.busmaua.util.Fuso;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Fila virtual: o aluno registra a intenção de embarcar em uma saída. Quando o veículo
 * está chegando ao ponto dele e ainda há lugar, ele é chamado e tem alguns minutos para
 * embarcar; o embarque pode ser confirmado pelo próprio aluno ou pelo motorista.
 */
@Service
public class FilaService {

    private static final List<StatusFila> ATIVOS_OU_EMBARCADO =
            List.of(StatusFila.AGUARDANDO, StatusFila.CHAMADO, StatusFila.EMBARCADO);

    private final FilaRepository fila;
    private final ViagemRepository viagens;
    private final ParadaRepository paradas;
    private final UsuarioRepository usuarios;
    private final EtaService eta;
    private final NotificacaoService notificacoes;
    private final Publicador publicador;
    private final ViagemMapper mapper;
    private final int minutosParaEmbarcar;
    private final int minutosParaChamar;

    public FilaService(FilaRepository fila, ViagemRepository viagens, ParadaRepository paradas,
                       UsuarioRepository usuarios, EtaService eta, NotificacaoService notificacoes,
                       Publicador publicador, ViagemMapper mapper,
                       @Value("${busmaua.fila.minutos-para-embarcar:5}") int minutosParaEmbarcar,
                       @Value("${busmaua.fila.minutos-para-chamar:5}") int minutosParaChamar) {
        this.fila = fila;
        this.viagens = viagens;
        this.paradas = paradas;
        this.usuarios = usuarios;
        this.eta = eta;
        this.notificacoes = notificacoes;
        this.publicador = publicador;
        this.mapper = mapper;
        this.minutosParaEmbarcar = minutosParaEmbarcar;
        this.minutosParaChamar = minutosParaChamar;
    }

    // ---------------------------------------------------------------- aluno

    @Transactional
    public FilaStatus entrar(UsuarioLogado aluno, Long viagemId, Long paradaId) {
        Viagem viagem = viagens.findById(viagemId)
                .orElseThrow(() -> new NaoEncontradoException("Saída não encontrada."));
        if (viagem.getStatus() == StatusViagem.ENCERRADA) {
            throw new RegraNegocioException("Esta viagem já foi encerrada.");
        }
        if (!viagem.getData().equals(Fuso.hoje())) {
            throw new RegraNegocioException("Só é possível entrar na fila das saídas de hoje.");
        }
        Optional<FilaEntrada> atual = fila.findFirstByAlunoIdAndStatusInOrderByEntrouEmDesc(aluno.id(), StatusFila.ATIVOS);
        if (atual.isPresent()) {
            throw new RegraNegocioException(atual.get().getViagem().getId().equals(viagemId)
                    ? "Você já está nesta fila."
                    : "Você já está na fila de outra saída. Saia dela antes de entrar em uma nova.");
        }

        Parada parada = escolherParada(viagem, paradaId);
        FilaEntrada entrada = fila.save(new FilaEntrada(viagem, usuarios.getReferenceById(aluno.id()), parada));

        chamarProximos(viagem);
        publicarMudanca(viagem);
        return status(entrada);
    }

    @Transactional(readOnly = true)
    public Optional<FilaStatus> minha(UsuarioLogado aluno) {
        return fila.findFirstByAlunoIdAndStatusInOrderByEntrouEmDesc(aluno.id(), ATIVOS_OU_EMBARCADO)
                .filter(e -> e.getViagem().getStatus() != StatusViagem.ENCERRADA)
                .filter(e -> e.getViagem().getData().equals(Fuso.hoje()))
                .map(this::status);
    }

    @Transactional
    public FilaStatus confirmarEmbarque(UsuarioLogado aluno) {
        FilaEntrada entrada = entradaAtiva(aluno);
        if (!entrada.getViagem().getStatus().emCurso()) {
            throw new RegraNegocioException("O veículo ainda não iniciou a viagem. Confirme o embarque ao entrar nele.");
        }
        embarcar(entrada, "ALUNO");
        return status(entrada);
    }

    @Transactional
    public void sair(UsuarioLogado aluno) {
        FilaEntrada entrada = entradaAtiva(aluno);
        entrada.setStatus(StatusFila.SAIU);
        entrada.setSaiuEm(Instant.now());
        Viagem viagem = entrada.getViagem();
        chamarProximos(viagem);
        publicarMudanca(viagem);
    }

    // ---------------------------------------------------------------- regras compartilhadas

    /** Registra o embarque, atualiza a lotação e libera a vez para os próximos. */
    public void embarcar(FilaEntrada entrada, String confirmadoPor) {
        Viagem viagem = entrada.getViagem();
        if (viagem.getLotacao() >= viagem.capacidade()) {
            throw new RegraNegocioException("O veículo está lotado.");
        }
        entrada.setStatus(StatusFila.EMBARCADO);
        entrada.setEmbarcadoEm(Instant.now());
        entrada.setConfirmadoPor(confirmadoPor);
        viagem.setLotacao(viagem.getLotacao() + 1);

        notificacoes.paraUsuario(entrada.getAluno(), TipoNotificacao.EMBARQUE_CONFIRMADO,
                "Embarque confirmado", "Check-in feito no " + viagem.nomeVeiculo() + ". Boa viagem!");

        chamarProximos(viagem);
        publicarMudanca(viagem);
    }

    /**
     * Chama, na ordem da fila, os alunos cujo ponto o veículo vai alcançar em poucos minutos,
     * respeitando as vagas restantes (capacidade - lotação - alunos já chamados).
     */
    public void chamarProximos(Viagem viagem) {
        if (viagem.getStatus() != StatusViagem.EM_ANDAMENTO) {
            return;
        }
        List<FilaEntrada> ativos = fila.findByViagemIdAndStatusInOrderByEntrouEmAscIdAsc(viagem.getId(), StatusFila.ATIVOS);
        long chamados = ativos.stream().filter(e -> e.getStatus() == StatusFila.CHAMADO).count();
        long vagas = viagem.capacidade() - viagem.getLotacao() - chamados;

        int posicao = 0;
        for (FilaEntrada entrada : ativos) {
            posicao++;
            if (vagas <= 0) {
                break;
            }
            if (entrada.getStatus() != StatusFila.AGUARDANDO) {
                continue;
            }
            Integer minutos = eta.ateParada(viagem, entrada.getParada());
            if (minutos == null || minutos > minutosParaChamar) {
                continue;
            }
            entrada.setStatus(StatusFila.CHAMADO);
            entrada.setChamadoEm(Instant.now());
            vagas--;
            notificacoes.paraUsuario(entrada.getAluno(), TipoNotificacao.SUA_VEZ, "Sua vez na fila!",
                    "Você é o " + posicao + "º. Vá até o ponto " + entrada.getParada().getNome()
                            + " e confirme o embarque em até " + minutosParaEmbarcar + " min.");
        }
    }

    /** Avisa uma única vez quem está na fila quando o veículo está a até 3 minutos do ponto. */
    public void avisarChegada(Viagem viagem) {
        for (FilaEntrada entrada : fila.findByViagemIdAndStatusInOrderByEntrouEmAscIdAsc(viagem.getId(), StatusFila.ATIVOS)) {
            if (entrada.isAvisoChegadaEnviado()) {
                continue;
            }
            Integer minutos = eta.ateParada(viagem, entrada.getParada());
            if (minutos != null && minutos <= 3) {
                entrada.setAvisoChegadaEnviado(true);
                String veiculo = viagem.veiculoEfetivo() == null ? "O veículo" : viagem.veiculoEfetivo().artigoETipo();
                notificacoes.paraUsuario(entrada.getAluno(), TipoNotificacao.CHEGANDO,
                        "Chegando ao " + entrada.getParada().getNome(),
                        veiculo + " está a " + Math.max(1, minutos) + " min do seu ponto de embarque.");
            }
        }
    }

    /** Encerra a fila de uma viagem finalizada. */
    public void encerrarFila(Viagem viagem) {
        for (FilaEntrada entrada : fila.findByViagemIdAndStatusInOrderByEntrouEmAscIdAsc(viagem.getId(), StatusFila.ATIVOS)) {
            entrada.setStatus(StatusFila.EXPIRADO);
            entrada.setSaiuEm(Instant.now());
        }
    }

    /** Remove da fila quem foi chamado e não embarcou dentro do prazo. */
    @Scheduled(fixedDelay = 15_000)
    @Transactional
    public void expirarChamados() {
        Instant limite = Instant.now().minus(Duration.ofMinutes(minutosParaEmbarcar));
        Map<Long, Viagem> afetadas = new HashMap<>();
        for (FilaEntrada entrada : fila.findByStatusAndChamadoEmBefore(StatusFila.CHAMADO, limite)) {
            entrada.setStatus(StatusFila.EXPIRADO);
            entrada.setSaiuEm(Instant.now());
            afetadas.put(entrada.getViagem().getId(), entrada.getViagem());
            notificacoes.paraUsuario(entrada.getAluno(), TipoNotificacao.FILA_EXPIRADA, "Você saiu da fila",
                    "O tempo para embarcar terminou. Se ainda precisar do transporte, entre na fila novamente.");
        }
        afetadas.values().forEach(viagem -> {
            chamarProximos(viagem);
            publicarMudanca(viagem);
        });
    }

    // ---------------------------------------------------------------- apoio

    public FilaStatus status(FilaEntrada entrada) {
        Viagem viagem = entrada.getViagem();
        List<FilaEntrada> ativos = fila.findByViagemIdAndStatusInOrderByEntrouEmAscIdAsc(viagem.getId(), StatusFila.ATIVOS);

        Integer posicao = null;
        for (int i = 0; i < ativos.size(); i++) {
            if (ativos.get(i).getId().equals(entrada.getId())) {
                posicao = i + 1;
                break;
            }
        }
        int vagas = Math.max(0, viagem.capacidade() - viagem.getLotacao());
        boolean cabe = entrada.getStatus() == StatusFila.EMBARCADO || (posicao != null && posicao <= vagas);
        Instant prazo = entrada.getStatus() == StatusFila.CHAMADO && entrada.getChamadoEm() != null
                ? entrada.getChamadoEm().plus(Duration.ofMinutes(minutosParaEmbarcar))
                : null;

        return new FilaStatus(
                entrada.getId(),
                entrada.getStatus(),
                posicao,
                posicao == null ? 0 : posicao - 1,
                ativos.size(),
                entrada.getParada().getId(),
                entrada.getParada().getNome(),
                entrada.getStatus() == StatusFila.EMBARCADO ? null : eta.ateParada(viagem, entrada.getParada()),
                cabe,
                prazo,
                mapper.resumo(viagem));
    }

    private Parada escolherParada(Viagem viagem, Long paradaId) {
        if (paradaId == null) {
            return paradas.findByLinhaIdOrderByOrdemAsc(viagem.getLinha().getId()).stream()
                    .findFirst()
                    .orElseThrow(() -> new RegraNegocioException("A linha não tem pontos de embarque cadastrados."));
        }
        return paradas.findById(paradaId)
                .filter(p -> p.getLinha().getId().equals(viagem.getLinha().getId()))
                .orElseThrow(() -> new RegraNegocioException("Ponto de embarque inválido para esta linha."));
    }

    private FilaEntrada entradaAtiva(UsuarioLogado aluno) {
        return fila.findFirstByAlunoIdAndStatusInOrderByEntrouEmDesc(aluno.id(), StatusFila.ATIVOS)
                .orElseThrow(() -> new RegraNegocioException("Você não está em nenhuma fila."));
    }

    private void publicarMudanca(Viagem viagem) {
        publicador.fila(viagem.getId());
        publicador.frota(mapper.resumo(viagem));
    }
}
