package br.maua.busmaua.util;

import java.time.*;
import java.time.format.DateTimeFormatter;

/** Datas e horas sempre no fuso do campus, independente do servidor. */
public final class Fuso {

    public static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private Fuso() {
    }

    public static LocalDateTime agora() {
        return LocalDateTime.now(ZONA);
    }

    public static LocalDate hoje() {
        return LocalDate.now(ZONA);
    }

    public static LocalTime horaAtual() {
        return LocalTime.now(ZONA);
    }

    public static String hhmm(LocalTime hora) {
        return hora.format(HH_MM);
    }
}
