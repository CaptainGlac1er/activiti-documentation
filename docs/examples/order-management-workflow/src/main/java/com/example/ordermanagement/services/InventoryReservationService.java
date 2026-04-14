package com.example.ordermanagement.services;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Map;

/**
 * Service for reserving inventory.
 * 
 * Called by the reserveInventoryTask in the inventoryProcess.
 * Reserves items for the order.
 */
@Component("inventoryReservationService")
public class InventoryReservationService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(InventoryReservationService.class);

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Reserving inventory for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        
        String orderId = (String) integrationContext.getInBoundVariables().get("orderId");
        
        integrationContext.addOutBoundVariable("reserved", Map.of("orderId", orderId, "reservedAt", new Date()));
        integrationContext.addOutBoundVariable("warehouse", "WH-001");
        integrationContext.addOutBoundVariable("status", "RESERVED");
        
        return integrationContext;
    }
}
