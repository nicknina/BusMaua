package br.maua.busmaua.controller;

import br.maua.busmaua.dto.FilaStatus;
import br.maua.busmaua.dto.Requisicoes;
import br.maua.busmaua.security.UsuarioLogado;
import br.maua.busmaua.service.FilaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Fila virtual, do ponto de vista do aluno. */
@RestController
@RequestMapping("/api/fila")
@RequiredArgsConstructor
public class FilaController {

    private final FilaService filaService;

    @PostMapping
    public FilaStatus entrar(@AuthenticationPrincipal UsuarioLogado aluno, @Valid @RequestBody Requisicoes.EntrarFila req) {
        return filaService.entrar(aluno, req.viagemId(), req.paradaId());
    }

    /** 204 quando o aluno não está em nenhuma fila. */
    @GetMapping("/minha")
    public ResponseEntity<FilaStatus> minha(@AuthenticationPrincipal UsuarioLogado aluno) {
        return filaService.minha(aluno)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/minha/embarque")
    public FilaStatus confirmarEmbarque(@AuthenticationPrincipal UsuarioLogado aluno) {
        return filaService.confirmarEmbarque(aluno);
    }

    @DeleteMapping("/minha")
    public ResponseEntity<Void> sair(@AuthenticationPrincipal UsuarioLogado aluno) {
        filaService.sair(aluno);
        return ResponseEntity.noContent().build();
    }
}
