package com.example.ordermanagement.services;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Service for updating order status in the order management system.
 * 
 * Called by the updateOrderStatusTask in the orderManagementProcess.
 * Updates the final order status and records completion details.
 */
@Component("orderStatusService")
public class OrderStatusService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(OrderStatusService.class);

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Updating order status");
        
        String orderId = (String) integrationContext.getInBoundVariables().get("orderId");
        String orderStatus = (String) integrationContext.getInBoundVariables().get("orderStatus");
        String trackingNumber = (String) integrationContext.getInBoundVariables().get("trackingNumber");
        
        // In production, this would update the order in the database/OMS
        logger.info("Order {} status updated to {} with tracking: {}", 
            orderId, orderStatus, trackingNumber);
        
        integrationContext.addOutBoundVariable("updatedStatus", orderStatus);
        integrationContext.addOutBoundVariable("updatedAt", new Date());
        integrationContext.addOutBoundVariable("updateSuccess", true);
        
        return integrationContext;
    }
}
