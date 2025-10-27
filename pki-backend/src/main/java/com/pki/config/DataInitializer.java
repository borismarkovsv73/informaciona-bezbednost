package com.pki.config;

import com.pki.entity.User;
import com.pki.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setEnabled(true);
            userRepository.save(admin);
            System.out.println("=================================================");
            System.out.println("DEFAULT ADMIN USER CREATED SUCCESSFULLY!");
            System.out.println("Username: admin");
            System.out.println("Password: admin123");
            System.out.println("Role: ADMIN");
            System.out.println("=================================================");
        } else {
            System.out.println("Admin user already exists");
            User existingAdmin = userRepository.findByUsername("admin").orElse(null);
            if (existingAdmin != null) {
                System.out.println("Existing admin user: " + existingAdmin.getUsername() + 
                                 ", enabled: " + existingAdmin.isEnabled() + 
                                 ", role: " + existingAdmin.getRole());
            }
        }
        
        // Print total user count
        long userCount = userRepository.count();
        System.out.println("Total users in database: " + userCount);
    }
}