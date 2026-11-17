package br.maua.busmaua.dto;

import br.maua.busmaua.domain.Notificacao;
import br.maua.busmaua.domain.TipoNotificacao;

import java.time.Instant;

public record NotificacaoDto(Long id, TipoNotificacao tipo, String titulo, String mensagem,
                             Instant criadaEm, boolean geral) {

    public static NotificacaoDto de(Notificacao n) {
        return new NotificacaoDto(n.getId(), n.getTipo(), n.getTitulo(), n.getMensagem(),
                n.getCriadaEm(), n.getUsuario() == null);
    }
}
