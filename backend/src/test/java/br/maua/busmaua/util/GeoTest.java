package br.maua.busmaua.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GeoTest {

    @Test
    void distanciaEntreOMesmoPontoEZero() {
        assertEquals(0, Geo.distanciaMetros(-23.6478, -46.5733, -23.6478, -46.5733), 0.001);
    }

    @Test
    void distanciaAproximadaDeUmQuilometro() {
        // 0,009 grau de latitude ≈ 1 km
        double metros = Geo.distanciaMetros(-23.6478, -46.5733, -23.6388, -46.5733);
        assertTrue(metros > 950 && metros < 1050, "distância calculada: " + metros);
    }

    @Test
    void usaVelocidadeMinimaQuandoVeiculoEstaParado() {
        int parado = Geo.minutosAte(-23.6478, -46.5733, -23.6388, -46.5733, 0.0);
        int rapido = Geo.minutosAte(-23.6478, -46.5733, -23.6388, -46.5733, 40.0);
        assertTrue(parado >= rapido);
        assertTrue(parado > 0);
    }
}
