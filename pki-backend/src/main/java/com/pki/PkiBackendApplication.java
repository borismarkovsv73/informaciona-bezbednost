package com.pki;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.pki.entity")
@EnableJpaRepositories("com.pki.repository")
public class PkiBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(PkiBackendApplication.class, args);
    }

}