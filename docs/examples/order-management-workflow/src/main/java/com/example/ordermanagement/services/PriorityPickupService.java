package com.example.ordermanagement.services;

import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for scheduling priority pickups.
 * 
 * Called by the schedulePriorityPickupTask in the shippingProcess.
 * Schedules express/overnight pickup.
 */
@Component("priorityPickupService")
public class PriorityPickupService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(PriorityPickupService.class);

    @Override
    public void execute() {
        logger.info("Scheduling priority pickup for order: {}", getVariable("orderId"));
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("scheduled", true);
        outputVariables.put("scheduledTime", new Date(System.currentTimeMillis() + 4 * 60 * 60 * 1000)); // +4 hours
        outputVariables.put("status", "IN_TRANSIT");
        
        setVariables(outputVariables);
    }
}
