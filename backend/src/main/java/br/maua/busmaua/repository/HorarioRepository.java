package br.maua.busmaua.repository;

import br.maua.busmaua.domain.Horario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HorarioRepository extends JpaRepository<Horario, Long> {

    List<Horario> findByAtivoTrueOrderByHoraSaidaAsc();
}
