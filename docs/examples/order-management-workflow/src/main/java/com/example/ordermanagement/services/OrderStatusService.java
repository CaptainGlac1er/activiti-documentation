package com.example.ordermanagement.services;

import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for updating order status in the order management system.
 * 
 * Called by the updateOrderStatusTask in the orderManagementProcess.
 * Updates the final order status and records completion details.
 */
@Component("orderStatusService")
public class OrderStatusService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(OrderStatusService.class);

    @Override
    public void execute() {
        logger.info("Updating order status");
        
        String orderId = (String) getVariable("orderId");
        String orderStatus = (String) getVariable("orderStatus");
        String trackingNumber = (String) getVariable("trackingNumber");
        
        // In production, this would update the order in the database/OMS
        logger.info("Order {} status updated to {} with tracking: {}", 
            orderId, orderStatus, trackingNumber);
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("updatedStatus", orderStatus);
        outputVariables.put("updatedAt", new Date());
        outputVariables.put("updateSuccess", true);
        
        setVariables(outputVariables);
    }
}
