package br.maua.busmaua.controller;

import br.maua.busmaua.dto.AuthResponse;
import br.maua.busmaua.dto.CadastroRequest;
import br.maua.busmaua.dto.LoginRequest;
import br.maua.busmaua.dto.UsuarioDto;
import br.maua.busmaua.security.UsuarioLogado;
import br.maua.busmaua.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/cadastro")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse cadastro(@Valid @RequestBody CadastroRequest req) {
        return authService.cadastrar(req);
    }

    @GetMapping("/me")
    public UsuarioDto me(@AuthenticationPrincipal UsuarioLogado usuario) {
        return authService.buscar(usuario.id());
    }
}
