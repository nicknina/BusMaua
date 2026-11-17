package br.maua.busmaua.service;

import br.maua.busmaua.dto.LinhaDto;
import br.maua.busmaua.dto.VeiculoDto;
import br.maua.busmaua.repository.LinhaRepository;
import br.maua.busmaua.repository.VeiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LinhaService {

    private final LinhaRepository linhas;
    private final VeiculoRepository veiculos;

    @Transactional(readOnly = true)
    public List<LinhaDto> listar() {
        return linhas.findAllByOrderByIdAsc().stream().map(LinhaDto::de).toList();
    }

    @Transactional(readOnly = true)
    public List<VeiculoDto> veiculosAtivos() {
        return veiculos.findByAtivoTrueOrderByNomeAsc().stream().map(VeiculoDto::de).toList();
    }
}
