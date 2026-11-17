package br.maua.busmaua.service;

import br.maua.busmaua.domain.Linha;
import br.maua.busmaua.domain.Notificacao;
import br.maua.busmaua.domain.TipoNotificacao;
import br.maua.busmaua.domain.Usuario;
import br.maua.busmaua.dto.NotificacaoDto;
import br.maua.busmaua.repository.NotificacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final NotificacaoRepository repositorio;
    private final Publicador publicador;

    public void paraUsuario(Usuario usuario, TipoNotificacao tipo, String titulo, String mensagem) {
        repositorio.save(new Notificacao(usuario, null, tipo, titulo, mensagem));
        publicador.notificacao(usuario.getId());
    }

    public void paraTodos(Linha linha, TipoNotificacao tipo, String titulo, String mensagem) {
        repositorio.save(new Notificacao(null, linha, tipo, titulo, mensagem));
        publicador.notificacao(null);
    }

    @Transactional(readOnly = true)
    public List<NotificacaoDto> listar(Long usuarioId) {
        return repositorio.doUsuario(usuarioId, PageRequest.of(0, 50)).stream()
                .map(NotificacaoDto::de)
                .toList();
    }
}
