package br.maua.busmaua.repository;

import br.maua.busmaua.domain.StatusViagem;
import br.maua.busmaua.domain.Viagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ViagemRepository extends JpaRepository<Viagem, Long> {

    Optional<Viagem> findByHorarioIdAndData(Long horarioId, LocalDate data);

    List<Viagem> findByStatusIn(Collection<StatusViagem> status);

    List<Viagem> findByMotoristaIdAndStatusIn(Long motoristaId, Collection<StatusViagem> status);

    List<Viagem> findByVeiculoIdAndStatusIn(Long veiculoId, Collection<StatusViagem> status);

    List<Viagem> findByData(LocalDate data);

    List<Viagem> findByDataBetween(LocalDate inicio, LocalDate fim);
}
