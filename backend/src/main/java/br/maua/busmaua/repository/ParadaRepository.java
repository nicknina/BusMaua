package br.maua.busmaua.repository;

import br.maua.busmaua.domain.Parada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParadaRepository extends JpaRepository<Parada, Long> {

    List<Parada> findByLinhaIdOrderByOrdemAsc(Long linhaId);
}
