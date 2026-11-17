package br.maua.busmaua;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BusMauaApplication {

    public static void main(String[] args) {
        SpringApplication.run(BusMauaApplication.class, args);
    }
}
