package com.example.ordermanagement.services;

import com.example.ordermanagement.config.ServiceProperties;
import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.UUID;

/**
 * Service for generating shipping labels.
 * 
 * Called by the generateShippingLabelTask in the shippingProcess.
 * Creates shipping labels and tracking numbers.
 */
@Component("shippingLabelService")
public class ShippingLabelService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(ShippingLabelService.class);

    @Autowired
    private ServiceProperties serviceProperties;

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Generating shipping label for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        logger.info("Using shipping provider: {} at {}", 
            serviceProperties.getShipping().getProvider(), 
            serviceProperties.getShipping().getApiUrl());
        
        String trackingNumber = "TRK-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        String labelFormat = serviceProperties.getShipping().getLabelFormat();
        String labelUrl = serviceProperties.getShipping().getApiUrl() + "/labels/" + trackingNumber + "." + labelFormat.toLowerCase();
        
        integrationContext.addOutBoundVariable("labelUrl", labelUrl);
        integrationContext.addOutBoundVariable("trackingId", trackingNumber);
        integrationContext.addOutBoundVariable("provider", serviceProperties.getShipping().getProvider());
        integrationContext.addOutBoundVariable("labelFormat", labelFormat);
        integrationContext.addOutBoundVariable("generatedAt", new Date());
        
        return integrationContext;
    }
}
