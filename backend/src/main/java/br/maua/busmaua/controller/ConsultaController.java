package br.maua.busmaua.controller;

import br.maua.busmaua.dto.LinhaDto;
import br.maua.busmaua.dto.NotificacaoDto;
import br.maua.busmaua.dto.VeiculoDto;
import br.maua.busmaua.dto.ViagemResumo;
import br.maua.busmaua.security.UsuarioLogado;
import br.maua.busmaua.service.LinhaService;
import br.maua.busmaua.service.NotificacaoService;
import br.maua.busmaua.service.ViagemService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Consultas usadas por todos os perfis: linhas, horários, veículos, viagens e avisos. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ConsultaController {

    private final LinhaService linhaService;
    private final ViagemService viagemService;
    private final NotificacaoService notificacaoService;

    @GetMapping("/linhas")
    public List<LinhaDto> linhas() {
        return linhaService.listar();
    }

    @GetMapping("/veiculos")
    public List<VeiculoDto> veiculos() {
        return linhaService.veiculosAtivos();
    }

    /** Saídas de hoje que ainda vão acontecer ou estão em andamento. */
    @GetMapping("/viagens/proximas")
    public List<ViagemResumo> proximas() {
        return viagemService.proximas();
    }

    /** Veículos na rua agora (para o mapa ao vivo). */
    @GetMapping("/viagens/em-curso")
    public List<ViagemResumo> emCurso() {
        return viagemService.emCurso();
    }

    @GetMapping("/viagens/{id}")
    public ViagemResumo viagem(@PathVariable Long id) {
        return viagemService.buscar(id);
    }

    @GetMapping("/notificacoes")
    public List<NotificacaoDto> notificacoes(@AuthenticationPrincipal UsuarioLogado usuario) {
        return notificacaoService.listar(usuario.id());
    }
}
