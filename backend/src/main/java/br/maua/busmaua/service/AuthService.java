package br.maua.busmaua.service;

import br.maua.busmaua.domain.Perfil;
import br.maua.busmaua.domain.Usuario;
import br.maua.busmaua.dto.AuthResponse;
import br.maua.busmaua.dto.CadastroRequest;
import br.maua.busmaua.dto.LoginRequest;
import br.maua.busmaua.dto.UsuarioDto;
import br.maua.busmaua.exception.NaoEncontradoException;
import br.maua.busmaua.exception.RegraNegocioException;
import br.maua.busmaua.repository.UsuarioRepository;
import br.maua.busmaua.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String DOMINIO_INSTITUCIONAL = "@maua.br";

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        Usuario usuario = usuarios.findByEmailIgnoreCase(req.email().trim())
                .filter(u -> encoder.matches(req.senha(), u.getSenhaHash()))
                .orElseThrow(() -> new RegraNegocioException("E-mail ou senha incorretos."));

        if (!usuario.estaAtivo()) {
            throw new RegraNegocioException("Esta conta está desativada. Procure a administração do transporte.");
        }
        if (req.perfil() == Perfil.MOTORISTA && usuario.getPerfil() == Perfil.ALUNO) {
            throw new RegraNegocioException("Esta conta é de aluno. Entre pela aba Aluno.");
        }
        if (req.perfil() == Perfil.ALUNO && usuario.getPerfil() == Perfil.MOTORISTA) {
            throw new RegraNegocioException("Esta conta é de motorista. Entre pela aba Motorista.");
        }
        return new AuthResponse(jwt.gerar(usuario), UsuarioDto.de(usuario));
    }

    /** Cadastro aberto apenas para alunos; motoristas são criados pela administração. */
    @Transactional
    public AuthResponse cadastrar(CadastroRequest req) {
        String email = req.email().trim().toLowerCase();
        if (!email.endsWith(DOMINIO_INSTITUCIONAL)) {
            throw new RegraNegocioException("Use seu e-mail institucional (" + DOMINIO_INSTITUCIONAL + ").");
        }
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw new RegraNegocioException("Já existe uma conta com este e-mail.");
        }
        Usuario usuario = usuarios.save(new Usuario(req.nome().trim(), email, encoder.encode(req.senha()), Perfil.ALUNO));
        return new AuthResponse(jwt.gerar(usuario), UsuarioDto.de(usuario));
    }

    @Transactional(readOnly = true)
    public UsuarioDto buscar(Long id) {
        return usuarios.findById(id)
                .map(UsuarioDto::de)
                .orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado."));
    }
}
