package br.maua.busmaua.repository;

import br.maua.busmaua.domain.FilaEntrada;
import br.maua.busmaua.domain.StatusFila;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FilaRepository extends JpaRepository<FilaEntrada, Long> {

    List<FilaEntrada> findByViagemIdAndStatusInOrderByEntrouEmAscIdAsc(Long viagemId, Collection<StatusFila> status);

    long countByViagemIdAndStatusIn(Long viagemId, Collection<StatusFila> status);

    Optional<FilaEntrada> findFirstByAlunoIdAndStatusInOrderByEntrouEmDesc(Long alunoId, Collection<StatusFila> status);

    List<FilaEntrada> findByStatusAndChamadoEmBefore(StatusFila status, Instant limite);

    List<FilaEntrada> findByViagemDataBetween(LocalDate inicio, LocalDate fim);

    boolean existsByParadaId(Long paradaId);
}
