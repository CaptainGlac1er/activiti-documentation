package com.example.ordermanagement.services;

import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for scheduling regular pickups.
 * 
 * Called by the scheduleRegularPickupTask in the shippingProcess.
 * Schedules standard ground shipping pickup.
 */
@Component("regularPickupService")
public class RegularPickupService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(RegularPickupService.class);

    @Override
    public void execute() {
        logger.info("Scheduling regular pickup for order: {}", getVariable("orderId"));
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("scheduled", true);
        outputVariables.put("scheduledTime", new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000)); // +24 hours
        outputVariables.put("status", "IN_TRANSIT");
        
        setVariables(outputVariables);
    }
}
