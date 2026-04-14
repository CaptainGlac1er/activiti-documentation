package com.example.ordermanagement.services;

import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for reserving inventory.
 * 
 * Called by the reserveInventoryTask in the inventoryProcess.
 * Reserves items for the order.
 */
@Component("inventoryReservationService")
public class InventoryReservationService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(InventoryReservationService.class);

    @Override
    public void execute() {
        logger.info("Reserving inventory for order: {}", getVariable("orderId"));
        
        String orderId = (String) getVariable("orderId");
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("reserved", Map.of("orderId", orderId, "reservedAt", new Date()));
        outputVariables.put("warehouse", "WH-001");
        outputVariables.put("status", "RESERVED");
        
        setVariables(outputVariables);
    }
}
