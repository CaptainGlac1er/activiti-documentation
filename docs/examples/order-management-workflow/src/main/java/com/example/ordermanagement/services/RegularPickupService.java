package com.example.ordermanagement.services;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Service for scheduling regular pickups.
 * 
 * Called by the scheduleRegularPickupTask in the shippingProcess.
 * Schedules standard ground shipping pickup.
 */
@Component("regularPickupService")
public class RegularPickupService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(RegularPickupService.class);

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Scheduling regular pickup for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        
        integrationContext.addOutBoundVariable("scheduled", true);
        integrationContext.addOutBoundVariable("scheduledTime", new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000)); // +24 hours
        integrationContext.addOutBoundVariable("status", "IN_TRANSIT");
        
        return integrationContext;
    }
}
