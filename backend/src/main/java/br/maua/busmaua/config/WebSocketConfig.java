package br.maua.busmaua.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

/**
 * Canal em tempo real (STOMP sobre WebSocket).
 * Tópicos publicados:
 *  /topic/frota                  posição e status de cada viagem
 *  /topic/viagens/{id}/fila      a fila da viagem mudou
 *  /topic/notificacoes           há notificação nova (geral ou para um usuário)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${busmaua.cors.origens}")
    private String origens;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] padroes = Arrays.stream(origens.split(",")).map(String::trim).toArray(String[]::new);
        registry.addEndpoint("/ws").setAllowedOriginPatterns(padroes);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}
