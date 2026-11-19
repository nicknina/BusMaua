package br.maua.busmaua.controller;

import br.maua.busmaua.dto.GestaoDtos.*;
import br.maua.busmaua.service.GestaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Cadastros da administração (acesso restrito ao perfil ADMIN em /api/admin/**). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class GestaoController {

    private final GestaoService gestao;

    // ----- veículos

    @GetMapping("/veiculos")
    public List<VeiculoAdmin> veiculos() {
        return gestao.veiculos();
    }

    @PostMapping("/veiculos")
    @ResponseStatus(HttpStatus.CREATED)
    public VeiculoAdmin criarVeiculo(@Valid @RequestBody VeiculoForm form) {
        return gestao.criarVeiculo(form);
    }

    @PutMapping("/veiculos/{id}")
    public VeiculoAdmin editarVeiculo(@PathVariable Long id, @Valid @RequestBody VeiculoForm form) {
        return gestao.editarVeiculo(id, form);
    }

    // ----- linhas e horários

    @GetMapping("/linhas")
    public List<LinhaAdmin> linhas() {
        return gestao.linhas();
    }

    @PostMapping("/linhas")
    @ResponseStatus(HttpStatus.CREATED)
    public LinhaAdmin criarLinha(@Valid @RequestBody LinhaForm form) {
        return gestao.criarLinha(form);
    }

    @PutMapping("/linhas/{id}")
    public LinhaAdmin editarLinha(@PathVariable Long id, @Valid @RequestBody LinhaForm form) {
        return gestao.editarLinha(id, form);
    }

    @PostMapping("/linhas/{id}/horarios")
    @ResponseStatus(HttpStatus.CREATED)
    public LinhaAdmin criarHorario(@PathVariable Long id, @Valid @RequestBody HorarioForm form) {
        return gestao.criarHorario(id, form);
    }

    @PutMapping("/horarios/{id}")
    public LinhaAdmin editarHorario(@PathVariable Long id, @Valid @RequestBody HorarioForm form) {
        return gestao.editarHorario(id, form);
    }

    // ----- paradas

    @PostMapping("/linhas/{id}/paradas")
    @ResponseStatus(HttpStatus.CREATED)
    public LinhaAdmin adicionarParada(@PathVariable Long id, @Valid @RequestBody ParadaForm form) {
        return gestao.adicionarParada(id, form);
    }

    @PutMapping("/paradas/{id}")
    public LinhaAdmin editarParada(@PathVariable Long id, @Valid @RequestBody ParadaForm form) {
        return gestao.editarParada(id, form);
    }

    /** direcao = "cima" ou "baixo" */
    @PostMapping("/paradas/{id}/mover")
    public LinhaAdmin moverParada(@PathVariable Long id, @RequestParam String direcao) {
        return gestao.moverParada(id, "cima".equalsIgnoreCase(direcao));
    }

    @DeleteMapping("/paradas/{id}")
    public LinhaAdmin excluirParada(@PathVariable Long id) {
        return gestao.excluirParada(id);
    }

    // ----- contas

    @GetMapping("/motoristas")
    public List<UsuarioAdmin> motoristas() {
        return gestao.motoristas();
    }

    @PostMapping("/motoristas")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioAdmin criarMotorista(@Valid @RequestBody NovoMotorista form) {
        return gestao.criarMotorista(form);
    }

    @PutMapping("/usuarios/{id}")
    public UsuarioAdmin editarUsuario(@PathVariable Long id, @Valid @RequestBody EdicaoUsuario form) {
        return gestao.editarUsuario(id, form);
    }

    @PostMapping("/usuarios/redefinir-senha")
    public UsuarioAdmin redefinirSenha(@Valid @RequestBody RedefinirSenha form) {
        return gestao.redefinirSenha(form);
    }
}
