package br.maua.busmaua.repository;

import br.maua.busmaua.domain.Notificacao;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

    @Query("""
            select n from Notificacao n
            where n.usuario.id = :usuarioId or n.usuario is null
            order by n.criadaEm desc, n.id desc
            """)
    List<Notificacao> doUsuario(@Param("usuarioId") Long usuarioId, Pageable pagina);
}
