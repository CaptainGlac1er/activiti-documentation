package com.example.ordermanagement.services;

import com.example.ordermanagement.config.ServiceProperties;
import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Service for checking stock availability.
 * 
 * Called by the checkStockAvailabilityTask in the inventoryProcess.
 * Verifies if items are in stock for the order.
 */
@Component("stockCheckService")
public class StockCheckService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(StockCheckService.class);

    @Autowired
    private ServiceProperties serviceProperties;

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Checking stock availability for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        logger.info("Using inventory system: {}", serviceProperties.getInventory().getSystemUrl());
        
        String orderId = (String) integrationContext.getInBoundVariables().get("orderId");
        Object orderItemsObj = integrationContext.getInBoundVariables().get("orderItems");
        
        int minThreshold = serviceProperties.getInventory().getMinStockThreshold();
        
        // Simulate stock check
        // In production, this would query: serviceProperties.getInventory().getSystemUrl()
        boolean inStock = true;
        
        logger.info("Stock check result for order {}: {} (min threshold: {})", 
            orderId, inStock ? "Available" : "Not Available", minThreshold);
        
        integrationContext.addOutBoundVariable("available", inStock);
        integrationContext.addOutBoundVariable("levels", Map.of("item1", 100, "item2", 50));
        integrationContext.addOutBoundVariable("status", inStock ? "IN_STOCK" : "OUT_OF_STOCK");
        integrationContext.addOutBoundVariable("minThreshold", minThreshold);
        integrationContext.addOutBoundVariable("inventorySystem", serviceProperties.getInventory().getSystemUrl());
        
        return integrationContext;
    }
}
