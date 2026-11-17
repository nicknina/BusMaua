package br.maua.busmaua.repository;

import br.maua.busmaua.domain.Veiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {

    List<Veiculo> findByAtivoTrueOrderByNomeAsc();
}
