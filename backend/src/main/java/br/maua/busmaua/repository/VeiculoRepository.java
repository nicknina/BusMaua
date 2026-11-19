package br.maua.busmaua.repository;

import br.maua.busmaua.domain.Veiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {

    List<Veiculo> findByAtivoTrueOrderByNomeAsc();

    List<Veiculo> findAllByOrderByNomeAsc();

    Optional<Veiculo> findByPlacaIgnoreCase(String placa);
}
