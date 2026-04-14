package com.example.ordermanagement.services;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Service for scheduling priority pickups.
 * 
 * Called by the schedulePriorityPickupTask in the shippingProcess.
 * Schedules express/overnight pickup.
 */
@Component("priorityPickupService")
public class PriorityPickupService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(PriorityPickupService.class);

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Scheduling priority pickup for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        
        integrationContext.addOutBoundVariable("scheduled", true);
        integrationContext.addOutBoundVariable("scheduledTime", new Date(System.currentTimeMillis() + 4 * 60 * 60 * 1000)); // +4 hours
        integrationContext.addOutBoundVariable("status", "IN_TRANSIT");
        
        return integrationContext;
    }
}
