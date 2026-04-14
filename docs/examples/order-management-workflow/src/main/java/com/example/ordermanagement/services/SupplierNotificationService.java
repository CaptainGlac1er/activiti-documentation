package com.example.ordermanagement.services;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Service for notifying suppliers.
 * 
 * Called by the notifySupplierTask in the inventoryProcess.
 * Sends notifications to suppliers about inventory needs.
 */
@Component("supplierNotificationService")
public class SupplierNotificationService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(SupplierNotificationService.class);

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Notifying supplier for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        
        integrationContext.addOutBoundVariable("notified", true);
        integrationContext.addOutBoundVariable("notifiedAt", new Date());
        
        return integrationContext;
    }
}
