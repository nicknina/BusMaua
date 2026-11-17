package br.maua.busmaua.util;

public final class Geo {

    private static final double RAIO_TERRA_M = 6_371_000;

    /** Fator para compensar que o trajeto pelas ruas é maior que a linha reta. */
    private static final double FATOR_RUAS = 1.3;

    /** Velocidade usada quando o veículo está parado ou o GPS não informa. */
    private static final double VELOCIDADE_MEDIA_KMH = 18;

    private Geo() {
    }

    public static double distanciaMetros(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return RAIO_TERRA_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /**
     * Estimativa simples de chegada: distância em linha reta corrigida pelo fator de ruas,
     * dividida pela velocidade atual (com um mínimo, para não explodir no trânsito parado).
     */
    public static int minutosAte(double lat1, double lng1, double lat2, double lng2, Double velocidadeKmh) {
        double metros = distanciaMetros(lat1, lng1, lat2, lng2) * FATOR_RUAS;
        double velocidade = velocidadeKmh == null || velocidadeKmh < VELOCIDADE_MEDIA_KMH
                ? VELOCIDADE_MEDIA_KMH
                : velocidadeKmh;
        return (int) Math.ceil(metros / 1000.0 / velocidade * 60.0);
    }
}
