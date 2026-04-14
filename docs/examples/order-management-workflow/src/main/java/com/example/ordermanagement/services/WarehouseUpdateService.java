package com.example.ordermanagement.services;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Service for updating warehouse system.
 * 
 * Called by the updateWarehouseSystemTask in the inventoryProcess.
 * Updates warehouse inventory records.
 */
@Component("warehouseUpdateService")
public class WarehouseUpdateService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(WarehouseUpdateService.class);

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Updating warehouse system for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        
        integrationContext.addOutBoundVariable("updated", true);
        integrationContext.addOutBoundVariable("updatedAt", new Date());
        
        return integrationContext;
    }
}
