package com.example.ordermanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.PropertySource;

/**
 * Main Spring Boot application for the Order Management Workflow System.
 * 
 * This application demonstrates a moderate-sized BPMN implementation with:
 * - 4 processes (1 main + 3 sub-processes)
 * - 45+ BPMN elements
 * - Comprehensive extension JSON files
 * - Multiple service task delegates
 * - REST API endpoints
 * 
 * @author Activiti Documentation Team
 * @version 1.0
 */
@SpringBootApplication
@ComponentScan(basePackages = "com.example.ordermanagement")
public class OrderManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderManagementApplication.class, args);
    }
}
