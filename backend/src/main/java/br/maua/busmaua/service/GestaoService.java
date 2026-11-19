package br.maua.busmaua.service;

import br.maua.busmaua.domain.*;
import br.maua.busmaua.dto.GestaoDtos.*;
import br.maua.busmaua.exception.NaoEncontradoException;
import br.maua.busmaua.exception.RegraNegocioException;
import br.maua.busmaua.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

/** Cadastros mantidos pela administração: frota, linhas, paradas, horários e contas. */
@Service
@RequiredArgsConstructor
public class GestaoService {

    private final VeiculoRepository veiculos;
    private final LinhaRepository linhas;
    private final ParadaRepository paradas;
    private final HorarioRepository horarios;
    private final ViagemRepository viagens;
    private final FilaRepository fila;
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;

    // ---------------------------------------------------------------- veículos

    @Transactional(readOnly = true)
    public List<VeiculoAdmin> veiculos() {
        return veiculos.findAllByOrderByNomeAsc().stream().map(VeiculoAdmin::de).toList();
    }

    @Transactional
    public VeiculoAdmin criarVeiculo(VeiculoForm form) {
        String placa = normalizarPlaca(form.placa());
        if (veiculos.findByPlacaIgnoreCase(placa).isPresent()) {
            throw new RegraNegocioException("Já existe um veículo com a placa " + placa + ".");
        }
        Veiculo veiculo = new Veiculo(form.nome().trim(), placa, form.tipo(), form.capacidade());
        if (form.ativo() != null) {
            veiculo.setAtivo(form.ativo());
        }
        return VeiculoAdmin.de(veiculos.save(veiculo));
    }

    @Transactional
    public VeiculoAdmin editarVeiculo(Long id, VeiculoForm form) {
        Veiculo veiculo = veiculos.findById(id).orElseThrow(() -> new NaoEncontradoException("Veículo não encontrado."));
        String placa = normalizarPlaca(form.placa());
        veiculos.findByPlacaIgnoreCase(placa)
                .filter(outro -> !outro.getId().equals(id))
                .ifPresent(outro -> {
                    throw new RegraNegocioException("Já existe um veículo com a placa " + placa + ".");
                });
        boolean desativando = form.ativo() != null && !form.ativo() && veiculo.isAtivo();
        if (desativando && !viagens.findByVeiculoIdAndStatusIn(id, StatusViagem.EM_CURSO).isEmpty()) {
            throw new RegraNegocioException(veiculo.getNome() + " está em viagem agora. Desative depois que a viagem terminar.");
        }
        veiculo.setNome(form.nome().trim());
        veiculo.setPlaca(placa);
        veiculo.setTipo(form.tipo());
        veiculo.setCapacidade(form.capacidade());
        if (form.ativo() != null) {
            veiculo.setAtivo(form.ativo());
        }
        return VeiculoAdmin.de(veiculo);
    }

    // ---------------------------------------------------------------- linhas e horários

    @Transactional(readOnly = true)
    public List<LinhaAdmin> linhas() {
        return linhas.findAllByOrderByIdAsc().stream().map(LinhaAdmin::de).toList();
    }

    @Transactional
    public LinhaAdmin criarLinha(LinhaForm form) {
        Linha linha = new Linha(form.nome().trim(), form.origem().trim(), form.destino().trim());
        return LinhaAdmin.de(linhas.save(linha));
    }

    @Transactional
    public LinhaAdmin editarLinha(Long id, LinhaForm form) {
        Linha linha = linha(id);
        linha.setNome(form.nome().trim());
        linha.setOrigem(form.origem().trim());
        linha.setDestino(form.destino().trim());
        return LinhaAdmin.de(linha);
    }

    @Transactional
    public LinhaAdmin criarHorario(Long linhaId, HorarioForm form) {
        Linha linha = linha(linhaId);
        LocalTime hora = LocalTime.parse(form.horaSaida());
        verificarHorarioDuplicado(linha, hora, null);
        Horario horario = linha.adicionarHorario(hora, textoOuNulo(form.localSaida()), veiculoEscalado(form.veiculoId()));
        if (form.ativo() != null) {
            horario.setAtivo(form.ativo());
        }
        // flush para o novo registro já voltar com id
        linhas.saveAndFlush(linha);
        return LinhaAdmin.de(linha);
    }

    @Transactional
    public LinhaAdmin editarHorario(Long id, HorarioForm form) {
        Horario horario = horarios.findById(id).orElseThrow(() -> new NaoEncontradoException("Horário não encontrado."));
        LocalTime hora = LocalTime.parse(form.horaSaida());
        verificarHorarioDuplicado(horario.getLinha(), hora, id);
        horario.setHoraSaida(hora);
        horario.setLocalSaida(textoOuNulo(form.localSaida()));
        horario.setVeiculoPadrao(veiculoEscalado(form.veiculoId()));
        if (form.ativo() != null) {
            horario.setAtivo(form.ativo());
        }
        return LinhaAdmin.de(horario.getLinha());
    }

    // ---------------------------------------------------------------- paradas

    @Transactional
    public LinhaAdmin adicionarParada(Long linhaId, ParadaForm form) {
        Linha linha = linha(linhaId);
        linha.adicionarParada(form.nome().trim(), textoOuNulo(form.descricao()),
                form.latitude(), form.longitude(), form.minutosDesdeSaida());
        // flush para o novo registro já voltar com id
        linhas.saveAndFlush(linha);
        return LinhaAdmin.de(linha);
    }

    @Transactional
    public LinhaAdmin editarParada(Long id, ParadaForm form) {
        Parada parada = parada(id);
        parada.setNome(form.nome().trim());
        parada.setDescricao(textoOuNulo(form.descricao()));
        parada.setLatitude(form.latitude());
        parada.setLongitude(form.longitude());
        parada.setMinutosDesdeSaida(form.minutosDesdeSaida());
        return LinhaAdmin.de(parada.getLinha());
    }

    /** Troca a parada de lugar com a vizinha de cima ou de baixo. */
    @Transactional
    public LinhaAdmin moverParada(Long id, boolean paraCima) {
        Parada parada = parada(id);
        List<Parada> ordenadas = ordenadas(parada.getLinha());
        int indice = ordenadas.indexOf(parada);
        int vizinho = paraCima ? indice - 1 : indice + 1;
        if (vizinho < 0 || vizinho >= ordenadas.size()) {
            return LinhaAdmin.de(parada.getLinha());
        }
        Parada outra = ordenadas.get(vizinho);
        int ordem = parada.getOrdem();
        parada.setOrdem(outra.getOrdem());
        outra.setOrdem(ordem);
        return LinhaAdmin.de(parada.getLinha());
    }

    @Transactional
    public LinhaAdmin excluirParada(Long id) {
        Parada parada = parada(id);
        Linha linha = parada.getLinha();
        if (linha.getParadas().size() <= 2) {
            throw new RegraNegocioException("Uma linha precisa ter pelo menos duas paradas.");
        }
        if (fila.existsByParadaId(id)) {
            throw new RegraNegocioException("Esta parada já tem registros de embarque. Edite os dados dela em vez de excluir.");
        }
        linha.getParadas().remove(parada);
        List<Parada> restantes = ordenadas(linha);
        for (int i = 0; i < restantes.size(); i++) {
            restantes.get(i).setOrdem(i + 1);
        }
        return LinhaAdmin.de(linha);
    }

    // ---------------------------------------------------------------- contas

    @Transactional(readOnly = true)
    public List<UsuarioAdmin> motoristas() {
        return usuarios.findByPerfilOrderByNomeAsc(Perfil.MOTORISTA).stream().map(UsuarioAdmin::de).toList();
    }

    @Transactional
    public UsuarioAdmin criarMotorista(NovoMotorista form) {
        String email = form.email().trim().toLowerCase();
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw new RegraNegocioException("Já existe uma conta com este e-mail.");
        }
        Usuario motorista = new Usuario(form.nome().trim(), email, encoder.encode(form.senha()), Perfil.MOTORISTA);
        return UsuarioAdmin.de(usuarios.save(motorista));
    }

    @Transactional
    public UsuarioAdmin editarUsuario(Long id, EdicaoUsuario form) {
        Usuario usuario = usuarios.findById(id).orElseThrow(() -> new NaoEncontradoException("Conta não encontrada."));
        if (usuario.getPerfil() == Perfil.ADMIN && !form.ativo()) {
            throw new RegraNegocioException("Contas da administração não podem ser desativadas por aqui.");
        }
        if (!form.ativo() && usuario.getPerfil() == Perfil.MOTORISTA
                && !viagens.findByMotoristaIdAndStatusIn(id, StatusViagem.EM_CURSO).isEmpty()) {
            throw new RegraNegocioException("Este motorista está em viagem agora. Desative depois que a viagem terminar.");
        }
        usuario.setNome(form.nome().trim());
        usuario.setAtivo(form.ativo());
        return UsuarioAdmin.de(usuario);
    }

    /** Usado quando um aluno ou motorista esquece a senha e procura a administração. */
    @Transactional
    public UsuarioAdmin redefinirSenha(RedefinirSenha form) {
        Usuario usuario = usuarios.findByEmailIgnoreCase(form.email().trim())
                .orElseThrow(() -> new NaoEncontradoException("Nenhuma conta com o e-mail " + form.email().trim() + "."));
        usuario.setSenhaHash(encoder.encode(form.novaSenha()));
        return UsuarioAdmin.de(usuario);
    }

    // ---------------------------------------------------------------- apoio

    private Linha linha(Long id) {
        return linhas.findById(id).orElseThrow(() -> new NaoEncontradoException("Linha não encontrada."));
    }

    private Parada parada(Long id) {
        return paradas.findById(id).orElseThrow(() -> new NaoEncontradoException("Parada não encontrada."));
    }

    private static List<Parada> ordenadas(Linha linha) {
        return linha.getParadas().stream().sorted(Comparator.comparingInt(Parada::getOrdem)).toList();
    }

    private Veiculo veiculoEscalado(Long veiculoId) {
        if (veiculoId == null) {
            return null;
        }
        Veiculo veiculo = veiculos.findById(veiculoId).orElseThrow(() -> new NaoEncontradoException("Veículo não encontrado."));
        if (!veiculo.isAtivo()) {
            throw new RegraNegocioException(veiculo.getNome() + " está desativado e não pode ser escalado.");
        }
        return veiculo;
    }

    private static void verificarHorarioDuplicado(Linha linha, LocalTime hora, Long ignorarId) {
        boolean existe = linha.getHorarios().stream()
                .anyMatch(h -> h.isAtivo() && h.getHoraSaida().equals(hora) && !h.getId().equals(ignorarId));
        if (existe) {
            throw new RegraNegocioException("Já existe uma saída às " + hora + " nesta linha.");
        }
    }

    private static String normalizarPlaca(String placa) {
        return placa.trim().toUpperCase();
    }

    private static String textoOuNulo(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
