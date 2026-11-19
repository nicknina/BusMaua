package br.maua.busmaua.repository;

import br.maua.busmaua.domain.Perfil;
import br.maua.busmaua.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<Usuario> findByPerfil(Perfil perfil);

    List<Usuario> findByPerfilOrderByNomeAsc(Perfil perfil);
}
