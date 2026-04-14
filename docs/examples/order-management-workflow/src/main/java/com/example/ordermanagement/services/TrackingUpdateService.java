package com.example.ordermanagement.services;

import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for updating tracking system.
 * 
 * Called by the updateTrackingSystemTask in the shippingProcess.
 * Updates shipment tracking information.
 */
@Component("trackingUpdateService")
public class TrackingUpdateService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(TrackingUpdateService.class);

    @Override
    public void execute() {
        logger.info("Updating tracking system for order: {}", getVariable("orderId"));
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("updated", true);
        outputVariables.put("updatedAt", new Date());
        
        setVariables(outputVariables);
    }
}
