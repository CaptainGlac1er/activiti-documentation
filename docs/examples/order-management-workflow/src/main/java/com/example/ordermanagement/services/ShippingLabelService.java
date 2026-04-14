package com.example.ordermanagement.services;

import com.example.ordermanagement.config.ServiceProperties;
import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service for generating shipping labels.
 * 
 * Called by the generateShippingLabelTask in the shippingProcess.
 * Creates shipping labels and tracking numbers.
 */
@Component("shippingLabelService")
public class ShippingLabelService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(ShippingLabelService.class);

    @Autowired
    private ServiceProperties serviceProperties;

    @Override
    public void execute() {
        logger.info("Generating shipping label for order: {}", getVariable("orderId"));
        logger.info("Using shipping provider: {} at {}", 
            serviceProperties.getShipping().getProvider(), 
            serviceProperties.getShipping().getApiUrl());
        
        String trackingNumber = "TRK-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        String labelFormat = serviceProperties.getShipping().getLabelFormat();
        String labelUrl = serviceProperties.getShipping().getApiUrl() + "/labels/" + trackingNumber + "." + labelFormat.toLowerCase();
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("labelUrl", labelUrl);
        outputVariables.put("trackingId", trackingNumber);
        outputVariables.put("provider", serviceProperties.getShipping().getProvider());
        outputVariables.put("labelFormat", labelFormat);
        outputVariables.put("generatedAt", new Date());
        
        setVariables(outputVariables);
    }
}
