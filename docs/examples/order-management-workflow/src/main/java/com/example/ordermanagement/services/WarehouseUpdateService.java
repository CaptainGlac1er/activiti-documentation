package com.example.ordermanagement.services;

import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for updating warehouse system.
 * 
 * Called by the updateWarehouseSystemTask in the inventoryProcess.
 * Updates warehouse inventory records.
 */
@Component("warehouseUpdateService")
public class WarehouseUpdateService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(WarehouseUpdateService.class);

    @Override
    public void execute() {
        logger.info("Updating warehouse system for order: {}", getVariable("orderId"));
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("updated", true);
        outputVariables.put("updatedAt", new Date());
        
        setVariables(outputVariables);
    }
}
