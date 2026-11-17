package br.maua.busmaua.service;

import br.maua.busmaua.dto.ViagemResumo;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Publica eventos no WebSocket. Dentro de uma transação, o envio acontece só depois do
 * commit, para o app nunca buscar um dado que ainda não foi gravado.
 */
@Component
@RequiredArgsConstructor
public class Publicador {

    public record EventoFila(Long viagemId) {
    }

    public record EventoNotificacao(Long usuarioId) {
    }

    private final SimpMessagingTemplate mensagens;

    public void frota(ViagemResumo viagem) {
        enviar("/topic/frota", viagem);
    }

    public void fila(Long viagemId) {
        enviar("/topic/viagens/" + viagemId + "/fila", new EventoFila(viagemId));
    }

    /** usuarioId nulo indica um aviso geral. */
    public void notificacao(Long usuarioId) {
        enviar("/topic/notificacoes", new EventoNotificacao(usuarioId));
    }

    private void enviar(String destino, Object conteudo) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    mensagens.convertAndSend(destino, conteudo);
                }
            });
        } else {
            mensagens.convertAndSend(destino, conteudo);
        }
    }
}
