package br.maua.busmaua.controller;

import br.maua.busmaua.dto.AdminDtos;
import br.maua.busmaua.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/resumo")
    public AdminDtos.Resumo resumo() {
        return adminService.resumo();
    }

    @GetMapping("/demanda")
    public List<AdminDtos.DemandaHorario> demanda(@RequestParam(defaultValue = "14") int dias) {
        return adminService.demanda(dias);
    }
}
