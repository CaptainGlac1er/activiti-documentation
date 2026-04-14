package com.example.ordermanagement.services;

import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for notifying suppliers.
 * 
 * Called by the notifySupplierTask in the inventoryProcess.
 * Sends notifications to suppliers about inventory needs.
 */
@Component("supplierNotificationService")
public class SupplierNotificationService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(SupplierNotificationService.class);

    @Override
    public void execute() {
        logger.info("Notifying supplier for order: {}", getVariable("orderId"));
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("notified", true);
        outputVariables.put("notifiedAt", new Date());
        
        setVariables(outputVariables);
    }
}
