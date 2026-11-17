package br.maua.busmaua.repository;

import br.maua.busmaua.domain.Linha;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LinhaRepository extends JpaRepository<Linha, Long> {

    List<Linha> findAllByOrderByIdAsc();
}
