package com.example.ordermanagement.services;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Service for updating tracking system.
 * 
 * Called by the updateTrackingSystemTask in the shippingProcess.
 * Updates shipment tracking information.
 */
@Component("trackingUpdateService")
public class TrackingUpdateService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(TrackingUpdateService.class);

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Updating tracking system for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        
        integrationContext.addOutBoundVariable("updated", true);
        integrationContext.addOutBoundVariable("updatedAt", new Date());
        
        return integrationContext;
    }
}
