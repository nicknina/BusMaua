package br.maua.busmaua.controller;

import br.maua.busmaua.dto.EntradaFilaDto;
import br.maua.busmaua.dto.Requisicoes;
import br.maua.busmaua.dto.ViagemResumo;
import br.maua.busmaua.security.UsuarioLogado;
import br.maua.busmaua.service.ViagemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Área do motorista: iniciar a viagem, compartilhar o GPS e controlar o embarque. */
@RestController
@RequestMapping("/api/motorista/viagens")
@RequiredArgsConstructor
public class MotoristaController {

    private final ViagemService viagemService;

    /** 204 quando o motorista não tem viagem em andamento. */
    @GetMapping("/atual")
    public ResponseEntity<ViagemResumo> atual(@AuthenticationPrincipal UsuarioLogado motorista) {
        return viagemService.atualDoMotorista(motorista)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/iniciar")
    public ViagemResumo iniciar(@AuthenticationPrincipal UsuarioLogado motorista,
                                @Valid @RequestBody Requisicoes.IniciarViagem req) {
        return viagemService.iniciar(motorista, req);
    }

    @PostMapping("/{id}/localizacao")
    public ViagemResumo localizacao(@AuthenticationPrincipal UsuarioLogado motorista, @PathVariable Long id,
                                    @Valid @RequestBody Requisicoes.Localizacao req) {
        return viagemService.atualizarLocalizacao(motorista, id, req);
    }

    @PostMapping("/{id}/pausar")
    public ViagemResumo pausar(@AuthenticationPrincipal UsuarioLogado motorista, @PathVariable Long id) {
        return viagemService.pausar(motorista, id);
    }

    @PostMapping("/{id}/retomar")
    public ViagemResumo retomar(@AuthenticationPrincipal UsuarioLogado motorista, @PathVariable Long id) {
        return viagemService.retomar(motorista, id);
    }

    @PostMapping("/{id}/atraso")
    public ViagemResumo atraso(@AuthenticationPrincipal UsuarioLogado motorista, @PathVariable Long id,
                               @Valid @RequestBody Requisicoes.Atraso req) {
        return viagemService.informarAtraso(motorista, id, req);
    }

    @PostMapping("/{id}/encerrar")
    public ViagemResumo encerrar(@AuthenticationPrincipal UsuarioLogado motorista, @PathVariable Long id) {
        return viagemService.encerrar(motorista, id);
    }

    @PostMapping("/{id}/lotacao")
    public ViagemResumo lotacao(@AuthenticationPrincipal UsuarioLogado motorista, @PathVariable Long id,
                                @Valid @RequestBody Requisicoes.Lotacao req) {
        return viagemService.ajustarLotacao(motorista, id, req);
    }

    @PostMapping("/{id}/liberar-saida")
    public ViagemResumo liberarSaida(@AuthenticationPrincipal UsuarioLogado motorista, @PathVariable Long id) {
        return viagemService.liberarSaida(motorista, id);
    }

    @GetMapping("/{id}/fila")
    public List<EntradaFilaDto> fila(@AuthenticationPrincipal UsuarioLogado motorista, @PathVariable Long id) {
        return viagemService.filaDaViagem(motorista, id);
    }

    @PostMapping("/{id}/fila/{entradaId}/confirmar")
    public List<EntradaFilaDto> confirmar(@AuthenticationPrincipal UsuarioLogado motorista,
                                          @PathVariable Long id, @PathVariable Long entradaId) {
        return viagemService.confirmarEmbarque(motorista, id, entradaId);
    }
}
