package br.maua.busmaua.config;

import br.maua.busmaua.domain.*;
import br.maua.busmaua.repository.*;
import br.maua.busmaua.util.Fuso;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Popula o banco vazio com a frota, as linhas e as contas de acesso.
 * Com busmaua.demo.habilitado=true também cria alunos fictícios, um histórico de
 * viagens das últimas semanas (para o painel de demanda) e uma fila de exemplo.
 *
 * As coordenadas das paradas são aproximadas e podem ser ajustadas aqui.
 */
@Component
@RequiredArgsConstructor
public class CargaInicial implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CargaInicial.class);
    private static final String SENHA_PADRAO = "maua123";

    private final UsuarioRepository usuarios;
    private final VeiculoRepository veiculos;
    private final LinhaRepository linhas;
    private final ViagemRepository viagens;
    private final FilaRepository fila;
    private final PasswordEncoder encoder;

    @Value("${busmaua.demo.habilitado:true}")
    private boolean demo;

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarios.count() > 0) {
            return;
        }
        String senha = encoder.encode(SENHA_PADRAO);

        // ----- contas
        usuarios.save(new Usuario("Nicolas Alencar", "aluno@maua.br", senha, Perfil.ALUNO));
        Usuario carlos = usuarios.save(new Usuario("Carlos Souza", "carlos@maua.br", senha, Perfil.MOTORISTA));
        usuarios.save(new Usuario("Marcos Lima", "marcos@maua.br", senha, Perfil.MOTORISTA));
        usuarios.save(new Usuario("Administração Mauá", "admin@maua.br", senha, Perfil.ADMIN));

        // ----- frota
        Veiculo onibus01 = veiculos.save(new Veiculo("Ônibus 01", "ABC-1D21", TipoVeiculo.ONIBUS, 44));
        Veiculo onibus02 = veiculos.save(new Veiculo("Ônibus 02", "ABC-1D23", TipoVeiculo.ONIBUS, 44));
        Veiculo van03 = veiculos.save(new Veiculo("Van 03", "DEF-2G31", TipoVeiculo.VAN, 16));
        Veiculo van05 = veiculos.save(new Veiculo("Van 05", "DEF-2G34", TipoVeiculo.VAN, 16));

        // ----- linhas, paradas e horários
        Linha ida = new Linha("Mauá → Estação São Caetano", "Instituto Mauá", "Estação São Caetano");
        ida.adicionarParada("Instituto Mauá · Bloco A", "Saída", -23.64780, -46.57330, 0);
        ida.adicionarParada("Av. Goiás · Ponto 2", null, -23.63950, -46.56710, 6);
        ida.adicionarParada("Praça da Moça", null, -23.63000, -46.56400, 12);
        ida.adicionarParada("Estação São Caetano", "Chegada", -23.62050, -46.56000, 18);
        ida.adicionarHorario(LocalTime.of(12, 30), "Bloco A", van05);
        ida.adicionarHorario(LocalTime.of(17, 10), "Bloco A", onibus01);
        ida.adicionarHorario(LocalTime.of(18, 40), "Bloco A", onibus02);
        ida.adicionarHorario(LocalTime.of(19, 0), "Bloco A", van05);
        ida.adicionarHorario(LocalTime.of(21, 0), "Bloco A", onibus01);
        ida.adicionarHorario(LocalTime.of(22, 40), "Bloco A", onibus02);
        linhas.save(ida);

        Linha volta = new Linha("Estação São Caetano → Mauá", "Estação São Caetano", "Instituto Mauá");
        volta.adicionarParada("Estação São Caetano", "Saída", -23.62050, -46.56000, 0);
        volta.adicionarParada("Praça da Moça", null, -23.63000, -46.56400, 6);
        volta.adicionarParada("Av. Goiás · Ponto 1", null, -23.63930, -46.56740, 12);
        volta.adicionarParada("Instituto Mauá · Bloco A", "Chegada", -23.64780, -46.57330, 18);
        volta.adicionarHorario(LocalTime.of(6, 50), "Estação", onibus01);
        volta.adicionarHorario(LocalTime.of(7, 20), "Estação", onibus02);
        volta.adicionarHorario(LocalTime.of(12, 50), "Estação", van03);
        volta.adicionarHorario(LocalTime.of(18, 0), "Estação", van03);
        volta.adicionarHorario(LocalTime.of(18, 50), "Estação", onibus01);
        linhas.save(volta);

        log.info("Contas criadas (senha {}): aluno@maua.br, carlos@maua.br, marcos@maua.br, admin@maua.br", SENHA_PADRAO);

        if (demo) {
            List<Usuario> alunosDemo = criarAlunosDemo(senha);
            criarHistorico(List.of(ida, volta), alunosDemo, carlos);
            criarFilaDeExemplo(ida, alunosDemo);
            log.info("Dados de demonstração criados.");
        }
    }

    private List<Usuario> criarAlunosDemo(String senha) {
        String[] nomes = {
                "Ana Paula Ferreira", "Lucas Martins", "Beatriz Santos", "Rafael Oliveira", "Júlia Costa",
                "Pedro Henrique Alves", "Mariana Rocha", "Gabriel Pereira", "Larissa Gomes", "Thiago Ribeiro",
                "Camila Carvalho", "Felipe Araújo", "Isabela Melo", "Gustavo Barbosa", "Letícia Cardoso",
                "Matheus Teixeira", "Bruna Correia", "Vinícius Dias", "Amanda Moreira", "Leonardo Nunes",
                "Carolina Freitas", "Rodrigo Mendes", "Fernanda Lopes", "Diego Castro", "Natália Pinto",
                "André Monteiro", "Vitória Ramos", "Eduardo Vieira", "Sofia Azevedo", "Caio Batista",
                "Helena Duarte", "Bruno Farias", "Lívia Campos", "Renan Machado", "Clara Moura",
                "Igor Sales", "Yasmin Rezende", "Daniel Prado", "Alice Brandão", "Samuel Reis",
                "Giovana Lima", "Henrique Tavares", "Manuela Fonseca", "Otávio Cunha", "Valentina Siqueira",
                "Murilo Andrade", "Lara Bastos", "Enzo Pacheco", "Rebeca Vasconcelos", "Arthur Lacerda"};
        List<Usuario> lista = new ArrayList<>();
        for (int i = 0; i < nomes.length; i++) {
            String email = String.format("aluno%02d@maua.br", i + 1);
            lista.add(usuarios.save(new Usuario(nomes[i], email, senha, Perfil.ALUNO)));
        }
        return lista;
    }

    /** Três semanas de viagens encerradas, com mais procura nos horários de pico. */
    private void criarHistorico(List<Linha> todasAsLinhas, List<Usuario> alunos, Usuario motorista) {
        Map<LocalTime, Integer> procuraMedia = Map.ofEntries(
                Map.entry(LocalTime.of(6, 50), 26), Map.entry(LocalTime.of(7, 20), 40),
                Map.entry(LocalTime.of(12, 30), 9), Map.entry(LocalTime.of(12, 50), 7),
                Map.entry(LocalTime.of(17, 10), 30), Map.entry(LocalTime.of(18, 0), 12),
                Map.entry(LocalTime.of(18, 40), 42), Map.entry(LocalTime.of(18, 50), 22),
                Map.entry(LocalTime.of(19, 0), 14), Map.entry(LocalTime.of(21, 0), 18),
                Map.entry(LocalTime.of(22, 40), 35));
        Random random = new Random(42);
        LocalDate hoje = Fuso.hoje();

        for (int diasAtras = 21; diasAtras >= 1; diasAtras--) {
            LocalDate data = hoje.minusDays(diasAtras);
            if (data.getDayOfWeek() == DayOfWeek.SUNDAY) {
                continue;
            }
            boolean sabado = data.getDayOfWeek() == DayOfWeek.SATURDAY;

            for (Linha linha : todasAsLinhas) {
                List<Parada> paradas = linha.getParadas();
                for (Horario horario : linha.getHorarios()) {
                    int media = procuraMedia.getOrDefault(horario.getHoraSaida(), 15);
                    if (sabado) {
                        media = media / 3;
                    }
                    int solicitacoes = Math.max(0, media + random.nextInt(9) - 4);

                    Viagem viagem = new Viagem(horario, data);
                    viagem.setVeiculo(horario.getVeiculoPadrao());
                    viagem.setMotorista(motorista);
                    viagem.setStatus(StatusViagem.ENCERRADA);
                    Instant saida = data.atTime(horario.getHoraSaida()).atZone(Fuso.ZONA).toInstant();
                    viagem.setIniciadaEm(saida);
                    viagem.setEncerradaEm(saida.plus(Duration.ofMinutes(20)));
                    viagens.save(viagem);

                    int capacidade = viagem.capacidade();
                    int embarcados = 0;
                    for (int i = 0; i < Math.min(solicitacoes, alunos.size()); i++) {
                        Usuario aluno = alunos.get((i + diasAtras * 7) % alunos.size());
                        Parada parada = paradas.get(random.nextInt(paradas.size() - 1));
                        FilaEntrada entrada = new FilaEntrada(viagem, aluno, parada);
                        entrada.setEntrouEm(saida.minus(Duration.ofMinutes(5 + random.nextInt(25))));
                        // a maior parte confirma; parte desiste ou não cabe no veículo
                        if (embarcados < capacidade && random.nextDouble() < 0.85) {
                            entrada.setStatus(StatusFila.EMBARCADO);
                            entrada.setEmbarcadoEm(saida.plus(Duration.ofMinutes(parada.getMinutosDesdeSaida())));
                            entrada.setConfirmadoPor(random.nextBoolean() ? "ALUNO" : "MOTORISTA");
                            embarcados++;
                        } else {
                            entrada.setStatus(random.nextBoolean() ? StatusFila.SAIU : StatusFila.EXPIRADO);
                        }
                        fila.save(entrada);
                    }
                    // alguns embarcam sem usar o app (ajuste manual do motorista)
                    viagem.setLotacao(Math.min(capacidade, embarcados + random.nextInt(4)));
                }
            }
        }
    }

    /** Coloca alguns alunos na fila da próxima saída de hoje, para a tela do motorista não ficar vazia. */
    private void criarFilaDeExemplo(Linha ida, List<Usuario> alunos) {
        LocalTime agora = Fuso.horaAtual();
        Horario proximo = ida.getHorarios().stream()
                .filter(h -> h.getHoraSaida().isAfter(agora.plusMinutes(10)))
                .findFirst()
                .orElse(null);
        if (proximo == null || agora.isAfter(LocalTime.of(23, 0))) {
            return;
        }
        Viagem viagem = viagens.save(new Viagem(proximo, Fuso.hoje()));
        List<Parada> paradas = ida.getParadas();
        int[] pontos = {0, 0, 0, 1, 1};
        Instant base = Instant.now().minus(Duration.ofMinutes(15));
        for (int i = 0; i < pontos.length; i++) {
            FilaEntrada entrada = new FilaEntrada(viagem, alunos.get(i), paradas.get(pontos[i]));
            entrada.setEntrouEm(base.plus(Duration.ofMinutes(i * 2L)));
            fila.save(entrada);
        }
    }
}
